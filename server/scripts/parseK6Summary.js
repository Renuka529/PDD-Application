const fs = require('fs');
const path = require('path');

function getMetricValue(metricObj, key) {
  if (!metricObj) return 0;
  if (metricObj.values && metricObj.values[key] !== undefined) {
    return metricObj.values[key];
  }
  if (metricObj[key] !== undefined) {
    return metricObj[key];
  }
  return 0;
}

function parseSummary() {
  const summaryPath = path.join(__dirname, '..', 'summary.json');
  console.log(`Reading k6 summary from: ${summaryPath}`);

  if (!fs.existsSync(summaryPath)) {
    console.error(`⚠️ Error: summary.json not found at ${summaryPath}`);
    process.exit(1);
  }

  try {
    const rawData = fs.readFileSync(summaryPath, 'utf8');
    const summary = JSON.parse(rawData);
    const metrics = summary.metrics || {};

    // Safely extract metrics
    const httpReqs = metrics.http_reqs || {};
    const totalRequests = getMetricValue(httpReqs, 'count');
    const rateRps = getMetricValue(httpReqs, 'rate');

    const duration = metrics.http_req_duration || {};
    const avgLatency = getMetricValue(duration, 'avg');
    const minLatency = getMetricValue(duration, 'min');
    const maxLatency = getMetricValue(duration, 'max');
    const p95Latency = getMetricValue(duration, 'p(95)');

    const failedReqsObj = metrics.http_req_failed || {};
    const failedRate = getMetricValue(failedReqsObj, 'rate');

    // Checks/Assertions
    const checksObj = metrics.checks || {};
    const checksPassedRate = getMetricValue(checksObj, 'rate');

    const markdownContent = `
### 📈 Backend API Load Testing Results

| Performance Indicator | Value |
| --- | --- |
| **Total Requests Sent** | ${Math.round(totalRequests)} |
| **Throughput (RPS)** | ${rateRps.toFixed(2)} req/sec |
| **Average Latency** | ${avgLatency.toFixed(1)} ms |
| **95th Percentile (p95)** | ${p95Latency.toFixed(1)} ms |
| **Minimum Latency** | ${minLatency.toFixed(1)} ms |
| **Maximum Latency** | ${maxLatency.toFixed(1)} ms |
| **Request Failure Rate** | ${(failedRate * 100).toFixed(2)}% |
| **Assertion Checks Pass Rate** | ${(checksPassedRate * 100).toFixed(2)}% |

> [!NOTE]
> **Load Profile**: Simulated 100 concurrent Virtual Users executing requests continuously for 1 minute against target backend API gateways.
`;

    // Output to step summary if GITHUB_STEP_SUMMARY env is defined, otherwise write locally
    const summaryFile = process.env.GITHUB_STEP_SUMMARY || path.join(__dirname, '..', 'load_test_summary.md');
    fs.writeFileSync(summaryFile, markdownContent);
    console.log(`Saved k6 performance summary to: ${summaryFile}`);

  } catch (err) {
    console.error('Failed to parse k6 summary file:', err);
    process.exit(1);
  }
}

parseSummary();
