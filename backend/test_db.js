const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, count, error } = await supabase.from('fact_cross_channel_transactions').select('*', { count: 'exact', head: true });
  console.log('Total rows:', count, error);
  const { data: d2, count: c2, error: e2 } = await supabase.from('fact_cross_channel_transactions').select('*', { count: 'exact', head: true }).gt('discount_amount', 0);
  console.log('Discounted rows:', c2, e2);
}
run();
