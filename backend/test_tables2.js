const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: p } = await supabase.from('dim_product').select('*').limit(1);
  console.log('dim_product table exists?', !!p);
  if (p) console.log(p[0]);
}
run();
