import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function CorridorTimeline({ trains = [], blocks = [] }) {
  const ref = useRef(null);
  useEffect(() => {
    const width = 900; const rowHeight = 44; const height = Math.max(160, (trains.length + blocks.length) * rowHeight + 50);
    const root = d3.select(ref.current); root.selectAll('*').remove();
    const all = [...trains.map(item => ({ start: item.departure_time, end: item.arrival_time, label: item.train_number, type: 'train' })), ...blocks.map(item => ({ start: item.planned_start, end: item.planned_end, label: item.status, type: 'block' }))];
    if (!all.length) { root.append('text').attr('x', 20).attr('y', 30).text('No corridor movements or blocks found.'); return; }
    const min = d3.min(all, item => new Date(item.start)); const max = d3.max(all, item => new Date(item.end));
    const x = d3.scaleTime().domain([min, max]).range([150, width - 20]);
    const svg = root.append('svg').attr('viewBox', `0 0 ${width} ${height}`).attr('role', 'img');
    svg.append('g').attr('transform', `translate(0,${height - 25})`).call(d3.axisBottom(x).ticks(6));
    all.forEach((item, index) => {
      const y = 15 + index * rowHeight; const start = x(new Date(item.start)); const end = x(new Date(item.end));
      svg.append('text').attr('x', 8).attr('y', y + 14).text(item.label || item.type);
      svg.append('rect').attr('x', start).attr('y', y).attr('width', Math.max(4, end - start)).attr('height', item.type === 'block' ? 24 : 10).attr('fill', item.type === 'block' ? '#d18b2e' : '#4c9bae').attr('rx', 3);
    });
  }, [trains, blocks]);
  return <div className="timeline-wrap" ref={ref} />;
}
