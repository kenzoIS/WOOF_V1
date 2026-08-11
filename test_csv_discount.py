import pandas as pd
import sys

csv_path = '/Users/rico/Downloads/HappyTailsPC.csv'
try:
    df = pd.read_csv(csv_path)
except Exception as e:
    print(f"Failed to read CSV: {e}")
    sys.exit(1)

# Ensure required columns are present
required_cols = ['Transaction Date', 'Gross Sales', 'Discounts', 'Net Sales', 'Items Sold']
for col in required_cols:
    if col not in df.columns:
        print(f"Missing column: {col}")
        sys.exit(1)

df['Transaction Date'] = pd.to_datetime(df['Transaction Date'], errors='coerce')
df['hour'] = df['Transaction Date'].dt.hour
df['date'] = df['Transaction Date'].dt.date

# 1. Check natural slump (group by hour)
hourly_volume = df.groupby('hour')['Items Sold'].sum()
print("Hourly Volume:")
print(hourly_volume)

quietest_hour = hourly_volume.idxmin()
peak_hour = hourly_volume.idxmax()
drop = (hourly_volume[peak_hour] - hourly_volume[quietest_hour]) / hourly_volume[peak_hour]
print(f"Quietest hour: {quietest_hour}, Peak hour: {peak_hour}, Drop: {drop:.2%}")

# 2. Check applied discounts
discounted_rows = df[df['Discounts'] > 0]
if not discounted_rows.empty:
    discounted_dates = discounted_rows['date'].nunique()
    print(f"Found discounts on {discounted_dates} distinct days.")
    
    # Calculate discount depth
    discounted_rows['Discount Depth'] = discounted_rows['Discounts'] / discounted_rows['Gross Sales']
    print("Discount Depths applied:")
    print(discounted_rows['Discount Depth'].describe())
    
    # Check volume spikes on discounted days at quietest hour vs normal days
    quiet_hour_df = df[df['hour'] == quietest_hour]
    
    discounted_dates_set = set(discounted_rows['date'])
    quiet_hour_df['has_discount'] = quiet_hour_df['date'].isin(discounted_dates_set)
    
    volume_by_discount = quiet_hour_df.groupby(['date', 'has_discount'])['Items Sold'].sum().reset_index()
    avg_vol = volume_by_discount.groupby('has_discount')['Items Sold'].mean()
    print("Average items sold at quiet hour (has_discount vs normal):")
    print(avg_vol)
else:
    print("No discounts found in the dataset.")
