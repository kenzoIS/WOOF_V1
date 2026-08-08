const { execSync } = require('child_process');
const dotenv = require('dotenv');
dotenv.config({ path: '/Users/rico/Downloads/WOOF/WOOF_V1/backend/.env' });

async function run() {
  const rows = [];
  // Peak hour: 12 PM
  for (let i = 0; i < 100; i++) rows.push({ transactionTimestamp: "2023-01-01T12:00:00Z", quantitySold: 2 });
  // Slump hour: 16 PM
  for (let i = 0; i < 10; i++) rows.push({ transactionTimestamp: "2023-01-01T16:00:00Z", quantitySold: 1 });

  const payload = {
    is_weekend: 0,
    temp: 30.0,
    discount_depth: 0.15,
    trainingSignature: "test-pandas:1",
    trainingRows: rows
  };

  const out = execSync('node -e "console.log(require(\'child_process\').execSync(\'python3 backend/src/analytics/python/dynamic_promo.py\', { input: JSON.stringify(' + JSON.stringify(payload) + '), env: process.env }).toString())"', { env: process.env, maxBuffer: 1024 * 1024 * 50 });
  console.log(out.toString());
}
run();
