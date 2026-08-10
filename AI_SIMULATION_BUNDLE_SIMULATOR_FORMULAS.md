# WOOF AI Simulation Engine: Bundle Simulator Complete Mathematical & Algorithmic Formulas

This document provides a comprehensive, mathematically rigorous reference of **ALL formulas, calculations, metrics, and algorithmic decision rules** used in the **Bundle Simulator (AI Cross-Selling Engine)** module of the WOOF Capstone application.

---

## 1. Association Rule Mining & FP-Growth Formulas

The backend uses the **FP-Growth (Frequent Pattern Growth)** algorithm (`mlxtend`) on ingested transaction baskets to discover item co-purchase patterns without candidate generation overhead.

### 1.1 Support
Support measures the historical frequency of an item or itemset across all valid multi-item transaction baskets $N$.

* **Single Item Support ($A$)**:
  $$\text{Support}(A) = \frac{\text{Count of baskets containing item } A}{N}$$

* **Pair Support ($A \rightarrow B$)**:
  $$\text{Support}(A \rightarrow B) = \frac{\text{Count of baskets containing both item } A \text{ and item } B}{N}$$

### 1.2 Confidence
Confidence measures the conditional probability that a customer who purchased Anchor Item $A$ also purchased Offer Item $B$ in the same transaction.

$$\text{Confidence}(A \rightarrow B) = \frac{\text{Support}(A \rightarrow B)}{\text{Support}(A)} = \frac{\text{Count}(A \cap B)}{\text{Count}(A)}$$

### 1.3 Lift Multiplier
Lift measures how much more likely Item $B$ is purchased when Item $A$ is purchased, compared to purchasing Item $B$ randomly and independently.

$$\text{Lift}(A \rightarrow B) = \frac{\text{Support}(A \rightarrow B)}{\text{Support}(A) \times \text{Support}(B)} = \frac{\text{Confidence}(A \rightarrow B)}{\text{Support}(B)}$$

* **Interpretation**:
  - $\text{Lift} > 1.0$: Positive association (items complement each other).
  - $\text{Lift} = 1.0$: Independent purchase behavior.
  - $\text{Lift} < 1.0$: Negative association / substitutes.

### 1.4 Null-Invariant Pattern Mining Metrics (Jiawei Han Framework)

To solve the popular-item bias and null-transaction volatility inherent in standard Lift calculations, the engine computes null-invariant measures:

* **Kulczynski Measure ($\text{Kulc}$)**:
  Measures the arithmetic mean of conditional probabilities $P(A|B)$ and $P(B|A)$:
  $$\text{Kulc}(A, B) = \frac{1}{2} \left( \text{Confidence}(A \rightarrow B) + \text{Confidence}(B \rightarrow A) \right) = \frac{1}{2} \left( \frac{\text{Support}(A \cap B)}{\text{Support}(A)} + \frac{\text{Support}(A \cap B)}{\text{Support}(B)} \right)$$
  - Range: $[0.0, 1.0]$. Values $> 0.5$ indicate genuine positive affinity unaffected by total transaction volume $N$.

* **Imbalance Ratio ($\text{IR}$)**:
  Quantifies support asymmetry between anchor $A$ and offer $B$:
  $$\text{IR}(A, B) = \frac{|\text{Support}(A) - \text{Support}(B)|}{\text{Support}(A) + \text{Support}(B) - \text{Support}(A \cap B)}$$
  - Range: $[0.0, 1.0]$. An $\text{IR} \approx 0.0$ indicates balanced co-purchase; an $\text{IR} \to 1.0$ indicates strong support imbalance ideal for **Fast Anchor + Slow Offer** bundling.

---

## 2. Fast/Slow Item Velocity & Opportunity Scoring Engine

For items that do NOT yet have high co-occurrence counts in FP-Growth, the engine evaluates **Low-Association Opportunities** (pairing high-velocity anchor items with low-velocity offer items).

### 2.1 Velocity Classification (Percentile Rank)
Items are sorted by total sales basket count and assigned a percentile velocity rank:

$$\text{Percentile Rank}(i) = \frac{\text{Rank of Item } i}{\max(\text{Total Unique Items} - 1, 1)}$$

$$\text{Velocity Category} = \begin{cases} 
\text{Fast (Anchor)}, & \text{if Percentile Rank} \le 0.25 \\ 
\text{Slow (Offer)}, & \text{if Percentile Rank} \ge 0.50 \\ 
\text{Moderate}, & \text{otherwise} 
\end{cases}$$

### 2.2 Base Opportunity Score
Measures the unutilized cross-selling potential of a fast-moving item $A$ paired with a slow-moving item $B$:

$$\text{Base Opportunity Score} = \text{Support}(A) \times \left(1.0 - \text{Confidence}(A \rightarrow B)\right)$$

### 2.3 Business Fit Score ($S_{\text{business\_fit}}$)
Combines high-level sector taxonomy compatibility and fine-grained keyword pairing affinities:

$$S_{\text{business\_fit}} = \max\left(S_{\text{sector\_pair}}, S_{\text{keyword\_affinity}}\right)$$

* **Sector Pair Baseline ($S_{\text{sector\_pair}}$)**:
  - Same Sector (e.g. Cafe + Cafe): $0.90$
  - Cross Sector (e.g. Cafe + Retail, Cafe + Services): $0.80$ to $0.85$
  - Default Fallback: $0.50$

### 2.4 Adjusted Opportunity Score
Weights the base opportunity score by business domain appropriateness:

$$\text{Opportunity Score} = \text{Base Opportunity Score} \times \left(0.85 + 0.35 \times S_{\text{business\_fit}}\right)$$

---

## 3. Synergy Score Engine

The **Synergy Score** is a composite metric ($0.0\%$ to $100.0\%$) evaluating the overall cross-selling viability, domain compliance, species alignment, and price balance of a bundle candidate.

### 3.1 Composite Synergy Formula
$$\text{Synergy Score} = \left(0.35 \times \text{Lift}_{\text{norm}} + 0.35 \times C_{\text{compat}} + 0.15 \times S_{\text{match}} + 0.15 \times P_{\text{affinity}}\right) \times 100$$

*(Note: If the pair violates any Golden Guardrail Rule, $\text{Synergy Score} = 0.0\%$)*

### 3.2 Sub-Component Formulas

1. **Normalized Lift ($\text{Lift}_{\text{norm}}$)**:
   Normalizes the sales lift multiplier to a $[0, 1]$ scale against a dataset maximum threshold ($\text{Max Lift} = 5.0$):
   $$\text{Lift}_{\text{norm}} = \min\left(1.0, \max\left(0.0, \frac{\text{Lift} - 1.0}{5.0 - 1.0}\right)\right)$$

2. **Category Compatibility ($C_{\text{compat}}$) & Category Pairing Matrix**:
   Evaluating domain category pair archetypes:
   $$C_{\text{compat}} = \begin{cases} 
   0.0, & \text{if Banned (Same-Type, Drink+Utility, Main Meal+Pet Item, Species Mismatch)} \\ 
   1.0, & \text{if Valid Archetype (Human Cafe Combo, Pamper Both, Cafe+Service Waiting, Service+Aftercare, Pet Meal+Treat)} 
   \end{cases}$$

3. **Species Match ($S_{\text{match}}$)**:
   Ensuring pet species appropriateness:
   $$S_{\text{match}} = \begin{cases} 
   0.0, & \text{if Dog Item + Cat Item (Species Mismatch)} \\ 
   1.0, & \text{if Dog+Dog, Cat+Cat, or Neutral/Human Item} 
   \end{cases}$$

4. **Price Ratio Affinity ($P_{\text{affinity}}$)**:
   Penalizes bundles where the offer item is disproportionately expensive compared to the anchor item:
   $$P_{\text{affinity}} = \begin{cases} 
   1.0, & \text{if } P_{\text{offer}} \le 1.5 \times P_{\text{anchor}} \text{ or price missing} \\
   \max\left(0.0, 1.0 - \frac{P_{\text{offer}} - 1.5 \times P_{\text{anchor}}}{2.0 \times P_{\text{anchor}}}\right), & \text{if } P_{\text{offer}} > 1.5 \times P_{\text{anchor}} 
   \end{cases}$$

---

## 4. Attach-Rate Lift Simulation & Backtesting Engine

Simulates historical performance and predicts attach-rate increases when a bundle promotion is introduced.

### 4.1 Historical Baseline Attach Rate
$$\text{Baseline Attach Rate} = \frac{\text{Baskets containing both } A \text{ and } B}{\text{Baskets containing Anchor } A}$$

### 4.2 Model Predicted Boost & Predicted Attach Rate
$$\Delta_{\text{boost}} = 0.15 \times \text{Confidence} + 0.10 \times S_{\text{business\_fit}}$$

$$\text{Predicted Attach Rate} = \min\left(1.0, \max\left(\text{Baseline Attach Rate}, \text{Baseline Attach Rate} + \Delta_{\text{boost}}\right)\right)$$

### 4.3 Simulated Attach-Rate Lift %
$$\text{Attach Rate Lift \%} = \begin{cases}
\frac{\text{Predicted Attach Rate} - \text{Baseline Attach Rate}}{\text{Baseline Attach Rate}} \times 100.0, & \text{if Baseline Attach Rate} \ge 0.01 \\
\left(\text{Predicted Attach Rate} - \text{Baseline Attach Rate}\right) \times 100.0, & \text{if Baseline Attach Rate} < 0.01
\end{cases}$$

### 4.4 Backtest Validation Status
$$\text{Validation Status} = \begin{cases}
\text{INSUFFICIENT\_DATA}, & \text{if Count}(A) < 5 \text{ historical transactions} \\
\text{PASSED}, & \text{if Attach Rate Lift \%} \ge 5.0\% \\
\text{LOW\_CONFIDENCE}, & \text{otherwise}
\end{cases}$$

---

## 5. Financial Economics & Margin Protection Formulas

Recalculates bundle prices, profit margins, and owner-review discount safety limits.

### 5.1 Regular Total Bundle Price ($P_{\text{regular}}$)
$$P_{\text{regular}} = P_{\text{anchor}} + P_{\text{offer}}$$

### 5.2 Regular Total Cost ($C_{\text{total}}$)
$$C_{\text{total}} = C_{\text{anchor}} + C_{\text{offer}}$$

### 5.3 Bundle Promo Price ($P_{\text{bundle}}$)
Given selected discount percentage $D_{\text{selected}}$:

$$P_{\text{bundle}} = P_{\text{regular}} \times \left(1 - \frac{D_{\text{selected}}}{100}\right)$$

### 5.4 Customer Savings
$$\text{Savings} = P_{\text{regular}} - P_{\text{bundle}} = P_{\text{regular}} \times \left(\frac{D_{\text{selected}}}{100}\right)$$

### 5.5 Projected Gross Profit
$$\text{Projected Gross Profit} = P_{\text{bundle}} - C_{\text{total}}$$

### 5.6 Projected Margin Percentage
$$\text{Projected Margin \%} = \frac{P_{\text{bundle}} - C_{\text{total}}}{P_{\text{bundle}}} \times 100.0$$

### 5.7 Maximum Safe Discount Percentage ($D_{\text{max\_safe}}$)
Calculates the maximum discount that can be offered while maintaining the owner's minimum target margin $M_{\text{target}}$ (e.g. $30.0\%$ or $0.30$):

$$D_{\text{max\_safe}} = \max\left(0.0, \left(1.0 - \frac{C_{\text{total}}}{P_{\text{regular}} \times (1.0 - M_{\text{target}})}\right) \times 100.0\right)$$

### 5.8 Margin Safety Evaluation
$$\text{Margin Is Safe} = \text{Projected Margin \%} \ge \left(M_{\text{target}} \times 100.0\right)$$

### 5.9 Estimated Margin Impact
$$\text{Estimated Margin Impact} = \text{Projected Margin \%} - (M_{\text{target}} \times 100.0)$$

---

## 6. Emerging Trend Identification Rule

$$\text{Is Emerging Trend} = (\text{Co-occurrences} \le 3) \land (\text{Guardrails Valid} = \text{True}) \land (\text{Synergy Score} \ge 70.0\%)$$

---

## Summary Table of Key Parameters

| Metric / Parameter | Variable / Symbol | Default Value / Range | Source File |
| :--- | :--- | :--- | :--- |
| **Minimum Support** | $\text{Min Support}$ | $0.05$ ($5\%$) | `cross_sell.py` |
| **Minimum Confidence** | $\text{Min Confidence}$ | $0.60$ ($60\%$) | `cross_sell.py` |
| **Minimum Lift** | $\text{Min Lift}$ | $1.20\text{x}$ | `cross_sell.py` |
| **Minimum Target Margin** | $M_{\text{target}}$ | $0.30$ ($30\%$) | `cross_sell.py` / `AISimulation.tsx` |
| **Max Lift Threshold** | $\text{Max Lift}$ | $5.0\text{x}$ | `cross_sell.py` |
| **Min Basket Sample** | $N_{\text{min}}$ | $5$ transactions | `backtest.py` |
| **Emerging Trend Max Frequency** | $F_{\text{emerging}}$ | $\le 3$ co-occurrences | `cross_sell.py` / `AISimulation.tsx` |
| **Emerging Trend Min Synergy** | $S_{\text{emerging\_synergy}}$ | $\ge 70.0\%$ | `cross_sell.py` / `AISimulation.tsx` |
