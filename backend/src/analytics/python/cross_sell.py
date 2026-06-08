import sys
import json
import warnings
import pandas as pd
from mlxtend.frequent_patterns import fpgrowth, association_rules
from mlxtend.preprocessing import TransactionEncoder

warnings.filterwarnings('ignore')

def run_cross_sell(baskets):
    try:
        if not baskets or len(baskets) < 5:
            return {"rules": [], "totalBaskets": len(baskets), "message": "Not enough data"}
            
        dataset = [b['items'] for b in baskets if len(b['items']) > 1]
        if len(dataset) < 5:
             return {"rules": [], "totalBaskets": len(baskets), "message": "Not enough multi-item baskets"}
             
        te = TransactionEncoder()
        te_ary = te.fit(dataset).transform(dataset)
        df = pd.DataFrame(te_ary, columns=te.columns_)
        
        # FP-Growth
        frequent_itemsets = fpgrowth(df, min_support=0.01, use_colnames=True)
        if frequent_itemsets.empty:
            return {"rules": [], "totalBaskets": len(baskets), "message": "No frequent itemsets found"}
            
        try:
            # Note: mlxtend association_rules sometimes returns a DataFrame with frozen sets
            rules = association_rules(frequent_itemsets, metric="lift", min_threshold=1.0)
        except Exception as e:
            # Fallback if metric lift fails
            rules = pd.DataFrame()
            
        if rules.empty:
            return {"rules": [], "totalBaskets": len(baskets), "message": "No association rules found"}
            
        rules_output = []
        for _, row in rules.iterrows():
            # Get the first item from the frozenset
            item_a = list(row['antecedents'])[0] if len(row['antecedents']) > 0 else "Unknown"
            item_b = list(row['consequents'])[0] if len(row['consequents']) > 0 else "Unknown"
            rules_output.append({
                "itemA": str(item_a),
                "itemB": str(item_b),
                "support": round(float(row['support']), 4),
                "confidence": round(float(row['confidence']), 4),
                "lift": round(float(row['lift']), 2),
                "cooccurrences": int(row['support'] * len(dataset))
            })
            
        rules_output = sorted(rules_output, key=lambda x: x['lift'], reverse=True)[:30]
        
        return {
            "rules": rules_output,
            "totalBaskets": len(baskets),
            "multiItemBaskets": len(dataset)
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    input_data = sys.stdin.read()
    try:
        data = json.loads(input_data)
        result = run_cross_sell(data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": "Invalid JSON input or script error: " + str(e)}))
