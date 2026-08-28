import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function CorridorTimeline({
  trains = [],
  blocks = []
}) {
  const ref = useRef(null);

  useEffect(() => {
    const width = 1100;
    const rowHeight = 52;
    const leftMargin = 190;

    const all = [
      ...trains.map(item => ({
        start: item.departure_time,
        end: item.arrival_time,
        label: item.train_number || 'Train',
        type: 'train',
        status: 'MOVEMENT'
      })),

      ...blocks.map(item => ({
        start: item.planned_start,
        end: item.planned_end,
        label: item.section || 'Maintenance block',
        type: 'block',
        status: String(item.status || 'PLANNED').toUpperCase()
      }))
    ].filter(item => item.start && item.end);

    const root = d3.select(ref.current);
    root.selectAll('*').remove();

    if (!all.length) {
      root
        .append('div')
        .attr('class', 'twin-empty')
        .html(`
          <div class="twin-empty-icon">⌁</div>
          <strong>No corridor activity</strong>
          <span>No train movements or maintenance blocks are scheduled.</span>
        `);

      return;
    }

    const min = d3.min(all, item => new Date(item.start));
    const max = d3.max(all, item => new Date(item.end));

    const x = d3
      .scaleTime()
      .domain([min, max])
      .range([leftMargin, width - 25]);

    const height = Math.max(
      210,
      all.length * rowHeight + 70
    );

    const svg = root
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('role', 'img');

    /* GRID */

    const ticks = x.ticks(8);

    svg
      .append('g')
      .selectAll('line')
      .data(ticks)
      .enter()
      .append('line')
      .attr('x1', tick => x(tick))
      .attr('x2', tick => x(tick))
      .attr('y1', 15)
      .attr('y2', height - 45)
      .attr('stroke', '#e7edf1')
      .attr('stroke-dasharray', '3 4');

    /* TIME AXIS */

    svg
      .append('g')
      .attr('transform', `translate(0,${height - 35})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(8)
          .tickFormat(d3.timeFormat('%H:%M'))
      )
      .call(axis => axis.select('.domain').attr('stroke', '#dce5e9'))
      .call(axis =>
        axis
          .selectAll('text')
          .attr('fill', '#728691')
          .attr('font-size', 10)
          .attr('font-weight', 700)
      );

    /* ROWS */

    all.forEach((item, index) => {
      const y = 18 + index * rowHeight;

      const start = x(new Date(item.start));
      const end = x(new Date(item.end));

      const duration = Math.max(7, end - start);

      /* row background */

      svg
        .append('rect')
        .attr('x', leftMargin)
        .attr('y', y - 6)
        .attr('width', width - leftMargin - 25)
        .attr('height', rowHeight - 4)
        .attr('fill', index % 2 === 0 ? '#fbfcfd' : '#ffffff')
        .attr('rx', 5);

      /* label */

      svg
        .append('text')
        .attr('x', 12)
        .attr('y', y + 15)
        .attr('fill', '#19384b')
        .attr('font-size', 11)
        .attr('font-weight', 800)
        .text(item.label);

      svg
        .append('text')
        .attr('x', 12)
        .attr('y', y + 31)
        .attr('fill', '#8a9aa3')
        .attr('font-size', 9)
        .attr('font-weight', 700)
        .text(item.type === 'train' ? 'TRAIN MOVEMENT' : item.status);

      /* movement */

      if (item.type === 'train') {
        svg
          .append('rect')
          .attr('x', start)
          .attr('y', y + 9)
          .attr('width', duration)
          .attr('height', 12)
          .attr('rx', 6)
          .attr('fill', '#4c9bae');

        svg
          .append('circle')
          .attr('cx', start)
          .attr('cy', y + 15)
          .attr('r', 5)
          .attr('fill', '#286f82');
      }

      /* maintenance block */

      if (item.type === 'block') {
        const conflict =
          item.status === 'CONFLICT' ||
          item.status === 'REJECTED';

        svg
          .append('rect')
          .attr('x', start)
          .attr('y', y + 4)
          .attr('width', duration)
          .attr('height', 22)
          .attr('rx', 5)
          .attr(
            'fill',
            conflict ? '#c14e4e' : '#d18b2e'
          );

        svg
          .append('text')
          .attr('x', start + 8)
          .attr('y', y + 19)
          .attr('fill', '#fff')
          .attr('font-size', 9)
          .attr('font-weight', 800)
          .text(item.status);
      }
    });

  }, [trains, blocks]);

  return <div className="timeline-wrap twin-d3-timeline" ref={ref} />;
}