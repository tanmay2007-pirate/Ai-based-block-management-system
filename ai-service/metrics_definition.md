# Scheduling metrics definition

For each corridor, `asset_availability_percentage` is:

`(total corridor-hours in the horizon - corridor-hours consumed by maintenance blocks) / total corridor-hours in the horizon * 100`.

The network average is the arithmetic mean of corridor percentages. `block_utilization_percentage` is:

`actual maintenance work time within a block / total block duration * 100`.

Example: a 168-hour corridor week with 12 hours of maintenance has availability
`(168 - 12) / 168 * 100 = 92.86%`. If 10 hours are active work inside that
12-hour block, utilization is `10 / 12 * 100 = 83.33%`.
