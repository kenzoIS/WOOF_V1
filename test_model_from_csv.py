import pandas as pd
import json
import subprocess

df = pd.read_csv('/Users/rico/Downloads/WOOF/WOOF_V1/HappyTailsPC_Fixed.csv')

# Convert CSV to history_rows format for dynamic_promo.py
# columns: transaction_timestamp, product_id, service_id, channel_id, segment_id, quantity_sold, gross_sales, discount_amount, discount_depth, net_sales, gross_profit
df['transaction_timestamp'] = df['Transaction Date']
df['product_id'] = df['SKU'].astype(str)
df['service_id'] = None
df['channel_id'] = 'POS'
df['segment_id'] = df['Category']
df['quantity_sold'] = df['Items Sold']
df['gross_sales'] = df['Gross Sales']
df['discount_amount'] = df['Discounts']
# recalculate depth
df['discount_depth'] = df['Discounts'] / df['Gross Sales']
df['net_sales'] = df['Net Sales']
df['gross_profit'] = df['Gross Profit']

# Take the 500 most recent discounted rows and 500 most recent normal rows
discounted = df[df['discount_amount'] > 0].sort_values('transaction_timestamp', ascending=False).head(15000)
normal = df[df['discount_amount'] == 0].sort_values('transaction_timestamp', ascending=False).head(15000)

data = pd.concat([discounted, normal])

history_rows = []
for _, row in data.iterrows():
    history_rows.append({
        'transactionTimestamp': str(row['transaction_timestamp']),
        'itemKey': str(row['product_id']),
        'channelKey': 'POS',
        'segmentKey': str(row['segment_id']),
        'quantitySold': float(row['quantity_sold']),
        'grossSales': float(row['gross_sales']),
        'discountAmount': float(row['discount_amount']),
        'discountDepth': float(row['discount_depth']) if pd.notnull(row['discount_depth']) else 0,
        'netSales': float(row['net_sales']),
        'grossProfit': float(row['gross_profit'])
    })

payload = {
    "hour": 8,
    "is_weekend": 0,
    "temp": 30,
    "traffic_drop": 37.0,
    "discount_depth": 0.15,
    "baseline_units": 3.64,
    "baseline_margin_rate": 0.30,
    "trainingSignature": "test_signature2",
    "trainingRows": history_rows
}

out_promo = subprocess.check_output(['python3', 'backend/src/analytics/python/dynamic_promo.py'], input=json.dumps(payload).encode('utf-8'))
print(out_promo.decode('utf-8'))
