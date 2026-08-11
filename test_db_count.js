const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '/Users/rico/Downloads/WOOF/WOOF_V1/backend/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { count } = await supabase.from('fact_cross_channel_transactions').select('*', { count: 'exact', head: true });
  console.log("Total rows in Supabase:", count);
}
run();
