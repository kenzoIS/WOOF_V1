const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data } = await supabase.from('fact_cross_channel_transactions').select('*').limit(500);
  const rows = data.map(row => ({
    transactionTimestamp: row.transaction_timestamp,
    itemKey: row.product_id || row.service_id || 'unknown',
    channelKey: row.channel_id || 'unknown',
    segmentKey: row.segment_id || 'unknown',
    quantitySold: Number(row.quantity_sold || 0),
    grossSales: Number(row.gross_sales || 0),
    discountAmount: Number(row.discount_amount || 0),
    discountDepth: Number(row.discount_depth || 0),
    netSales: Number(row.net_sales || 0),
    grossProfit: Number(row.gross_profit || 0),
  }));
  const payload = {
    trainingRows: rows,
    hour: 16,
    is_weekend: 0,
    temp: 28,
  };
  const result = execSync('python3 src/analytics/python/dynamic_promo.py', { input: JSON.stringify(payload) });
  console.log(result.toString());
}
run();
