const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data } = await supabase.from('fact_cross_channel_transactions').select('segment_id').limit(100);
  const uniqueSegments = new Set(data.map(d => d.segment_id));
  console.log('Unique segments:', Array.from(uniqueSegments));
}
run();
