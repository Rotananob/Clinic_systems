const fs = require('fs');
const { execSync } = require('child_process');

const lockFile = 'd:/WEB Development/clinic-patient-management/.git/index.lock';
if (fs.existsSync(lockFile)) {
  fs.unlinkSync(lockFile);
}

try {
  execSync('git -C "d:/WEB Development/clinic-patient-management" add "mobile/app/src/main/java/com/krupet/clinic/presentation/dental/DentalScreen.kt"', { stdio: 'inherit' });
  const commitMsg = 'fix(dental): resolve toothRecords state type mismatch';
  execSync(`git -C "d:/WEB Development/clinic-patient-management" commit -m "${commitMsg}"`, { stdio: 'inherit' });
  console.log('Committed dental fix successfully.');
} catch (e) {
  console.error('Git error:', e.message);
}
