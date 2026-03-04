const fs = require('fs');
const path = require('path');

const root = process.cwd();

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function fail(msg) {
  console.error(msg);
  process.exitCode = 1;
}

const requiredPaths = [
  'miniprogram',
  'miniprogram/pages/index',
  'miniprogram/pages/washing',
  'miniprogram/pages/payment',
  'miniprogram/pages/history',
  'miniprogram/pages/admin/login',
  'miniprogram/pages/admin/panel',
  'miniprogram/utils',
  'miniprogram/app.js',
  'miniprogram/app.json',
  'miniprogram/app.wxss',
  'miniprogram/utils/util.js',
  'cloudfunctions',
  'cloudfunctions/startWash',
  'cloudfunctions/endWash',
  'cloudfunctions/getOrders',
  'cloudfunctions/getMyOrders',
  'cloudfunctions/getStats',
  'cloudfunctions/updatePrice',
  'cloudfunctions/adminLogin',
  'cloudfunctions/generateMockData',
  'cloudfunctions/hardwareControl',
  'project.config.json'
];

for (const rel of requiredPaths) {
  if (!exists(rel)) {
    fail(`Missing required path: ${rel}`);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

const appJsonRaw = fs.readFileSync(path.join(root, 'miniprogram/app.json'), 'utf8');
const appJson = JSON.parse(appJsonRaw.replace(/^\uFEFF/, ''));
const expectedPages = [
  'pages/index/index',
  'pages/washing/washing',
  'pages/payment/payment',
  'pages/history/history',
  'pages/admin/login/login',
  'pages/admin/panel/panel'
];

if (JSON.stringify(appJson.pages) !== JSON.stringify(expectedPages)) {
  fail('app.json pages do not match Task 1 expected pages');
}

if (appJson.cloud !== true) {
  fail('app.json cloud must be true');
}

const util = require(path.join(root, 'miniprogram/utils/util.js'));
if (util.fenToYuan(125) !== '1.25') {
  fail('fenToYuan conversion is incorrect');
}
if (util.yuanToFen('1.26') !== 126) {
  fail('yuanToFen conversion is incorrect');
}
if (util.formatDuration(61) !== '1小时1分钟') {
  fail('formatDuration conversion is incorrect');
}

if (!process.exitCode) {
  console.log('Task 1 structure and config verification passed.');
}
