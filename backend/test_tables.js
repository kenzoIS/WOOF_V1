const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.rpc('get_tables'); // Or just fetch from products
  const { data: p } = await supabase.from('products').select('*').limit(1);
  console.log('Products table exists?', !!p);
  if (p) console.log(p[0]);
}
run();
