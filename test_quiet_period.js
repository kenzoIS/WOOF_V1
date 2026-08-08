const { execSync } = require('child_process');
const dotenv = require('dotenv');
dotenv.config({ path: '/Users/rico/Downloads/WOOF/WOOF_V1/backend/.env' });

async function run() {
  const out = execSync('node test-dynamic-stratified.js', { env: process.env, maxBuffer: 1024 * 1024 * 50 });
  console.log(out.toString());
}
run();
