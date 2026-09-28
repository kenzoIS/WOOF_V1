const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('fact_cross_channel_transactions').select('*').limit(15000);
  console.log('Error:', error);
  console.log('Returned rows:', data ? data.length : null);
}
run();
