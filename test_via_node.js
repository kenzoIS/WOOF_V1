const { execSync } = require('child_process');
try {
  let out = execSync("curl -s http://localhost:3001/api/analytics/promos/quiet-periods").toString();
  console.log("CURL:", out);
} catch (e) {}
