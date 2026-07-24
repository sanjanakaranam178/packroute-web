import http from 'http';
import https from 'https';
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIRTUAL_USERS = parseInt(process.env.VIRTUAL_USERS || '100', 10);
const DURATION_SECONDS = parseInt(process.env.DURATION_SECONDS || '60', 10);
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';

console.log("==================================================");
console.log("⚡ PackRoute 100 Virtual Users Baseline/Load Testing");
console.log("==================================================");
console.log(`🌐 Target Base URL:      ${BASE_URL}`);
console.log(`👥 Virtual Users (VUs):  ${VIRTUAL_USERS} concurrent users`);
console.log(`⏱️ Duration:             ${DURATION_SECONDS} seconds (1 minute continuous load)`);
console.log("==================================================\n");

const endpoints = [
  '/',
  '/index.html',
  '/src/App.css',
  '/src/SwiftDelivery.jsx'
];

let totalRequests = 0;
let successRequests = 0;
let failedRequests = 0;
const responseTimes = [];
let isRunning = true;

const startTime = Date.now();
const endTime = startTime + DURATION_SECONDS * 1000;

function sendHttpRequest(urlStr) {
  return new Promise((resolve) => {
    const reqStart = Date.now();
    const parsedUrl = new URL(urlStr);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const req = client.get(urlStr, { timeout: 5000 }, (res) => {
      res.resume(); // consume response stream
      const latency = Date.now() - reqStart;
      resolve({ success: res.statusCode >= 200 && res.statusCode < 400, latency });
    });

    req.on('error', (err) => {
      const latency = Date.now() - reqStart;
      resolve({ success: false, latency });
    });

    req.on('timeout', () => {
      req.destroy();
      const latency = Date.now() - reqStart;
      resolve({ success: false, latency });
    });
  });
}

async function virtualUserWorker(workerId) {
  let endpointIdx = workerId % endpoints.length;

  while (isRunning && Date.now() < endTime) {
    const targetEndpoint = endpoints[endpointIdx % endpoints.length];
    const fullUrl = `${BASE_URL}${targetEndpoint}`;

    const res = await sendHttpRequest(fullUrl);
    totalRequests++;
    if (res.success) {
      successRequests++;
    } else {
      failedRequests++;
    }
    responseTimes.push(res.latency);

    endpointIdx++;
    // Small micro-delay (10ms) to simulate user thinking/request pacing
    await new Promise((r) => setTimeout(r, 10));
  }
}

async function runLoadTest() {
  const timer = setTimeout(() => {
    isRunning = false;
  }, DURATION_SECONDS * 1000);

  const workers = [];
  for (let i = 0; i < VIRTUAL_USERS; i++) {
    workers.push(virtualUserWorker(i));
  }

  // Monitor progress every 10 seconds
  const interval = setInterval(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const currentRps = elapsed > 0 ? (totalRequests / elapsed).toFixed(1) : 0;
    console.log(`⏱️ [${elapsed}s/${DURATION_SECONDS}s] Active VUs: ${VIRTUAL_USERS} | Total Requests: ${totalRequests} | Current RPS: ${currentRps} req/sec`);
  }, 10000);

  await Promise.all(workers);
  clearInterval(interval);
  clearTimeout(timer);

  const actualDurationMs = Date.now() - startTime;
  const actualDurationSec = (actualDurationMs / 1000).toFixed(2);
  const rps = (totalRequests / (actualDurationMs / 1000)).toFixed(2);

  responseTimes.sort((a, b) => a - b);
  const minTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
  const maxTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
  const avgTime = responseTimes.length > 0 ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2) : 0;
  const p95Idx = Math.floor(responseTimes.length * 0.95);
  const p95Time = responseTimes.length > 0 ? responseTimes[p95Idx] : 0;
  const successRate = totalRequests > 0 ? ((successRequests / totalRequests) * 100).toFixed(2) : "100.00";

  console.log("\n==================================================");
  console.log("📊 LOAD TEST EXECUTION RESULTS");
  console.log("==================================================");
  console.log(`⏱️ Test Duration:          ${actualDurationSec} seconds`);
  console.log(`👥 Concurrent VUs:         ${VIRTUAL_USERS}`);
  console.log(`📮 Total Requests Sent:    ${totalRequests}`);
  console.log(`⚡ Requests Per Sec (RPS): ${rps} req/sec`);
  console.log(`✅ Success Rate:            ${successRate}% (${successRequests} success / ${failedRequests} failed)`);
  console.log("--------------------------------------------------");
  console.log(`🚀 Min Response Time:      ${minTime} ms`);
  console.log(`📈 Average Response Time:  ${avgTime} ms`);
  console.log(`🛑 Max Response Time:      ${maxTime} ms`);
  console.log(`🎯 95th Percentile (p95):  ${p95Time} ms`);
  console.log("==================================================\n");

  // Save Excel & HTML reports
  saveReports({
    virtualUsers: VIRTUAL_USERS,
    durationSec: actualDurationSec,
    totalRequests,
    successRequests,
    failedRequests,
    rps,
    successRate,
    minTime,
    maxTime,
    avgTime,
    p95Time
  });

  process.exit(0);
}

function saveReports(metrics) {
  // 1. Build Excel Report
  const wb = XLSX.utils.book_new();

  const summaryRows = [
    ["PackRoute Baseline / Load Testing Execution Report"],
    ["Generated On", new Date().toISOString()],
    ["Target Base URL", BASE_URL],
    ["Concurrent Virtual Users (VUs)", metrics.virtualUsers],
    ["Test Duration (Seconds)", metrics.durationSec],
    ["Total Requests Sent", metrics.totalRequests],
    ["Successful Requests", metrics.successRequests],
    ["Failed Requests", metrics.failedRequests],
    ["Success Rate (%)", `${metrics.successRate}%`],
    ["Requests Per Second (RPS)", `${metrics.rps} req/sec`],
    ["Minimum Response Time (ms)", `${metrics.minTime} ms`],
    ["Average Response Time (ms)", `${metrics.avgTime} ms`],
    ["Maximum Response Time (ms)", `${metrics.maxTime} ms`],
    ["95th Percentile Response Time (ms)", `${metrics.p95Time} ms`],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Load Test Metrics");

  const excelFileName = "PackRoute_Load_Testing_Report.xlsx";
  const excelPaths = [
    path.resolve(__dirname, '..', excelFileName),
    path.resolve(process.cwd(), excelFileName),
    path.resolve(__dirname, '..', '..', excelFileName)
  ];

  excelPaths.forEach(p => {
    try { XLSX.writeFile(wb, p); } catch (e) {}
  });

  // 2. Build HTML Report
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PackRoute Load Testing Performance Report</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; margin: 36px; background: #f8fafc; color: #0f172a; }
    h1 { color: #1a6ef5; margin-bottom: 4px; font-size: 28px; }
    .sub { color: #64748b; margin-bottom: 28px; font-size: 14px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
    .card { background: #fff; padding: 20px; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .card .val { font-size: 32px; font-weight: 800; color: #1a6ef5; }
    .card .val.green { color: #10b981; }
    .card .val.purple { color: #6c3fc8; }
    .card .val.orange { color: #f59e0b; }
    .card .lbl { font-size: 13px; color: #64748b; margin-top: 4px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    td, th { padding: 14px 18px; text-align: left; font-size: 14px; border-bottom: 1px solid #e2e8f0; }
    th { background: #f1f5f9; font-weight: 700; color: #475569; }
  </style>
</head>
<body>
  <h1>⚡ PackRoute Baseline / Load Testing Report</h1>
  <div class="sub">100 Concurrent Virtual Users (VUs) • 1 Minute Continuous Load</div>

  <div class="grid">
    <div class="card"><div class="val purple">${metrics.rps}</div><div class="lbl">Requests / Second (RPS)</div></div>
    <div class="card"><div class="val green">${metrics.avgTime} ms</div><div class="lbl">Average Response Time</div></div>
    <div class="card"><div class="val">${metrics.minTime} ms</div><div class="lbl">Fastest Response Time</div></div>
    <div class="card"><div class="val orange">${metrics.maxTime} ms</div><div class="lbl">Slowest Response Time</div></div>
  </div>

  <h2>Performance Metrics Breakdown</h2>
  <table>
    <thead><tr><th>Metric Parameter</th><th>Measured Performance Result</th></tr></thead>
    <tbody>
      <tr><td><strong>Concurrent Virtual Users</strong></td><td>${metrics.virtualUsers} VUs</td></tr>
      <tr><td><strong>Test Duration</strong></td><td>${metrics.durationSec} seconds (1 Minute)</td></tr>
      <tr><td><strong>Total HTTP Requests Sent</strong></td><td>${metrics.totalRequests} requests</td></tr>
      <tr><td><strong>Successful Requests Ratio</strong></td><td>${metrics.successRate}% (${metrics.successRequests} success / ${metrics.failedRequests} failed)</td></tr>
      <tr><td><strong>Requests Per Second (RPS)</strong></td><td>${metrics.rps} req/sec</td></tr>
      <tr><td><strong>Minimum Response Time (Fastest)</strong></td><td>${metrics.minTime} ms</td></tr>
      <tr><td><strong>Average Response Time</strong></td><td>${metrics.avgTime} ms</td></tr>
      <tr><td><strong>Maximum Response Time (Slowest)</strong></td><td>${metrics.maxTime} ms</td></tr>
      <tr><td><strong>95th Percentile Latency (p95)</strong></td><td>${metrics.p95Time} ms</td></tr>
    </tbody>
  </table>
</body>
</html>`;

  const htmlFileName = "PackRoute_Load_Testing_Report.html";
  const htmlPaths = [
    path.resolve(__dirname, '..', htmlFileName),
    path.resolve(process.cwd(), htmlFileName),
    path.resolve(__dirname, '..', '..', htmlFileName)
  ];

  htmlPaths.forEach(p => {
    try { fs.writeFileSync(p, htmlContent); } catch (e) {}
  });

  // Save metrics summary JSON for summary publisher
  const jsonPath = path.resolve(__dirname, 'load-metrics.json');
  try { fs.writeFileSync(jsonPath, JSON.stringify(metrics, null, 2)); } catch (e) {}

  console.log(`✅ PackRoute Load Testing Excel Report: ${path.resolve(__dirname, '..', excelFileName)}`);
  console.log(`✅ PackRoute Load Testing HTML Report:  ${path.resolve(__dirname, '..', htmlFileName)}`);
}

runLoadTest();
