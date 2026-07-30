require('dotenv').config({ path: './.env' });
const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const connectionString = 'postgresql://postgres:Kobe1106@db.voulbrekfnlisijuvkok.supabase.co:5432/postgres';
  const client = new Client({ connectionString });
  await client.connect();
  const sql = fs.readFileSync('/Users/rico/.gemini/antigravity-ide/brain/324a0f59-8cdc-4b08-acab-aaa51473de53/supabase_migration.sql', 'utf8');
  await client.query(sql);
  console.log("Migration executed");
  await client.end();
}
run().catch(console.error);
