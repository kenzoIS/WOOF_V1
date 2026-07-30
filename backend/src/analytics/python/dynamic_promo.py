import sys
import json
import argparse
from datetime import datetime
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import os
import joblib

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'rf_promo_model.joblib')

def train_and_save_model():
    # Generate synthetic historical data for training
    # Features: hour_of_day (0-23), is_weekend (0/1), temp (float), traffic_drop_percent (0-100)
    # Target: success (1) or fail (0)
    
    np.random.seed(42)
    n_samples = 500
    
    hours = np.random.randint(8, 22, n_samples)
    is_weekend = np.random.randint(0, 2, n_samples)
    temps = np.random.uniform(20.0, 35.0, n_samples)
    traffic_drops = np.random.uniform(10.0, 60.0, n_samples)
    
    # Logic for synthetic success:
    # higher traffic drop + high temp (e.g. afternoon heat) = better promo conversion
    # weekends might convert better
    success = []
    for i in range(n_samples):
        score = 0
        if traffic_drops[i] > 30: score += 2
        if temps[i] > 30: score += 1
        if 13 <= hours[i] <= 16: score += 1
        if is_weekend[i] == 1: score += 1
        
        # Add some random noise
        prob = score / 5.0 + np.random.uniform(-0.1, 0.1)
        success.append(1 if prob > 0.5 else 0)
        
    df = pd.DataFrame({
        'hour': hours,
        'is_weekend': is_weekend,
        'temp': temps,
        'traffic_drop': traffic_drops,
        'success': success
    })
    
    X = df[['hour', 'is_weekend', 'temp', 'traffic_drop']]
    y = df['success']
    
    # Train Random Forest
    rf = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
    rf.fit(X, y)
    
    joblib.dump(rf, MODEL_PATH)
    return rf

def predict_promo_success(hour, is_weekend, temp, traffic_drop):
    if not os.path.exists(MODEL_PATH):
        rf = train_and_save_model()
    else:
        rf = joblib.load(MODEL_PATH)
        
    X_new = pd.DataFrame({
        'hour': [hour],
        'is_weekend': [is_weekend],
        'temp': [temp],
        'traffic_drop': [traffic_drop]
    })
    
    # Get probability of class 1 (success)
    prob = rf.predict_proba(X_new)[0][1]
    
    # Feature importances
    importances = dict(zip(X_new.columns, rf.feature_importances_))
    
    return {
        "probabilityScore": float(prob),
        "featureImportance": importances
    }

if __name__ == "__main__":
    try:
        input_data = json.load(sys.stdin)
        hour = input_data.get('hour')
        is_weekend = input_data.get('is_weekend')
        temp = input_data.get('temp')
        traffic_drop = input_data.get('traffic_drop')
        
        if any(x is None for x in [hour, is_weekend, temp, traffic_drop]):
            raise ValueError("Missing required inputs")
            
        result = predict_promo_success(hour, is_weekend, temp, traffic_drop)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
