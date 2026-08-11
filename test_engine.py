import json
import subprocess
import os

# Get rows from Supabase
print("Fetching from Supabase...")
out = subprocess.check_output(['node', '-e', """
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '/Users/rico/Downloads/WOOF/WOOF_V1/backend/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data } = await supabase.from('fact_cross_channel_transactions').select('*');
  console.log(JSON.stringify(data));
}
run();
"""])
history_rows = json.loads(out)

print(f"Got {len(history_rows)} rows from Supabase.")

payload = {
    "hour": 8,
    "is_weekend": 0,
    "temp": 30,
    "traffic_drop": 37.0,
    "discount_depth": 0.15,
    "baseline_units": 3.64,
    "baseline_margin_rate": 0.30,
    "history_rows": history_rows
}

print("Running dynamic_promo.py...")
out_promo = subprocess.check_output(['python3', 'backend/src/analytics/python/dynamic_promo.py'], input=json.dumps(payload).encode('utf-8'))
print(out_promo.decode('utf-8'))
