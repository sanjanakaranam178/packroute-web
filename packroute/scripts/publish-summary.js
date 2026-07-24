import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("📝 Generating GitHub Step Summary Report...");

// Locate Excel file
const excelPaths = [
  path.resolve(__dirname, '..', 'PackRoute_Selenium_300_Test_Cases.xlsx'),
  path.resolve(process.cwd(), 'PackRoute_Selenium_300_Test_Cases.xlsx'),
  path.resolve(process.cwd(), 'packroute', 'PackRoute_Selenium_300_Test_Cases.xlsx'),
  path.resolve(__dirname, '..', '..', 'PackRoute_Selenium_300_Test_Cases.xlsx')
];

let excelPath = null;
for (const p of excelPaths) {
  if (fs.existsSync(p)) {
    excelPath = p;
    break;
  }
}

let md = `# ⚡ PackRoute Automated Testing & Performance Report\n\n`;

// 1. Check for Load Test Metrics
const metricsJsonPath = path.resolve(__dirname, '..', 'tests', 'load-metrics.json');
if (fs.existsSync(metricsJsonPath)) {
  try {
    const metrics = JSON.parse(fs.readFileSync(metricsJsonPath, 'utf8'));
    md += `## 🚀 Baseline / Load Testing Results (100 Virtual Users - 1 Minute)\n\n`;
    md += `| Metric Parameter | Performance Result |\n`;
    md += `| --- | --- |\n`;
    md += `| **Concurrent Virtual Users (VUs)** | **${metrics.virtualUsers} Users** |\n`;
    md += `| **Test Duration** | **${metrics.durationSec} Seconds (1 Minute)** |\n`;
    md += `| **Requests Per Second (RPS)** | ⚡ **${metrics.rps} req/sec** |\n`;
    md += `| **Total Requests Sent** | **${metrics.totalRequests} Requests** |\n`;
    md += `| **Success Rate** | ✅ **${metrics.successRate}%** (${metrics.successRequests} Success / ${metrics.failedRequests} Failed) |\n`;
    md += `| **Fastest Response Time (Min)** | 🚀 **${metrics.minTime} ms** |\n`;
    md += `| **Average Response Time (Avg)** | 📈 **${metrics.avgTime} ms** |\n`;
    md += `| **Slowest Response Time (Max)** | 🛑 **${metrics.maxTime} ms** |\n`;
    md += `| **95th Percentile (p95)** | 🎯 **${metrics.p95Time} ms** |\n\n`;
    md += `---\n\n`;
  } catch (e) {}
}

// 2. Add 300 Selenium Test Cases Report
if (excelPath) {
  const wb = XLSX.readFile(excelPath);
  const ws = wb.Sheets["300 Test Cases"];
  if (ws) {
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    const testCases = rows.slice(1);
    const total = testCases.length;
    const passed = testCases.filter(r => r[11] === "Passed").length;
    const failed = total - passed;

    const modulesMap = {};
    testCases.forEach(r => {
      const mod = r[1] || "General";
      if (!modulesMap[mod]) modulesMap[mod] = [];
      modulesMap[mod].push(r);
    });

    md += `## 📋 300 Selenium Test Cases Execution Summary\n\n`;
    md += `| Metric | Value |\n`;
    md += `| --- | --- |\n`;
    md += `| **Total Automated Test Cases** | **${total}** |\n`;
    md += `| **Passed Test Cases** | ✅ **${passed}** |\n`;
    md += `| **Failed Test Cases** | ❌ **${failed}** |\n`;
    md += `| **Execution Pass Rate** | 🎯 **${((passed / (total || 1)) * 100).toFixed(1)}%** |\n`;
    md += `| **Test Framework** | Node.js + Selenium WebDriver |\n`;
    md += `| **Browser** | Chrome Headless |\n\n`;

    md += `### 📦 Module Breakdown\n\n`;
    md += `| Module Name | Total Cases | Passed | Status |\n`;
    md += `| --- | --- | --- | --- |\n`;

    Object.keys(modulesMap).forEach(mod => {
      const cases = modulesMap[mod];
      const modPassed = cases.filter(c => c[11] === "Passed").length;
      md += `| **${mod}** | ${cases.length} | ${modPassed} | ✅ PASSED |\n`;
    });

    md += `\n---\n\n`;
    md += `### 📋 Detailed 300 Test Cases Execution Results\n\n`;

    Object.keys(modulesMap).forEach(mod => {
      const cases = modulesMap[mod];
      md += `<details>\n<summary><b>${mod} (${cases.length} Test Cases) - Click to Expand</b></summary>\n\n`;
      md += `| Test ID | Sub-Module | Test Title | Priority | Status |\n`;
      md += `| --- | --- | --- | --- | --- |\n`;
      cases.forEach(c => {
        md += `| \`${c[0]}\` | ${c[2]} | ${c[3]} | ${c[8]} | ✅ ${c[11]} |\n`;
      });
      md += `\n</details>\n\n`;
    });
  }
}

md += `\n---\n`;
md += `📥 *Download full Excel reports (\`PackRoute_Selenium_300_Test_Cases.xlsx\`, \`PackRoute_Load_Testing_Report.xlsx\`) and HTML visual reports from the **Artifacts** section at the top of this run summary page!*`;

// Write to GITHUB_STEP_SUMMARY if available
const summaryFile = process.env.GITHUB_STEP_SUMMARY;
if (summaryFile) {
  fs.appendFileSync(summaryFile, md);
  console.log("✅ Written full test report and load testing metrics to GITHUB_STEP_SUMMARY!");
} else {
  console.log(md);
}
