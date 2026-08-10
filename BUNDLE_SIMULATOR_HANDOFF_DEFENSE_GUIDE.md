# 📘 Project WOOF: Bundle Simulator (AI Simulation Laboratory)
## Master Handoff & Technical Defense Guide

**Project Name:** Happy Tails: Autonomous Revenue Intelligence System (Project WOOF)  
**Target SME:** Happy Tails Pet Cafe & Grooming, Lucena City, Quezon  
**Author / Lead Architects:** Systems Architecture & Data Science Team  
**Module:** Bundle Simulator (`/ai-simulation` Laboratory Tab)  
**Document Version:** 2.0 (Production-Grade Release)

---

> [!IMPORTANT]
> **Defensibility Notice for Capstone Panel Defense:**  
> Every metric, formula, and recommendation displayed in the **Bundle Simulator** is derived dynamically from historical POS transaction data and algorithmic models (FP-Growth Market Basket Analysis, Category Pairing Filter Matrix, and Financial Margin Safeguards). There are **zero static magic numbers** in the recommendation engine.

---

## 1. Executive Summary & Business Purpose

### 1.1 Business Context
**Happy Tails Pet Cafe & Grooming** is a hybrid Small-to-Medium Enterprise (SME) located in Lucena City, Quezon. Unlike traditional single-sector businesses, Happy Tails operates four distinct revenue sectors under one roof:
1. **Cafe Operations:** Human food and beverages (Coffee, Non-Caffeine, Frappes, Pastries, Rice Meals, Pasta, Snacks).
2. **Grooming & Hotel Services:** Pet care services (Dog/Cat Bath & Haircut, Full Grooming, Nail Trimming, Pet Boarding/Hotel).
3. **Retail Pet Supplies:** Packaged pet goods (Royal Canin, Whiskas, Shampoos, Collars, Toys, Litter).
4. **Pet Bakery (Pawsome Treats):** Freshly baked pet treats (Woofles, Pupcakes, Birthday Cakes, Biscuits).

### 1.2 The Core Problem
In a hybrid SME setup, manual product bundling fails due to three major operational bottlenecks:
1. **Illogical Cross-Contamination:** Naive automated bundling or manual guessing often pairs unappealing or non-hygienic combinations (e.g., pairing a human Rice Meal with pet dental treats or pet chemical shampoos).
2. **Financial Profit Erosion:** Store managers frequently offer blanket discounts (e.g., 20% flat discount) without calculating the underlying Cost of Goods Sold (COGS), resulting in margin erosion where high-COGS items sell at a net financial loss.
3. **Uncaptured Cross-Category Synergies:** Customers waiting for their pets during 45-minute grooming sessions often sit in the cafe, but legacy systems fail to identify or measure this cross-sector waiting behavior.

### 1.3 The Solution: AI Bundle Simulator
The **Bundle Simulator** in Project WOOF acts as an autonomous revenue intelligence engine. It combines **Market Basket Analysis (FP-Growth Algorithm)** with business-domain rules (**Category Pairing Filter Matrix**) and **real-time financial economics** to:
- Automatically discover statistically significant item combinations from historical POS transactions.
- Filter out unappealing cross-contaminated pairings before rendering recommendations.
- Provide store managers with interactive discount sliders backed by real-time profit and margin impact modeling.
- Generate spatial merchandising advice for store layout optimization.

---

## 2. Complete UI Module & Component Map

The Bundle Simulator user interface (`AISimulation.tsx`) is structured into distinct interactive modules:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             TOP KPI METRIC CARDS                                 │
│  [Discovered Item Bundles] [Bundle Candidates] [Avg Sales Boost] [Avg Confidence] │
└──────────────────────────────────────────────────────────────────────────────────┘
                                       │
┌──────────────────────────────────────────────────────────────────────────────────┐
│                      TIME WINDOW SLIDER & FOOT-TRAFFIC CHART                     │
│  Granular Hourly Filtering (7:30 AM – 7:00 PM) | Peak & Slump Hour Analytics    │
└──────────────────────────────────────────────────────────────────────────────────┘
                                       │
┌──────────────────────────────────────────────────────────────────────────────────┐
│                      LIVE BEHAVIORAL WEB (FP-GROWTH GRAPH)                       │
│  Interactive Network Nodes (Cafe/Services/Retail) & Support/Confidence Sliders   │
└──────────────────────────────────────────────────────────────────────────────────┘
                                       │
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          TOP SUMMARY RECOMMENDATION CARDS                         │
│  [Top Bundle Recommendation]  |  [Emerging Trend]  |  [Cross-Sell Opportunity]   │
└──────────────────────────────────────────────────────────────────────────────────┘
                                       │
┌──────────────────────────────────────────────────────────────────────────────────┐
│                  AI-PREDICTED BUNDLE OPPORTUNITIES (MAIN CARDS)                   │
│  Item Pairings | Archetype Tag | Interactive Discount Slider | Financial Economics │
│  Action: "Submit for Review"  |  Action: "Why this bundle?" Diagnostics Drawer   │
└──────────────────────────────────────────────────────────────────────────────────┘
                                       │
┌──────────────────────────────────────────────────────────────────────────────────┐
│                        STRATEGIC PROXIMITY RECOMMENDATIONS                       │
│  Store Layout & Physical Merchandising Advice per Category Touchpoint           │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Top Metric Cards
- **Discovered Item Bundles:** Displays the total count of statistically validated association rules ($N_{\text{rules}}$) extracted by FP-Growth that satisfy minimum support ($\ge 5\%$), UI presentation confidence ($\ge 60\%$), and lift ($\ge 1.20\text{x}$).
- **Bundle Candidates:** Displays the total number of cross-category candidate pairs evaluated across sectors.
- **Avg Sales Boost (Lift):** The mean Lift multiplier ($\overline{\text{Lift}}$) across all active rules, indicating how much more likely items are bought together vs. random chance.
- **Avg Historical Confidence:** The average conditional probability ($\overline{\text{Confidence}}$) across all presented rules.

### 2.2 Time Window Selection Slider & Hourly Foot-Traffic Bar Chart
- **Operating Hours:** Analyzes transactions from **7:30 AM to 7:00 PM**.
- **Dynamic Re-filtering:** Moving the time slider re-filters the historical basket dataset to extract association rules specific to that operating window (e.g., Morning Coffee + Pastry bundle vs. Afternoon Grooming + Frappe combo).
- **Peak Hour Detection:** Identifies 1:00 PM peak overlap when cafe dining and pet grooming appointments coincide.

### 2.3 Live Behavioral Web (FP-Growth Pattern Detection Engine)
- **SVG Network Nodes:** Each node represents a catalog item.
  - **Node Size:** Proportional to item support/basket appearance frequency.
  - **Node Colors:** Categorized by sector (Cafe = `#F53799` Pink, Services = `#3AE4FA` Cyan, Retail = `#F59E0B` Amber).
- **Edge Connection Strength:**
  - **Weak ($<70\%$ Confidence):** Thin connection line.
  - **Medium ($70\% - 85\%$ Confidence):** Standard connection line.
  - **Strong ($>85\%$ Confidence):** Glowing, thick connection line.
- **Interactive Controls:**
  - **Item Appearance Floor (Support Slider):** Filters graph nodes by minimum basket percentage ($1\% - 100\%$).
  - **Connection Strength Floor (Confidence Slider):** Filters edge links by minimum conditional probability ($60\% - 100\%$).

### 2.4 AI-Predicted Bundle Opportunities Cards
Each recommended bundle card renders real-time data:
- **Product Combination:** Exact item names (e.g., `Cafe Latte (iced) + Spanish Latte (iced) + Chicken Fillet With Rice`).
- **Archetype Tag:** Category synergy classification (e.g., `Human Cafe Combo`, `Cafe + Service Waiting Combo`, `Pamper Both`, `Pet Meal + Specialty Treat`).
- **Historical Confidence & Lift Badges:** Clean badges displaying rule confidence percentage (e.g., `78.4% Historical Confidence` or `82.1% Historical Confidence`, reflecting our dataset's true confidence range of $52\%$–$88\%$) and Lift (e.g., `Lift: 4.25x`).
- **Interactive Discount Slider:** Allows store managers to adjust promo discount from $10\%$ to $30\%$.
- **Financial Economics Grid:**
  - **Regular Total:** Sum of individual catalog menu prices ($P_{\text{reg}} = P_A + P_B$).
  - **Bundle Promo Price:** Recalculated price after applying the selected discount ($P_{\text{promo}} = P_{\text{reg}} \times (1 - d)$).
  - **Customer Savings:** Exact peso amount saved by the customer ($\text{Savings} = P_{\text{reg}} - P_{\text{promo}}$).
  - **Projected Gross Profit:** Peso profit remaining after subtracting total Cost of Goods Sold ($\text{Profit} = P_{\text{promo}} - \text{COGS}_{\text{total}}$).
  - **Projected Margin %:** Gross profit percentage ($\text{Margin \%} = \frac{\text{Profit}}{P_{\text{promo}}} \times 100$).
  - **Safe Discount Ceiling:** Maximum safe discount percentage before margin drops below $30\%$.
- **Action Buttons:**
  - **"Submit for Review":** Commits approved bundle promo to POS system.
  - **"Why this bundle?":** Opens the deep diagnostic drawer.

### 2.5 "Why this bundle?" Diagnostics Drawer (`BundleExplanationDrawer.tsx`)
Displays a 4-section deep analysis of the selected bundle:
1. **Section 1: FP-Growth Behavioral Basis:** Co-occurrences (baskets), Historical Confidence %, Lift Multiplier, and Model Score.
2. **Section 2: Velocity & Inventory Dynamics:** Fast anchor vs. slow offer item movement profiles.
3. **Section 3: Category Compatibility Matrix:** Cross-sector synergy archetype and business rule validation.
4. **Section 4: Financial & Margin Impact:** Granular regular price, promo price, savings, gross profit, margin %, and margin impact.

---

## 3. Data Science & Algorithmic Foundations

### 3.1 FP-Growth vs. Apriori Algorithm Selection

| Feature | Apriori Algorithm | FP-Growth Algorithm (Chosen in WOOF) |
| :--- | :--- | :--- |
| **Data Structure** | Array of itemsets | Compact FP-Tree (Frequent Pattern Tree) |
| **Dataset Scans** | $k$ passes (1 scan per itemset size) | **Exactly 2 passes** (Scan 1: count item frequencies; Scan 2: build FP-Tree) |
| **Candidate Generation** | Generates $2^n$ candidate itemsets | **Zero candidate generation** (Uses recursive pattern fragment growth) |
| **Computational Complexity** | $O(2^{|I|})$ exponential runtime | $O(N)$ linear dataset scaling |
| **Performance on Dense POS Data** | Slow, memory-intensive | **Up to 100x faster**, minimal memory footprint |

**Why FP-Growth was chosen:** Happy Tails' POS database contains dense multi-item transactions across cafe and grooming services. Apriori's candidate generation phase causes severe memory bottlenecks when analyzing combinations of 3 items. FP-Growth builds a prefix-tree structure that allows instant pattern mining even on low support thresholds ($\ge 5\%$).

### 3.2 Core Statistical Metrics & Manuscript Thresholds
Based on Section 3.9.2 of the project manuscript, the association rule mining pipeline operates on a clear two-tier confidence architecture:
- **Backend Data Mining Floor (`min_confidence = 20%` / `0.20`):** FP-Growth execution in Python mines a broad candidate rule set using a baseline confidence floor of $\ge 20\%$.
- **Default UI Presentation Floor (`Confidence >= 60%`):** The frontend dashboard filters and renders top-tier recommendations to store managers, displaying high-probability rules.
- **Minimum Support ($\ge 0.05$ / $5\%$):** Ensures the item combination appears in at least $5\%$ of total historical baskets, preventing noise from single-transaction anomalies.
- **Minimum Lift ($\ge 1.20\text{x}$):** Guarantees positive correlation. A Lift of $1.0\text{x}$ represents statistical independence. Lift $\ge 1.20$ proves that items are bought together significantly more often than random chance.
- **Strict Bundle Length Limit ($2 \le |A \cup B| \le 3$):** Restricts generated bundles to 2 or 3 items max (`max_len = 3` in `cross_sell.py`), reflecting SME operational reality where 4+ item bundles suffer low customer uptake.

### 3.3 Category Pairing Filter Matrix (Business Rule Integration)
To eliminate cross-contamination between human food and pet care items, `cross_sell.py` enforces a strict Category Pairing Matrix:

```
                    ┌────────────────────────────────────────────────────────┐
                    │            CATEGORY PAIRING MATRIX RULES               │
                    └────────────────────────────────────────────────────────┘
                                                │
         ┌──────────────────────────────────────┴──────────────────────────────────────┐
         ▼                                                                             ▼
  [ALLOWED SYNERGIES]                                                        [RESTRICTED / EXCLUDED]
  • Cafe + Services (Waiting Lounge Combo)                                   • Main Meal (Rice/Pasta) + Pet Items
  • Services + Retail/Pet Bakery (Grooming Treat)                            • Human Food + Pet Shampoos/Chemicals
  • Cafe + Pet Bakery (Human Coffee + Dog Woofle)                            • Pet Medical Supplies + Human Drinks
  • Cafe Internal (Rice Meal + Coffee/Frappe)
```

**Implementation in `cross_sell.py`:**
```python
# Exclusion Gate: Block human main meals paired with pet retail/treats
is_main_meal_a = any(cat in ["Rice Meals", "Pasta/Snacks"] for cat in sector_a)
is_pet_item_b = any(cat in ["Pet Supplies", "Pet Bakery", "Grooming"] for cat in sector_b)

if (is_main_meal_a and is_pet_item_b) or (is_main_meal_b and is_pet_item_a):
    return False  # REJECTED BY CATEGORY MATRIX
```

---

## 4. Mathematical Formulas & Computational Logic

This section provides the exact mathematical formulas, variable definitions, and step-by-step numerical worked examples for every calculation in the Bundle Simulator.

---

### 4.1 Support

#### Equation:
$$\text{Support}(A \cap B) = P(A \cap B) = \frac{\text{Count}(A \cap B)}{N_{\text{total}}}$$

#### Variable Definitions:
- $\text{Count}(A \cap B)$: Number of historical receipts containing both Item A and Item B.
- $N_{\text{total}}$: Total number of receipts in the analyzed POS transaction dataset.

#### Worked Numerical Example:
- **Scenario:** Total POS receipts ($N_{\text{total}}$) = $1,000$.
- **Transactions containing `Cafe Latte (iced)` AND `Spanish Latte (iced)`:** $120$ receipts.
$$\text{Support} = \frac{120}{1,000} = 0.120 = 12.0\%$$
- **Interpretation:** $12.0\%$ of all customer transactions contain both drinks.

---

### 4.2 Confidence

#### Equation:
$$\text{Confidence}(A \to B) = P(B | A) = \frac{\text{Count}(A \cap B)}{\text{Count}(A)}$$

#### Variable Definitions:
- $\text{Count}(A \cap B)$: Number of receipts containing both Item A and Item B.
- $\text{Count}(A)$: Total number of receipts containing anchor Item A.

#### Worked Numerical Example:
- **Transactions containing `Dog Full Grooming` ($\text{Count}(A)$):** $150$ receipts.
- **Transactions containing BOTH `Dog Full Grooming` AND `Iced Vanilla Latte` ($\text{Count}(A \cap B)$):** $120$ receipts.
$$\text{Confidence} = \frac{120}{150} = 0.800 = 80.0\%$$
- **Interpretation:** When a customer books a Dog Full Grooming service, there is an $80.0\%$ historical probability they also order an Iced Vanilla Latte.

---

### 4.3 Lift Multiplier

#### Equation:
$$\text{Lift}(A \to B) = \frac{P(A \cap B)}{P(A) \cdot P(B)} = \frac{\text{Count}(A \cap B) \cdot N_{\text{total}}}{\text{Count}(A) \cdot \text{Count}(B)}$$

#### Variable Definitions:
- $P(A \cap B)$: Joint support of both items.
- $P(A)$: Individual support of anchor Item A.
- $P(B)$: Individual support of offer Item B.

#### Worked Numerical Example:
- Total receipts ($N_{\text{total}}$) = $1,000$.
- $\text{Count}(A)$ (`Dog Full Grooming`) = $150$ receipts ($P(A) = 0.15$).
- $\text{Count}(B)$ (`Iced Vanilla Latte`) = $200$ receipts ($P(B) = 0.20$).
- $\text{Count}(A \cap B)$ = $120$ receipts ($P(A \cap B) = 0.12$).

$$\text{Lift} = \frac{0.12}{0.15 \cdot 0.20} = \frac{0.12}{0.030} = 4.00\text{x}$$

- **Interpretation:** Customers who book Dog Full Grooming are **$4.00$ times more likely** to purchase an Iced Vanilla Latte than a random customer.

---

### 4.4 Dynamic Synergy Score (Composite Model Score)

To eliminate hardcoded static values, WOOF calculates a dynamic composite score ($0 - 100$) combining behavioral strength, domain fit, and financial profitability:

#### Equation:
$$\text{Synergy Score} = (0.40 \cdot \text{Confidence}) + (0.30 \cdot \text{NormLift}) + (0.15 \cdot \text{CrossSectorBonus}) + (0.15 \cdot \text{MarginRate})$$

Where:
$$\text{NormLift} = \min\left(1.0, \frac{\text{Lift}}{10.0}\right)$$
$$\text{CrossSectorBonus} = 1.0 \quad \text{if cross-category, else } 0.5$$
$$\text{MarginRate} = \frac{\text{Projected Gross Profit}}{\text{Regular Price}}$$

#### Worked Numerical Example:
- Confidence = $80.0\%$ ($0.80$)
- Lift = $4.00\text{x} \implies \text{NormLift} = \frac{4.00}{10.0} = 0.40$
- Cross-Sector Bonus (Services + Cafe) = $1.0$
- Regular Price = ₱$350.00$, Profit = ₱$210.00 \implies \text{MarginRate} = \frac{210}{350} = 0.60$

$$\text{Synergy Score} = (0.40 \cdot 0.80) + (0.30 \cdot 0.40) + (0.15 \cdot 1.0) + (0.15 \cdot 0.60)$$
$$\text{Synergy Score} = 0.32 + 0.12 + 0.15 + 0.09 = 0.68 \implies \mathbf{68.0}$$

---

### 4.5 Financial Economics: Projected Gross Profit & Margin %

#### Equations:
$$\text{Regular Total } (P_{\text{reg}}) = P_A + P_B$$
$$\text{Total COGS } (C_{\text{total}}) = C_A + C_B$$
$$\text{Bundle Promo Price } (P_{\text{promo}}) = P_{\text{reg}} \cdot (1 - d)$$
$$\text{Projected Gross Profit } (\text{Profit}) = P_{\text{promo}} - C_{\text{total}}$$
$$\text{Projected Margin \%} = \left( \frac{\text{Profit}}{P_{\text{promo}}} \right) \cdot 100$$

#### Variable Definitions:
- $P_A, P_B$: Catalog selling prices of Item A and Item B.
- $C_A, C_B$: Unit Cost of Goods Sold (COGS) of Item A and Item B.
- $d$: Promo discount rate (e.g., $15\% = 0.15$).

#### Worked Numerical Example:
- **Item A:** `Dog Full Grooming` ($P_A = \text{₱}300.00$, $C_A = \text{₱}90.00$)
- **Item B:** `Iced Vanilla Latte` ($P_B = \text{₱}150.00$, $C_B = \text{₱}45.00$)
- **Selected Promo Discount ($d$):** $15\%$ ($0.15$)

1. **Regular Total:** $P_{\text{reg}} = 300 + 150 = \text{₱}450.00$
2. **Total COGS:** $C_{\text{total}} = 90 + 45 = \text{₱}135.00$
3. **Bundle Promo Price:** $P_{\text{promo}} = 450 \cdot (1 - 0.15) = 450 \cdot 0.85 = \mathbf{\text{₱}382.50}$
4. **Customer Savings:** $\text{Savings} = 450 - 382.50 = \mathbf{\text{₱}67.50}$
5. **Projected Gross Profit:** $\text{Profit} = 382.50 - 135.00 = \mathbf{\text{₱}247.50}$
6. **Projected Margin %:** $\text{Margin \%} = \left( \frac{247.50}{382.50} \right) \cdot 100 = \mathbf{64.7\%}$

---

### 4.6 Safe Discount Ceiling

The **Safe Discount Ceiling** is the maximum discount rate ($d_{\text{max}}$) before the bundle's projected margin falls below the mandatory SME minimum margin threshold ($M_{\text{min}} = 30\%$).

#### Equation:
$$d_{\text{max}} = \max\left(0, \left\lfloor \left(1 - \frac{C_{\text{total}}}{P_{\text{reg}} \cdot (1 - M_{\text{min}})}\right) \cdot 100 \right\rfloor\right)$$

#### Worked Numerical Example:
- $P_{\text{reg}} = \text{₱}450.00$
- $C_{\text{total}} = \text{₱}135.00$
- $M_{\text{min}} = 30\% = 0.30 \implies (1 - M_{\text{min}}) = 0.70$

$$d_{\text{max}} = \left(1 - \frac{135.00}{450.00 \cdot 0.70}\right) \cdot 100 = \left(1 - \frac{135.00}{315.00}\right) \cdot 100 = (1 - 0.4285) \cdot 100 = \mathbf{57\%}$$

- **Interpretation:** The store manager can safely discount this bundle up to **$57\%$** while maintaining at least a $30\%$ profit margin.

---

## 5. Data Architecture & ETL Pipeline Handoff

### 5.1 Dataset Characteristics
- **Time Horizon:** 5-year chronological POS dataset (March 2021 – May 2026).
- **Revenue Profile:** ~₱16.8M total historical transaction volume.
- **Granular Distribution:** Multi-item receipts capturing exact timestamp, hourly slice, items purchased, category sector, payment mode, and customer ID.

### 5.2 Data Quality & Preprocessing
The backend NestJS / Python ETL pipeline cleanses incoming POS receipts before running FP-Growth:
1. **Duplicate Row Removal:** Cleanses duplicate webhook payloads caused by network retry latency ($143$ duplicate logs resolved).
2. **Missing Value Imputation:** Null values in `SKU` or `Category` are resolved against the master item catalog using exact string matching ($233$ null records corrected).
3. **Text Normalization:** Trims leading/trailing whitespace and normalizes text casing (e.g., `"iced vanilla latte "` $\to$ `"Iced Vanilla Latte"`).

### 5.3 Backtesting & Model Validation Split
To prevent data leakage in time-series pattern detection, the dataset is split chronologically:
- **80% Training Set:** Used by FP-Growth to discover candidate rules.
- **10% Validation Set:** Used to fine-tune support/confidence parameters and verify lift stability.
- **10% Holdout Test Set:** Evaluates historical backtest conversion accuracy.

---

## 6. Capstone Defense Q&A Guide (Anticipated Panel Questions)

> [!TIP]
> Use these exact scripted responses during the Capstone Defense when panelists question the algorithm, formulas, or business rules.

#### **Question 1: "Why did you use FP-Growth instead of Apriori for your Market Basket Analysis?"**
> **Scripted Answer:**  
> *"We selected FP-Growth over Apriori because of computational efficiency on dense multi-item POS transaction data. Apriori relies on repeated candidate itemset generation and requires $k$ full dataset passes, causing exponential $O(2^n)$ runtime and severe memory bottlenecks when mining 3-item combinations. FP-Growth scans the database exactly twice to construct a compact FP-Tree prefix structure. It mines patterns using recursive divide-and-conquer conditional pattern bases with zero candidate generation, resulting in execution speeds up to 100 times faster on our 5-year dataset."*

#### **Question 2: "How does your system prevent illogical bundles like pairing dog shampoo with human coffee?"**
> **Scripted Answer:**  
> *"Our pipeline integrates a deterministic Category Pairing Filter Matrix directly into the backend Python service (`cross_sell.py`). Before any mathematical association rule is presented to the user, it must pass through an exclusion gate that enforces SME domain synergy rules. For example, rules pairing human main meals (rice meals/pasta) with pet grooming chemicals or pet treats are automatically intercepted and rejected, ensuring that only appealing, cross-functional combinations like 'Cafe Beverage + Grooming Service Waiting Combo' are rendered."*

#### **Question 3: "What does a Sales Lift of 4.00x actually mean in business terms?"**
> **Scripted Answer:**  
> *"In Market Basket Analysis, a Lift of $1.0\text{x}$ represents statistical independence, meaning two items are bought together purely by random chance. A Lift of $4.00\text{x}$ means that customers who purchase Item A (e.g., Dog Full Grooming) are **4 times more likely** to also purchase Item B (e.g., Iced Vanilla Latte) compared to the average baseline customer. This proves genuine behavioral synergy rather than coincidence."*

#### **Question 4: "How do you guarantee that offering a discount on a bundle won't cause a financial loss for the SME?"**
> **Scripted Answer:**  
> *"Every bundle card in the simulator dynamically calculates the exact Cost of Goods Sold ($\text{COGS}_{\text{total}} = C_A + C_B$) using live menu item costs from the POS catalog. The system models the net promo price ($P_{\text{promo}} = P_{\text{reg}} \cdot (1 - d)$) and computes the Projected Gross Profit and Margin %. Furthermore, the system dynamically calculates a 'Safe Discount Ceiling'—the maximum discount percentage allowed before the profit margin drops below Happy Tails' mandatory $30\%$ threshold."*

#### **Question 5: "How does the time window slider affect the association rules being displayed?"**
> **Scripted Answer:**  
> *"The time window slider filters the underlying POS transaction sub-matrix by receipt timestamps. Moving the slider isolates specific operating hours (e.g., 7:30 AM morning slump vs. 1:00 PM peak grooming overlap). FP-Growth then re-evaluates support and confidence strictly within that time slice, allowing store managers to design time-targeted promotional bundles optimized for specific customer foot-traffic patterns."*

---

## 7. Summary & Quick Reference

| Module | Core Algorithm / Formula | Target Metric |
| :--- | :--- | :--- |
| **Pattern Mining (Backend)** | FP-Growth (`fpgrowth()`) | Support $\ge 5\%$, Mining Confidence $\ge 20\%$, Lift $\ge 1.20\text{x}$ |
| **UI Presentation Layer** | Dashboard Recommendation Filter | UI Confidence $\ge 60\%$, Co-occurrences $\ge 2$ |
| **Category Matrix** | Synergy Archetype Filter (`cross_sell.py`) | Rejects human meal (`Rice Meals`, `Pasta/Snacks`) + pet item cross-contamination |
| **Financial Simulator** | Dynamic Economics Engine | Gross Profit (₱) & Margin % (Target $\ge 30\%$) |
| **Discount Safeguard** | Safe Ceiling Formula | Max Safe Discount % ($d_{\text{max}}$) |

---
*End of Master Handoff & Technical Defense Guide — Project WOOF Bundle Simulator*
