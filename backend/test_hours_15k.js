const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data } = await supabase.from('fact_cross_channel_transactions').select('transaction_timestamp').order('transaction_timestamp', { ascending: false }).limit(15000);
  const hours = data.map(r => new Date(r.transaction_timestamp).getUTCHours());
  const counts = hours.reduce((acc, h) => { acc[h] = (acc[h] || 0) + 1; return acc; }, {});
  console.log('Hour counts (15k limit):', counts);
}
run();
