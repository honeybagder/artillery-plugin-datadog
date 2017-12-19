const datadog = require('datadog-metrics');
const debug = require('debug')('plugin:datadog');

class DatadogPlugin {
  constructor(rawConfig, ee) {
    debug('Initializing Datadog...');
    debug(`rawConfig: ${JSON.stringify(rawConfig)}`);

    const config = {};
    let flushOnStat = false;
    config.flushIntervalSeconds = rawConfig.plugins.datadog.flushIntervalSeconds || 10;
    if (config.flushIntervalSeconds < 0) {
      config.flushIntervalSeconds = 0;
      flushOnStat = true;
    }
    config.host = rawConfig.plugins.datadog.host || '';
    config.prefix = rawConfig.plugins.datadog.prefix || 'artillery.';
    // tags
    config.defaultTags = rawConfig.plugins.datadog.tags || [];
    config.defaultTags.push(`startTime:${new Date().toISOString()}`);
    config.defaultTags.push(`target:${rawConfig.target}`);

    debug(`with config: ${JSON.stringify(config)}`);

    datadog.init(config);

    ee.on('stats', (stats) => {
      const report = stats.report();
      debug(`Report from Artillery: ${JSON.stringify(report)}`);

      // response codes
      const counters = {
        'scenarios.created': report.scenariosCreated,
        'scenarios.completed': report.scenariosCompleted,
        'requests.completed': report.requestsCompleted,
        'response.2xx': 0,
        'response.3xx': 0,
        'response.4xx': 0,
        'response.5xx': 0,
      };

      Object.keys(report.codes).forEach((key) => {
        const code = key;
        const count = report.codes[key];
        counters[`response.${code.charAt(0)}xx`] += count;
        counters[`response.${code}`] = count;
      });

      // latencies
      const histograms = {};
      histograms.latency = [];
      report.latencies.forEach((item) => {
        const seconds = item[2] / 1000000;
        histograms.latency.push(seconds);
      });

      // hand the metrics over to the datadog client
      Object.keys(counters).forEach((key) => {
        if (counters[key]) {
          datadog.increment(key, counters[key]);
        }
      });

      Object.keys(histograms).forEach((key) => {
        histograms[key].forEach((value) => {
          datadog.histogram(key, value);
        });
      });

      if (flushOnStat) {
        datadog.flush();
      }
    });

    ee.on('done', () => {
      datadog.flush();
    });
  }
}
module.exports = DatadogPlugin;
