const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data } = await supabase.rpc('get_recent_discounted_transactions', { row_limit: 15000 });
  const h17 = data.filter(d => new Date(d.transaction_timestamp).getUTCHours() === 17);
  console.log('Items for hour 17:', h17.map(d => d.product_id || d.service_id));
}
run();
