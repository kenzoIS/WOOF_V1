import os, json, subprocess

out = subprocess.check_output(['node', '-e', """
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '/Users/rico/Downloads/WOOF/WOOF_V1/backend/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const columns = ['transaction_timestamp', 'quantity_sold'].join(',');
  const { data: discountedRes } = await supabase.from('fact_cross_channel_transactions').select(columns).gt('gross_sales', 0).or('discount_amount.gt.0,discount_depth.gt.0').order('transaction_timestamp', { ascending: false }).limit(500);
  const { data: normalRes } = await supabase.from('fact_cross_channel_transactions').select(columns).gt('gross_sales', 0).eq('discount_amount', 0).eq('discount_depth', 0).order('transaction_timestamp', { ascending: false }).limit(500);
  let data = [];
  if (discountedRes) data = data.concat(discountedRes);
  if (normalRes) data = data.concat(normalRes);
  
  const formatted = data.map(row => ({
      transactionTimestamp: row.transaction_timestamp,
      quantitySold: Number(row.quantity_sold || 0)
  }));
  console.log(JSON.stringify(formatted));
}
run();
"""])
# Strip out any potential dotenv logs that node outputs
try:
    data_str = out.decode('utf-8')
    data = json.loads(data_str.split('\n')[-2])
except:
    data = json.loads(out)

import pandas as pd
import numpy as np

df = pd.DataFrame(data)
df["transactionTimestamp"] = pd.to_datetime(df["transactionTimestamp"])
df["hour"] = df["transactionTimestamp"].dt.hour
df["quantitySold"] = pd.to_numeric(df["quantitySold"], errors="coerce").fillna(0)

hourly_sales = df.groupby("hour")["quantitySold"].sum()
print("Hourly sales:", hourly_sales.to_dict())

peak_volume = hourly_sales.max()
business_hours = hourly_sales.loc[hourly_sales.index.isin(range(9, 18))]
slump_hour = business_hours.idxmin()
slump_volume = business_hours.min()
print("Slump hour:", slump_hour, "Slump volume:", slump_volume, "Peak:", peak_volume)

traffic_drop = ((peak_volume - slump_volume) / peak_volume) * 100
print("Drop:", traffic_drop)
