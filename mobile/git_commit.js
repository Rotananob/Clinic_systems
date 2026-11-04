const { execSync } = require('child_process');
const fs = require('fs');
const cwd = 'd:/WEB Development/clinic-patient-management';

if (fs.existsSync(cwd + '/.git/index.lock')) {
  fs.unlinkSync(cwd + '/.git/index.lock');
}

execSync('git add mobile/app/src/main/java mobile/simulator.html mobile/serve_ui.js', { cwd });
const status = execSync('git status --short', { cwd }).toString();
console.log('Staged:\n' + status);

const msg = 'feat(mobile): add bilingual support, gated clinical tools catalog, saas pricing, paas showcase, and ota auto-update';
try {
  execSync(`git commit -m "${msg}"`, { cwd });
  const log = execSync('git log -1 --oneline', { cwd }).toString();
  console.log('Committed: ' + log);
} catch (e) {
  console.log('Commit result:', e.stdout ? e.stdout.toString() : e.message);
}
