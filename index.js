const datadog = require('datadog-metrics');
const debug = require('debug')('plugin:datadog');

class DatadogPlugin {
  constructor(rawConfig, ee) {
    debug('Initializing Datadog...');

    const config = {
      flushIntervalSeconds: 0,
    };
    config.host = rawConfig.plugins.datadog.host || '';
    config.prefix = rawConfig.plugins.datadog.prefix || 'artillery.';
    config.defaultTags = [`startTime:${new Date().toISOString()}`];
    debug(`with config: ${JSON.stringify(config)}`);

    datadog.init(config);

    ee.on('stats', (stats) => {
      const report = stats.report();
      debug(`Stats Report from Artillery: ${JSON.stringify(stats)}`);
      const metrics = {
        'scenarios.created': report.scenariosCreated,
        'scenarios.completed': report.scenariosCompleted,
        'requests.completed': report.requestsCompleted,
        'response.2xx': 0,
        'response.3xx': 0,
        'response.4xx': 0,
        'response.5xx': 0,
      };

      // response codes
      Object.keys(report.codes).forEach((key) => {
        const code = key;
        const count = report.codes[key];
        metrics[`response.${code.charAt(0)}xx`] += count;
        metrics[`response.${code}`] = count;
      });

      // latencies
      Object.keys(report.latency).forEach((key) => {
        const type = key;
        const value = report.latency[key];
        if (value) {
          metrics[`latency.${type}`] = value;
        }
      });

      // percent of ok responses
      metrics['response.ok_pct'] = () => {
        const percentage = ((metrics['response.2xx'] + metrics['response.3xx']) * 100) / metrics['scenarios.completed'];
        if (Number.isNaN(percentage)) return 0;
        return Math.round(percentage * 100) / 100;
      };

      // tags
      const tags = [];
      tags.push(`target:${rawConfig.target}`);
      tags.concat(rawConfig.plugins.datadog.tags);

      // hand the metrics over to the datadog client
      Object.keys(metrics).forEach((key) => {
        datadog.gauge(key, metrics[key], tags);
      });

      datadog.flush();
    });
  }
}
module.exports = DatadogPlugin;
