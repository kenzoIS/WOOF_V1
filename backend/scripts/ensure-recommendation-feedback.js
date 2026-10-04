const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key.trim()]) process.env[key.trim()] = value;
  }
}

function getConnectionString() {
  const direct =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.SUPABASE_DATABASE_URL;

  if (direct) return direct;

  const supabaseUrl = process.env.SUPABASE_URL;
  const password =
    process.env.SUPABASE_DB_PASSWORD ||
    process.env.POSTGRES_PASSWORD ||
    process.env.SUPABASE_POSTGRES_PASSWORD;

  if (!supabaseUrl || !password) return null;

  const host = new URL(supabaseUrl).hostname;
  const projectRef = host.split('.')[0];
  if (!projectRef) return null;

  return `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;
}

async function main() {
  loadEnvFile(path.join(__dirname, '..', '.env'));
  loadEnvFile(path.join(__dirname, '..', '..', '.env'));

  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error(
      [
        'Missing Postgres connection details.',
        'Set DATABASE_URL, POSTGRES_URL, SUPABASE_DB_URL, or SUPABASE_DATABASE_URL.',
        'Alternatively set SUPABASE_URL plus SUPABASE_DB_PASSWORD.',
      ].join(' '),
    );
  }

  const migrationPath = path.join(
    __dirname,
    '..',
    'database',
    'migrations',
    '20260831_recommendation_feedback.sql',
  );
  const sql = fs.readFileSync(migrationPath, 'utf8');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query(sql);
    await client.query('select 1 from public.recommendation_feedback limit 1');
    console.log('public.recommendation_feedback is ready.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
