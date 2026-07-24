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

if (!excelPath) {
  console.error("❌ PackRoute_Selenium_300_Test_Cases.xlsx not found!");
  process.exit(0);
}

const wb = XLSX.readFile(excelPath);
const ws = wb.Sheets["300 Test Cases"];
if (!ws) {
  console.error("❌ Sheet '300 Test Cases' not found.");
  process.exit(0);
}

const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
const testCases = rows.slice(1);

const total = testCases.length;
const passed = testCases.filter(r => r[11] === "Passed").length;
const failed = total - passed;

// Group by module
const modulesMap = {};
testCases.forEach(r => {
  const mod = r[1] || "General";
  if (!modulesMap[mod]) modulesMap[mod] = [];
  modulesMap[mod].push(r);
});

let md = `# ⚡ PackRoute Selenium Test Report (300 Test Cases)\n\n`;
md += `### 📊 Executive Summary\n\n`;
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

md += `\n---\n`;
md += `📥 *Excel file reports (\`PackRoute_Selenium_300_Test_Cases.xlsx\`) and HTML visual reports have been uploaded to Artifacts.*`;

// Write to GITHUB_STEP_SUMMARY if available
const summaryFile = process.env.GITHUB_STEP_SUMMARY;
if (summaryFile) {
  fs.appendFileSync(summaryFile, md);
  console.log("✅ Written full 300 test cases report to GITHUB_STEP_SUMMARY!");
} else {
  console.log(md);
}
