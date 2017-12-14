# artillery-plugin-datadog

[Artillery](http://artillery.io) plugin that reports load test results to [Datadog](datadoghq.com).

The plugin uses [datadog-metrics](https://www.npmjs.com/package/datadog-metrics) to submit Artillery metrics to Datadog over
HTTPS and does not require a StatsD server (Datadog Agent). An alternative to this is [artillery-plugin-statsd](https://github.com/shoreditch-ops/artillery-plugin-statsd)
which uses StatsD.

## Usage

- Install this plugin and Artillery.
- Create a configuration file for Artillery. Specify Datadog as the plugin to use.

```yaml
# test.yaml
config:
  target: https://skynet.org
  phases:
    - duration: 3
      arrivalRate: 15
  plugins:
    datadog:
      # Custom hostname (leave blank if not desired)
      host: ''
      # Custom metric prefix (defaults to 'artillery.')
      prefix: 'artillery.'
      # Additional tags for all metrics
      tags:
        - 'mode:test'
scenarios:
  - flow:
      - get:
          url: /status

```

Run artillery and specify Datadog API key as an environment variable.

```bash
$ DATADOG_API_KEY=xxxxxxxxxxxx artillery run test.yaml
```

## Metrics

The following metrics are collected from Artillery and sent to Datadog.

- **artillery.scenarios.created**: Number of scenarios created
- **artillery.scenarios.completed**: Number of scenarios completed
- **artillery.requests.completed**: Number of HTTP requests completed
- **artillery.response.2xx**: Aggregate count of all responses whose HTTP code was in the `2xx` range
- **artillery.response.3xx**: Aggregate count of all responses whose HTTP code was in the `3xx` range
- **artillery.response.4xx**: Aggregate count of all responses whose HTTP code was in the `4xx` range
- **artillery.response.5xx**: Aggregate count of all responses whose HTTP code was in the `5xx` range
- **artillery.response.200**: Count of responses whose HTTP code was `200` (exactly). Similarly named metric is repeated for each response status code
- **artillery.response.ok_pct**: Percentage (in the range `0 - 100`) of responses that returned with a `2xx` or `3xx` status code
- **artillery.latency.min**: Min latency
- **artillery.latency.max**: Max latency
- **artillery.latency.p99**: 99th percentile latency
- **artillery.latency.p95**: 95th percentile latency
- **artillery.latency.median**: Median latency

## Development

Artillery plugin system documentation is at [github.com/shoreditch-ops/artillery](https://github.com/shoreditch-ops/artillery/blob/master/docs/plugins.md).

To display debug info, run Artillery with the `DEBUG` environment variable:

```bash
$  DATADOG_API_KEY=xxxxx DEBUG=metrics,plugin:datadog artillery run test.yml
```
