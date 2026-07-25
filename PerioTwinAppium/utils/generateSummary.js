const fs = require('fs');
const path = require('path');

function generateSummary(tests, summaryFilePath) {
  const total = tests.length;
  const passed = tests.filter(t => t.status === 'Pass').length;
  const failed = tests.filter(t => t.status === 'Fail').length;
  const pending = tests.filter(t => t.status === 'Pending').length;
  const passRate = total > 0 ? ((passed / (total - pending)) * 100).toFixed(1) : '0';
  const totalDuration = tests.reduce((acc, t) => acc + t.duration, 0);
  const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;

  const markdownContent = `
### 📱 Mobile Appium E2E Testing Summary

| Metric | Result |
| --- | --- |
| **Total Test Cases** | ${total} |
| **Passed Assertions** | ${passed} |
| **Failed Assertions** | ${failed} |
| **Pending Assertions** | ${pending} |
| **Overall Pass Rate** | **${passRate}%** |
| **Average Test Duration** | ${avgDuration} ms |
| **Total Execution Time** | ${(totalDuration / 1000).toFixed(2)} seconds |

> [!TIP]
> The full interactive HTML report is accessible inside the **Artifacts** download section as well as deployed under the reports history repository branch page directory.
`;

  fs.writeFileSync(summaryFilePath, markdownContent);
  console.log(`Saved Appium markdown summary to: ${summaryFilePath}`);
}

module.exports = generateSummary;
