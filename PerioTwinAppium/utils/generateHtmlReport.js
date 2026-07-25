const fs = require('fs');
const path = require('path');

function generateHtmlReport(tests, outputDir) {
  const total = tests.length;
  const passed = tests.filter(t => t.status === 'Pass').length;
  const failed = tests.filter(t => t.status === 'Fail').length;
  const pending = tests.filter(t => t.status === 'Pending').length;
  const passRate = total > 0 ? ((passed / (total - pending)) * 100).toFixed(1) : '0';
  const totalDuration = tests.reduce((acc, t) => acc + t.duration, 0);
  const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;

  const categoryStats = {};
  tests.forEach(t => {
    if (!categoryStats[t.category]) {
      categoryStats[t.category] = { category: t.category, total: 0, passed: 0, failed: 0, pending: 0 };
    }
    const cat = categoryStats[t.category];
    cat.total++;
    if (t.status === 'Pass') cat.passed++;
    else if (t.status === 'Fail') cat.failed++;
    else cat.pending++;
  });

  const categoryCards = Object.values(categoryStats).map(cat => {
    const rate = cat.total > 0 ? ((cat.passed / (cat.total - cat.pending)) * 100).toFixed(0) : '0';
    return `
      <div class="category-card">
        <div class="category-header">
          <span class="category-name">${cat.category}</span>
          <span class="badge ${rate === '100' ? 'badge-pass' : 'badge-warn'}">${rate}% Pass</span>
        </div>
        <div class="category-progress-bar">
          <div class="progress-passed" style="width: ${cat.total > 0 ? (cat.passed/cat.total)*100 : 0}%"></div>
          <div class="progress-failed" style="width: ${cat.total > 0 ? (cat.failed/cat.total)*100 : 0}%"></div>
        </div>
        <div class="category-metrics">
          <span>Total: <strong>${cat.total}</strong></span>
          <span class="text-passed">Passed: <strong>${cat.passed}</strong></span>
          <span class="text-failed">Failed: <strong>${cat.failed}</strong></span>
        </div>
      </div>
    `;
  }).join('');

  const testRows = tests.map((t, idx) => {
    const statusClass = t.status === 'Pass' ? 'row-pass' : t.status === 'Fail' ? 'row-fail' : 'row-pending';
    const badgeClass = t.status === 'Pass' ? 'badge-pass' : t.status === 'Fail' ? 'badge-fail' : 'badge-pending';
    const errorSection = t.errorMessage ? `
      <tr class="error-detail-row" id="err-row-${idx}" style="display: none;">
        <td colspan="6">
          <div class="error-container">
            <div class="error-msg"><strong>Error:</strong> ${t.errorMessage}</div>
            <pre class="error-stack">${t.errorStack || 'No stack trace available'}</pre>
          </div>
        </td>
      </tr>
    ` : '';
    
    const clickAttr = t.errorMessage ? `onclick="toggleError(${idx})"` : '';
    const cursorStyle = t.errorMessage ? 'style="cursor: pointer;"' : '';

    return `
      <tr class="${statusClass}" ${clickAttr} ${cursorStyle}>
        <td>${t.id}</td>
        <td>${t.category}</td>
        <td>${t.title}</td>
        <td><span class="badge ${badgeClass}">${t.status}</span></td>
        <td style="text-align: right;">${t.duration} ms</td>
      </tr>
      ${errorSection}
    `;
  }).join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PerioTwin Mobile E2E Automation Report</title>
  <style>
    :root {
      --bg-dark: #090d16;
      --bg-panel: #111827;
      --border-color: #1f2937;
      --text-primary: #f9fafb;
      --text-secondary: #9ca3af;
      --text-muted: #4b5563;
      
      --primary: #0284c7;
      --success: #059669;
      --warning: #d97706;
      --danger: #dc2626;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    }

    body {
      background-color: var(--bg-dark);
      color: var(--text-primary);
      padding: 2rem;
      line-height: 1.5;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1rem;
    }

    .brand-logo {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.025em;
    }

    .brand-tagline {
      font-size: 0.85rem;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: 700;
    }

    .timestamp {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background-color: var(--bg-panel);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .stat-card::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 4px;
    }

    .stat-card.stat-total::after { background-color: var(--primary); }
    .stat-card.stat-passed::after { background-color: var(--success); }
    .stat-card.stat-failed::after { background-color: var(--danger); }
    .stat-card.stat-pending::after { background-color: var(--warning); }
    .stat-card.stat-rate::after { background-color: var(--primary); }

    .stat-val {
      font-size: 2.25rem;
      font-weight: 800;
      margin-bottom: 0.25rem;
      letter-spacing: -0.03em;
    }

    .stat-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      font-weight: 600;
    }

    /* Category Layout */
    .layout-grid {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 2rem;
    }

    .categories-panel {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .panel-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: var(--text-secondary);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .category-card {
      background-color: var(--bg-panel);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1rem;
    }

    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .category-name {
      font-size: 0.9rem;
      font-weight: 700;
    }

    .category-progress-bar {
      display: flex;
      height: 6px;
      border-radius: 3px;
      overflow: hidden;
      background-color: #374151;
      margin-bottom: 0.75rem;
    }

    .progress-passed { background-color: var(--success); }
    .progress-failed { background-color: var(--danger); }

    .category-metrics {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .text-passed { color: var(--success); }
    .text-failed { color: var(--danger); }

    /* Badges */
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1;
    }

    .badge-pass { background-color: rgba(5, 150, 105, 0.1); color: var(--success); }
    .badge-fail { background-color: rgba(220, 38, 38, 0.1); color: var(--danger); }
    .badge-pending { background-color: rgba(217, 119, 6, 0.1); color: var(--warning); }
    .badge-warn { background-color: rgba(217, 119, 6, 0.15); color: var(--warning); }

    /* Results Table */
    .table-container {
      background-color: var(--bg-panel);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;
    }

    .filter-bar {
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .search-input {
      flex: 1;
      background-color: var(--bg-dark);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.9rem;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--primary);
    }

    .filter-btn {
      background-color: var(--bg-dark);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .filter-btn.active {
      background-color: var(--primary);
      border-color: var(--primary);
      color: white;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    th {
      background-color: rgba(17, 24, 39, 0.5);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    td {
      padding: 1rem;
      font-size: 0.85rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-secondary);
    }

    tr:hover td {
      color: var(--text-primary);
      background-color: rgba(255, 255, 255, 0.01);
    }

    .row-fail td {
      color: #fca5a5;
    }

    /* Error details */
    .error-detail-row td {
      background-color: rgba(220, 38, 38, 0.02);
      padding: 1rem 2rem;
    }

    .error-container {
      background-color: rgba(9, 13, 22, 0.7);
      border-left: 4px solid var(--danger);
      padding: 1rem;
      border-radius: 4px;
    }

    .error-msg {
      color: var(--danger);
      font-family: monospace;
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
    }

    .error-stack {
      color: var(--text-secondary);
      font-family: monospace;
      font-size: 0.8rem;
      white-space: pre-wrap;
      overflow-x: auto;
    }
  </style>
  <script>
    function toggleError(id) {
      const row = document.getElementById('err-row-' + id);
      if (row.style.display === 'none') {
        row.style.display = 'table-row';
      } else {
        row.style.display = 'none';
      }
    }

    function filterStatus(status, btn) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const rows = document.querySelectorAll('tbody tr:not(.error-detail-row)');
      rows.forEach(row => {
        const statusBadge = row.querySelector('.badge');
        if (!statusBadge) return;
        const statusText = statusBadge.textContent.trim();

        if (status === 'all' || statusText.toLowerCase() === status.toLowerCase()) {
          row.style.display = 'table-row';
        } else {
          row.style.display = 'none';
          const idx = row.getAttribute('onclick')?.match(/\\d+/);
          if (idx) {
            const errRow = document.getElementById('err-row-' + idx[0]);
            if (errRow) errRow.style.display = 'none';
          }
        }
      });
    }

    function searchTestCases() {
      const query = document.getElementById('search-box').value.toLowerCase();
      const rows = document.querySelectorAll('tbody tr:not(.error-detail-row)');

      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(query)) {
          row.style.display = 'table-row';
        } else {
          row.style.display = 'none';
        }
      });
    }
  </script>
</head>
<body>

  <header>
    <div>
      <div class="brand-logo">PerioTwin™ Mobile Appium Suite</div>
      <div class="brand-tagline">Mobile Android automated execution report</div>
    </div>
    <div class="timestamp">
      Executed: <strong>${new Date().toLocaleString()}</strong>
    </div>
  </header>

  <section class="stats-grid">
    <div class="stat-card stat-total">
      <div class="stat-val">${total}</div>
      <div class="stat-label">Total Assertions</div>
    </div>
    <div class="stat-card stat-passed">
      <div class="stat-val" style="color: var(--success);">${passed}</div>
      <div class="stat-label">Passed</div>
    </div>
    <div class="stat-card stat-failed">
      <div class="stat-val" style="color: var(--danger);">${failed}</div>
      <div class="stat-label">Failed</div>
    </div>
    <div class="stat-card stat-pending">
      <div class="stat-val" style="color: var(--warning);">${pending}</div>
      <div class="stat-label">Pending</div>
    </div>
    <div class="stat-card stat-rate">
      <div class="stat-val" style="color: var(--primary);">${passRate}%</div>
      <div class="stat-label">Pass Rate</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: var(--primary);">${avgDuration} ms</div>
      <div class="stat-label">Avg Duration</div>
    </div>
  </section>

  <main class="layout-grid">
    <aside class="categories-panel">
      <h3 class="panel-title">Categories</h3>
      ${categoryCards}
    </aside>

    <section class="results-panel">
      <div class="panel-title">
        <span>Detailed Results</span>
        <span style="font-size: 0.85rem; font-weight: 500;">Failures can be clicked to view error stacks</span>
      </div>

      <div class="table-container">
        <div class="filter-bar">
          <input 
            type="text" 
            id="search-box" 
            class="search-input" 
            placeholder="Search test cases..." 
            onkeyup="searchTestCases()"
          />
          <button class="filter-btn active" onclick="filterStatus('all', this)">All</button>
          <button class="filter-btn" onclick="filterStatus('Pass', this)" style="border-color: rgba(5, 150, 105, 0.3)">Passed</button>
          <button class="filter-btn" onclick="filterStatus('Fail', this)" style="border-color: rgba(220, 38, 38, 0.3)">Failed</button>
          <button class="filter-btn" onclick="filterStatus('Pending', this)" style="border-color: rgba(217, 119, 6, 0.3)">Pending</button>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 10%;">ID</th>
              <th style="width: 25%;">Category</th>
              <th style="width: 45%;">Test Case Title</th>
              <th style="width: 12%;">Status</th>
              <th style="width: 8%; text-align: right;">Duration</th>
            </tr>
          </thead>
          <tbody>
            ${testRows}
          </tbody>
        </table>
      </div>
    </section>
  </main>

</body>
</html>
  `;

  const htmlPath = path.join(outputDir, 'execution-report.html');
  fs.writeFileSync(htmlPath, htmlContent);
  console.log(`Saved Appium HTML report to: ${htmlPath}`);
}

module.exports = generateHtmlReport;
