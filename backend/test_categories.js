const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data } = await supabase.from('product_dim').select('category');
  const uniqueCategories = new Set(data.map(d => d.category));
  console.log('Categories:', Array.from(uniqueCategories));
}
run();
