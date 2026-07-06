## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

**WOOF: A Cross-Channel Analytics and Recommendation Activation System for Demand Forecasting, Association-Rule Cross-Selling, and Owner-Governed Campaign Deployment in a Multi-Sector Pet Cafe SME** 

## **A Capstone Project** 

## **presented to the** 

**Department of Information Systems** 

**College of Information and Computing Sciences** 

**University of Santo Tomas** 

## **In Partial Fulfillment** 

**of the Requirements for the degree in Bachelor of Science in Information Systems** 

Buenaventura, Schenly Rein H. 

Julian, Jodell Adrian A. Nisay, Tomas Enrico S. Pagsibigan, Kenzo Rafael D. Fernando, Caesar Gabriel M. 

1 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## Table of Contents 

|**Chapter 1...................................................................................................................................... 5**|**Chapter 1...................................................................................................................................... 5**|**Chapter 1...................................................................................................................................... 5**|**Chapter 1...................................................................................................................................... 5**|
|---|---|---|---|
|1.1 Company Background....................................................................................................... 5|1.1 Company Background....................................................................................................... 5|||
|1.2 Project Context.................................................................................................................. 7|1.2 Project Context.................................................................................................................. 7|||
|1.3 Purpose and Objectives...................................................................................................10|1.3 Purpose and Objectives...................................................................................................10|||
|1.3.1 General Objectives................................................................................................. 10|||1.3.1 General Objectives................................................................................................. 10|
|1.3.2 Specific Objectives..................................................................................................12||||
|1.4 Scope and Delimitations..................................................................................................15|1.4 Scope and Delimitations..................................................................................................15|||
|1.4.1 Scope......................................................................................................................15||||
|1.4.2 Delimitations........................................................................................................... 19|||1.4.2 Delimitations........................................................................................................... 19|
|1.5 Conceptual Framework....................................................................................................22|1.5 Conceptual Framework....................................................................................................22|||
|1.6 Project Milestones and Timeline......................................................................................25|1.6 Project Milestones and Timeline......................................................................................25|||
|1.7  Definition of Terms..........................................................................................................26|1.7  Definition of Terms..........................................................................................................26|||
|**Chapter 2.................................................................................................................................... 35**|||**Chapter 2.................................................................................................................................... 35**|
|2.1 Review of Related Literature........................................................................................... 35|2.1 Review of Related Literature........................................................................................... 35||2.1 Review of Related Literature........................................................................................... 35|
|2.1.1 Data-Driven Strategies for SME..............................................................................35||||
|2.1.2 Cross-Channel Data Integration and Channel Coordination...................................36||||
|2.1.3 Business Intelligence and Decision Support Systems............................................39||||
|2.2 Review of Related Studies...............................................................................................47|2.2 Review of Related Studies...............................................................................................47|||
|2.2.1 Context-Aware Demand and Retail Forecasting.....................................................47||||
|2.2.2 Behavioral Synergy and Demand Integration......................................................... 49|||2.2.2 Behavioral Synergy and Demand Integration......................................................... 49|
|2.2.3 Customer Sentiment and Review Analytics............................................................50||||
|2.2.4 Cross-Channel Operational Efficiency....................................................................52||||
|2.2.5 AI-Assisted Campaign Preparation and PetHub Activation.................................... 53|||2.2.5 AI-Assisted Campaign Preparation and PetHub Activation.................................... 53|
|2.3 Analytical Algorithms, Methods, and Models...................................................................56|2.3 Analytical Algorithms, Methods, and Models...................................................................56|||
|2.4 Related Systems..............................................................................................................86|2.4 Related Systems..............................................................................................................86|||
|2.4.1 Existing Systems and the Gap Analysis||2.4.1 Existing Systems and the Gap Analysis||
|Operational Constraints of Standalone POS Systems......................................................... 86|||Operational Constraints of Standalone POS Systems......................................................... 86|
|2.5 Related Technologies...................................................................................................... 89|2.5 Related Technologies...................................................................................................... 89||2.5 Related Technologies...................................................................................................... 89|
|2.5.1 Technical Stack.......................................................................................................89||||
|2.6 Synthesis....................................................................................................................... 104|2.6 Synthesis....................................................................................................................... 104|||
|**Chapter 3.................................................................................................................................. 107**||||
|3.1 Development Methodology|3.1 Development Methodology|||
|3.1.1 The CRISP-DM Framework........................................................................................108||3.1.1 The CRISP-DM Framework........................................................................................108||
|3.1.2 Agile Integration and Sprint Mapping..........................................................................108||3.1.2 Agile Integration and Sprint Mapping..........................................................................108||
|3.2 Business Process...........................................................................................................111|3.2 Business Process...........................................................................................................111|||
|3.2.1 Comparison of Existing and Proposed Business Processes................................ 112||||
|||3.2.1.1 Process Maps||



2 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

||3.2.1.1.1 Existing Business Process/es............................................................. 113|3.2.1.1.1 Existing Business Process/es............................................................. 113|
|---|---|---|
||3.2.1.1.2 Proposed Business Process/es...........................................................116||
||3.2.1.2.1 Existing System/s................................................................................132||
||3.2.1.2.2 Proposed System................................................................................133||
|3.3 Business Solution|3.3 Business Solution||
|3.4 Project Risk and Feasibility Studies...............................................................................141|3.4 Project Risk and Feasibility Studies...............................................................................141||
|3.4.1 Risk Management.................................................................................................142|||
|3.4.2 Technological Feasibility....................................................................................... 146|||
|3.4.3 Organizational/Cultural Feasibility........................................................................ 147|||
|3.4.4 Economic Feasibility............................................................................................. 149|||
|3.5 Business Requirements Overview.................................................................................152|3.5 Business Requirements Overview.................................................................................152||
|3.5.1 Functional Requirements|||
|3.5.2 Non-Functional Requirements|||
|3.5.3 Mock-Ups..............................................................................................................158|||
|3.5.4 System Generated Forms and/or Reports............................................................200|||
|3.6 Data Gathering (With ETL)............................................................................................ 201|3.6 Data Gathering (With ETL)............................................................................................ 201||
|3.6.1 Data Extraction (Gathering).................................................................................. 207|||
|3.6.2 External Environmental Context APIs...................................................................209|||
|3.6.3 Data Transformation (Cleaning and Preprocessing).............................................211|||
||3.6.4 Data Loading and Near Real-Time Integration............................................... 212||
|3.7 Hybrid Database Architecture........................................................................................213|3.7 Hybrid Database Architecture........................................................................................213||
|3.8 Business Analytics Tools, Techniques, and Specific Applications................................. 216|3.8 Business Analytics Tools, Techniques, and Specific Applications................................. 216||
|3.8.1 Predictive Analytics Techniques............................................................................217|||
||3.8.1.1 Demand Forecasting....................................................................................218|3.8.1.1 Demand Forecasting....................................................................................218|
||3.8.1.2 Market Basket Analysis................................................................................218|3.8.1.2 Market Basket Analysis................................................................................218|
||3.8.1.3 Sentiment Analysis...................................................................................... 219|3.8.1.3 Sentiment Analysis...................................................................................... 219|
||3.8.1.4 Foot Traffic Prediction.................................................................................. 220|3.8.1.4 Foot Traffic Prediction.................................................................................. 220|
|3.8.2 Prescriptive Analytics Techniques.........................................................................220|||
||3.8.2.1 Promotion Recommendation....................................................................... 221|3.8.2.1 Promotion Recommendation....................................................................... 221|
||3.8.2.2 Product Bundling..........................................................................................221|3.8.2.2 Product Bundling..........................................................................................221|
||3.8.2.3 Inventory Optimization................................................................................. 222|3.8.2.3 Inventory Optimization................................................................................. 222|
||3.8.2.4 Staff Scheduling...........................................................................................222|3.8.2.4 Staff Scheduling...........................................................................................222|
|3.9.1 WOOF Demand & Foot Traffic Forecaster............................................................224|||
|3.9.2 Smart Bundle & Cross-Selling Engine.................................................................. 227|||
|3.9.3 "Happy Hour" Dynamic Promo Engine................................................................. 230|||
|3.9.4 Service Maximizer.................................................................................................232|||
|3.9.5 Customer Sentiment Radar.................................................................................. 234|||
|3.9.6 WOOF AI Chatbot.................................................................................................237|||
|3.9.7 Feedback Loop..................................................................................................... 241|||



3 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

3.9.8 Automated Smart Reports.................................................................................... 243 3.9.9 Cross-Channel Activation and Generative Campaign Copilot.............................. 245 3.10 Software Quality Assurance Plans.............................................................................. 250 3.10.1 Unit Test..............................................................................................................250 3.10.1.1 Unit Test Criteria........................................................................................ 250 3.10.1.2 Unit Test Scenario......................................................................................251 3.10.1.3 Unit Test Cases..........................................................................................253 3.10.2 Stress Test.......................................................................................................... 256 3.10.2.1 Stress Test Criteria.....................................................................................257 3.10.2.2 Stress Test Scenario..................................................................................258 3.10.2.3 Stress Test Cases...................................................................................... 258 3.10.3 User-Acceptance Test.........................................................................................259 3.10.3.1 User–Acceptance Test Criteria.................................................................. 260 3.10.3.2 User-Acceptance Test Scenario.................................................................261 3.10.3.3 User Acceptance Test Cases.....................................................................262 3.11 Operational Performance Evaluation........................................................................... 264 3.12.1 Deployment Environment....................................................................................268 3.12.2 Deployment Phases............................................................................................269 3.12.3 Owner Access and Administrative Control..........................................................271 3.12.4 Data Migration and Integration............................................................................272 3.12.5 Security and Data Privacy Measures..................................................................273 3.12.7 Maintenance and Monitoring...2763.2.1.1.2.4 WOOF Predictive Analytics Diagram 3.12.8 User Training and Turnover................................................................................ 277 3.12.9 Deployment Limitation........................................................................................ 277 **Bibliography.............................................................................................................................284** 

4 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **Chapter 1** 

## **1.1 Company Background** 

Happy Tails Pet Cafe is a two-branch Small and Medium Enterprise (SME) in the pet services and retail industry. While the business maintains its main branch at Noveleta, Cavite, this capstone is specifically localized to its second branch situated in Lucena City, Quezon Province, Philippines. The Lucena branch serves as a multi-line operation that mirrors the main branch’s business architecture, which integrates Food and Beverage (F&B), Professional Pet Services, and Specialty Retail. The branch is managed by an owner who oversees overall operations and is exclusively responsible for managing all e-commerce transactions. The local staff includes full-time and part-time baristas and cashiers who manage front-of-house duties and process all in-store transactions via the Point of Sale (POS) system. 

The technical infrastructure of the Lucena branch remains isolated from a centralized management layer, characterized by a fragmented stack of disconnected tools: 

## **Physical Storefront** 

On-site transactions for the cafe, service, and retail sectors are recorded through a standalone Point-of-Sale (POS) system. This system captures five years of sales data but operates locally, failing to share data in near real-time with the main branch or digital storefronts. 

5 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **E-Commerce Channels** 

The business manages an active online presence via TikTok Shop and Shopee. Order fulfillment is performed manually, where staff monitor separate Seller Center dashboards and cross-reference digital orders with physical stock levels. 

## **Internal Digital Platform: PetHub** 

In addition to its physical storefront and third-party e-commerce channels, Happy Tails Pet Cafe operates PetHub, a deployed internal digital platform that supports customer-facing functions such as pet service booking, retail product ordering, promotional announcements, and customer access to available services offered by the business. PetHub serves as one of the branch’s active digital touchpoints and contributes operational data related to bookings, online orders, campaign visibility, service demand, and customer-facing engagement. 

Within the context of this capstone study, PetHub is not treated as the primary analytics engine of the study. Instead, it functions as both a cross-channel data source and a customer-facing activation endpoint. PetHub-generated booking records, retail order records, customer-facing campaign interactions, and service-related data will be consolidated with POS, Shopee, and TikTok Shop data for analytics processing within WOOF. At the same time, approved WOOF-generated recommendations may be prepared and deployed through PetHub as announcement drafts, promotional content, bundle descriptions, and campaign materials after owner validation. 

6 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

This capstone project aims to develop Workflow Orchestration, Optimization, and Forecasting (WOOF) as a centralized cross-channel analytics and recommendation activation system that consolidates operational data from the physical POS system, e-commerce platforms, PetHub, and other relevant digital touchpoints. While PetHub serves as the customer-facing platform for bookings, ordering, and promotional visibility, WOOF will function as the analytical and decision-support layer that transforms fragmented business data into actionable insights. This system will support the branch’s transition from reactive, manual decision-making to a more data-driven operating environment through demand forecasting, association-rule cross-selling, inventory monitoring, review analysis, and owner-governed campaign deployment. 

## **1.2 Project Context** 

Happy Tails Pet Cafe operates across multiple service and product areas, including a physical cafe, pet services, retail operations, third-party e-commerce channels such as Shopee and TikTok Shop, and its deployed customer-facing platform, PetHub. Despite this multi-sector and multi-channel business model, the enterprise still manages and analyzes these channels separately. Sales records, service bookings, inventory movement, online orders, customer reviews, and PetHub campaign-related records are not yet consolidated into a centralized analytics environment. This results in fragmented cross-channel data, delayed reporting, inconsistent records, and limited operational visibility. As a result, management still relies heavily on manual tracking and intuition, making it difficult to respond promptly and accurately to changing business conditions. 

7 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Although PetHub provides Happy Tails Pet Cafe with a deployed platform for bookings, retail ordering, and promotional visibility, its data still requires integration with the branch’s other physical and digital channels. When PetHub records are viewed separately from POS transactions, Shopee orders, and TikTok Shop transactions, the business may still experience fragmented decision-making. This creates a cross-channel analytics gap, where the business has multiple active operational touchpoints but lacks a centralized system for analyzing how customer demand, service bookings, product purchases, inventory movement, customer feedback, and campaign responses interact across channels. 

A primary issue lies in the lack of integrated cross-channel data, where transactions and operational records from the physical store, e-commerce platforms, and PetHub are stored and monitored separately. This prevents the business from obtaining a unified view of operations and creates inefficiencies in monitoring sales performance, service demand, inventory levels, and campaign outcomes across channels. 

Another critical problem is the absence of analytical insights into customer purchasing behavior. The current setup does not allow the business to identify patterns such as which products and services are frequently purchased together across different channels. This limits the ability to implement effective cross-selling strategies and maximize revenue opportunities. In addition, the business experiences difficulty in anticipating customer demand and operational fluctuations. Without the use of forecasting techniques that incorporate historical data and external factors such as weather and seasonal trends, decisions regarding inventory stocking and staff allocation remain reactive, often resulting in overstocking, stock shortages, or inefficient resource utilization. 

8 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

The enterprise also lacks the capability to develop data-driven promotional strategies. Promotions are currently based on assumptions rather than analytical evidence, leading to inefficient use of marketing resources and missed opportunities to optimize sales during low-demand periods or to move slow-moving inventory. 

Another operational problem is the lack of a structured mechanism for converting analytics-based insights into owner-governed PetHub campaign actions. Even with PetHub already deployed as a customer-facing platform, promotional decisions may still require manual preparation, including announcement wording, bundle descriptions, campaign mechanics, and timing decisions. This creates a last-mile execution gap between analytical insight and customer-facing deployment. As a result, useful insights from demand forecasts, inventory alerts, customer sentiment, and cross-selling recommendations may be delayed, inconsistently translated into campaigns, or not activated through PetHub at all. 

Lastly, the current workflow involves manual reconciliation of sales and inventory records, which is time-consuming and prone to errors. The absence of a centralized analytical system makes it difficult to ensure data accuracy and evaluate whether operational improvements are being achieved over time. 

These challenges highlight the need for an integrated, analytics-driven framework that consolidates cross-channel operational data and applies business analytics techniques to generate actionable insights for improved decision-making, operational efficiency, and strategic growth. To address the gap between insight generation and business execution, WOOF will 

9 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

include a PetHub Recommendation Activation Layer that converts approved analytics recommendations into PetHub-ready campaign outputs. Through PetHub, WOOF-generated recommendations may be prepared, reviewed, approved, and deployed as announcement drafts, promotional content, bundle descriptions, and campaign materials for customer-facing visibility. However, final approval and publication will remain under the control of the business owner. 

## **1.3 Purpose and Objectives** 

This section establishes the fundamental goals of the capstone in response to the operational inefficiencies and fragmented data management currently faced by Happy Tails Pet Cafe across its physical storefront, e-commerce platforms, and deployed PetHub platform. The following objectives define the roadmap for designing, developing, and evaluating WOOF, a cross-channel analytics and recommendation activation system. By outlining both the primary aim and targeted technical milestones, this section defines how the project intends to consolidate multi-sector operational data, generate demand forecasts, identify association-rule cross-selling opportunities, and support owner-governed campaign deployment through PetHub. 

## **1.3.1 General Objectives** 

The primary purpose of this capstone is to develop WOOF, a centralized cross-channel analytics and recommendation activation system designed for Happy Tails Pet Cafe Lucena branch. The system aims to consolidate operational data from the physical POS system, Shopee, TikTok Shop, and the deployed PetHub platform in order to support demand forecasting, association-rule cross-selling, inventory and review analysis, and owner-governed campaign deployment. 

10 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Through WOOF, the business can transition from intuition-based and manually coordinated decision-making toward a centralized analytics workflow where insights can be generated, reviewed, and activated through PetHub. PetHub will serve both as a data source for bookings, orders, customer interactions, and campaign-related records, and as the customer-facing activation endpoint for owner-approved recommendations. WOOF will not replace PetHub’s booking or ordering functions; rather, it will strengthen PetHub’s business value by transforming its operational data, together with POS and e-commerce records, into actionable analytics and campaign-ready outputs. 

Furthermore, the proposed capstone project will align with selected United Nations Sustainable Development Goals (SDGs) through local and measurable system outcomes within the operational scope of Happy Tails Pet Cafe's Lucena branch. WOOF supports SDG 8 by aiming to reduce manual reconciliation and campaign preparation time through automated cross-channel data ingestion, allowing staff and management to reallocate labor hours away from repetitive administrative tasks. WOOF supports SDG 9 by providing a purpose-built Recommendation Activation System that consolidates fragmented physical and digital data (POS, e-commerce, inventory, and reviews) into an automated, analytics-ready infrastructure for SME operations. Most notably, WOOF supports SDG 12 by actively minimizing retail waste through its AI Spoilage Prevention Engine and demand forecasting models. By generating overstock risk alerts, detecting slow-moving items, triggering algorithmic markdown recommendations for at-risk perishables, and smart bundling recommendations, the system tangibly enforces responsible stock planning and prevents unnecessary inventory accumulation. These capabilities are not claimed as broad environmental impact measures; rather, they serve 

11 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

as localized, data-driven proxies for sustainable procurement and spoilage reduction at the branch level. The SDG alignment of this study is therefore strictly limited to measurable SME operational efficiency and does not claim direct national, sector-wide, or global SDG impact. 

## **1.3.2 Specific Objectives** 

To achieve the overall goal of the study, this section outlines the specific objectives that will guide the development and evaluation of the system. These specific objectives focus on integrating data across multiple channels, applying advanced analytical techniques, generating actionable insights, and supporting the activation of approved recommendations into customer-facing digital outputs to improve operational efficiency, customer understanding, and decision-making within Happy Tails Pet Cafe. 

- a. To develop a centralized data integration module during the system development phase that aggregates and normalizes daily multi-channel transactional records from the physical storefront, e-commerce networks, and external environmental sources, targeting a minimum 20% reduction in manual data reconciliation time. 

- b. To implement an association analysis component that processes historical transaction records across the different business sectors to discover cross-selling patterns and product-service bundles based on specified statistical significance thresholds. 

- c. To construct a predictive forecasting feature that projects weekly sales trends, foot traffic patterns, and booking volumes by analyzing historical enterprise data 

12 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

alongside external situational variables, verifying model performance against standard mathematical error indicators prior to full system deployment. 

- d. To design an automated recommendation engine that cross-references time-series projections with current stock records to identify low-demand operational periods and high-spoilage inventory liabilities, automatically generating optimization strategies for bundling, promotional timing, and markdown adjustments. 

- e. To integrate a customer feedback extraction function that collects and classifies textual reviews from online platforms, isolating specific operational issues and sentiment distributions to inform business quality control decisions. 

- f. To create an automated content generation layer that converts approved system recommendations into publication-ready operational announcements and marketing drafts, cutting campaign preparation time by at least 30% while enforcing absolute human-in-the-loop owner validation workflows before execution. 

- g. To evaluate the operational performance of the platform during user testing by benchmarking system metrics against manual business workflows to confirm the achievement of targeted improvements: a >= 20% reduction in data reconciliation time, a >= 95% level of inventory accuracy, and a >= 30% faster campaign creation timeline. 

13 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **1.4 Scope and Delimitations** 

This section defines the precise boundaries and operational parameters governing the development of the WOOF system. It details the specific data architectures, technological integrations, and analytical methodologies that constitute the project framework. Furthermore, it explicitly identifies the inherent geographical, technical, and operational constraints that restrict the extent of the study. Establishing these parameters ensures a comprehensive understanding of the capstone coverage while mitigating ambiguities regarding the final system deliverables intended for Happy Tails Pet Cafe. 

## **1.4.1 Scope** 

## **a. Data Scope** 

The system will utilize five years of longitudinal transactional data from Happy Tails Pet Cafe Lucena branch, supplemented by data streams from e-commerce platforms and the deployed PetHub platform. The data scope includes POS transactions, Shopee and TikTok Shop orders, PetHub booking records, PetHub retail order records, inventory movement, customer reviews, campaign-related records, and relevant external contextual data such as weather and holidays. 

## **b. Cross-Channel Integration** 

A live-ready connection using webhooks, APIs, CSV uploads, and ETL processes will synchronize physical and digital sales channels through a two-layer data architecture. MongoDB will serve as the staging layer for raw and semi-structured records from the physical POS 

14 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

system, Shopee, TikTok Shop, PetHub, customer reviews, weather, and holiday sources. After ingestion, the ETL process will clean, validate, standardize, and transform these records into a PostgreSQL analytical warehouse for unified monitoring, analysis, and decision-support. PetHub will contribute booking, ordering, customer interaction, and campaign-related records that can strengthen demand forecasting, cross-selling analysis, and campaign effectiveness evaluation. 

## **c. Context-Aware Analysis** 

To provide actionable insights into demand fluctuations, the system integrates external APIs that capture environmental and calendar events. It employs Meta’s Prophet and SARIMAX as its primary time-series forecasting engines. This dual-model approach is utilized because Prophet can handle seasonal and irregular retail data patterns, while SARIMAX supports the inclusion of exogenous variables such as holidays, weather disruptions, and seasonal shifts. These models will analyze POS, e-commerce, and PetHub data to generate context-aware predictions for demand, sales movement, service bookings, and foot traffic. 

## **d. Hybrid Data Integration Strategy** 

The WOOF system will use a dual-method approach for data ingestion and a two-layer approach for data storage and analytics. To establish the baseline for the machine learning models, historical sales and operational data will be integrated through standard CSV uploads. Concurrently, the system will utilize live-ready connections using webhooks and APIs to capture near-real-time operational data from TikTok Shop, Shopee, PetHub, and other relevant digital sources for ongoing decision-support. Raw and semi-structured records from these sources will first be stored in MongoDB staging collections for audit, traceability, and possible reprocessing. 

15 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Afterward, ETL procedures will clean, validate, standardize, and map the records into the PostgreSQL star schema warehouse, which will serve as the primary source for dashboard reporting, forecasting, FP-Growth analysis, sentiment summaries, campaign evaluation, and controlled NL2SQL chatbot queries. 

## **e. Quality & Inventory Gatekeeping** 

A prescriptive module will utilize NLP Sentiment Analysis for customer reviews from e-commerce platforms and PetHub, along with predictive alerts for product spoilage, slow-moving items, and inventory risk. These alerts will drive prescriptive actions, including smart bundling recommendations with frequently bought items and algorithmic markdown adjustments, to support inventory monitoring, product quality control, service improvement, and operational reputation management. 

## **f. Intelligence Dashboard** 

A visual interface will feature a React-based Intelligence Dashboard with a controlled AI chatbot to explain data trends, support approved analytics queries, record owner feedback, and support continuous system refinement. The dashboard will retrieve validated analytical outputs from the PostgreSQL warehouse and present cross-channel insights from POS, Shopee, TikTok Shop, and PetHub, including demand forecasts, inventory alerts, cross-selling recommendations, customer sentiment insights, and PetHub campaign activation records. 

## **g. PetHub Recommendation Activation Layer** 

The system will include a PetHub Recommendation Activation Layer that translates approved analytics recommendations into customer-facing outputs intended for the deployed 

16 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

PetHub platform. This includes generating PetHub-ready announcement drafts, promotional content, bundle descriptions, and campaign materials based on WOOF-generated insights such as demand forecasts, service booking trends, slow-moving inventory alerts, which specifically drive smart bundling and markdown recommendations, customer sentiment insights, and cross-selling recommendations. 

Within the scope of this capstone, the activation layer will demonstrate the preparation, editing, owner review, approval, rejection, publication preparation, and logging of PetHub-ready campaign outputs. PetHub will serve as both a cross-channel data source and a customer-facing activation endpoint. However, WOOF will not autonomously publish, modify prices, update product listings, or execute campaigns without owner approval. 

## **h. Mobile Operations Interface** 

The system will include a mobile component utilizing Expo and React Native to ensure cross-platform adaptability and quick-access for the Cafe Owner, the sole user of the WOOF Dashboard. This mobile deployment will serve as a responsive portal for reviewing near real-time analytics, alerts, and owner-reviewable recommendations on mobile devices. 

## **i. Data Privacy and Security Compliance** 

The WOOF system will strictly comply with the Data Privacy Act of 2012 (RA 10173) through a Privacy by Design approach. For model training, the proponents will utilize a pre-anonymized historical dataset provided directly by Happy Tails management. This dataset will exclude Personally Identifiable Information (PII), such as customer names, addresses, contact numbers, and payment details, retaining only operational metrics such as transaction 

17 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

IDs, booking IDs, SKUs, service categories, timestamps, quantities, and campaign interaction indicators. Furthermore, live webhook and API integrations from e-commerce platforms and PetHub will be programmed to securely parse only relevant operational and transactional data needed for analytics, while bypassing sensitive consumer profiles to ensure continuous data privacy without compromising business intelligence operations. 

## **1.4.2 Delimitations** 

## **a. Geographic and Branch-Specific Data Limit** 

The system will be customized specifically for the Happy Tails Pet Cafe branch in Lucena City and may not be directly applicable to other branches or locations. Although Happy Tails also maintains a main branch in Noveleta, Cavite, the operational data, physical POS records, PetHub records, and e-commerce data to be used in this study will be limited to the Lucena branch and its corresponding online transactions. Any Shopee, TikTok Shop, PetHub, or other e-commerce records included in the system will only be considered if they are directly associated with or attributable to the Lucena branch operations. 

## **b. Non-Automated PetHub Implementation and Owner Approval** 

Although WOOF can generate recommendations and prepare PetHub-ready campaign materials, it will not autonomously publish promotions, update prices, modify product listings, alter booking schedules, or execute campaigns without owner approval. Any activation through PetHub will require human review and approval. The system is designed as a decision-support and campaign-preparation tool, not as a fully autonomous marketing, pricing, or publishing platform. 

18 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **c. PetHub Integration Boundary** 

Although PetHub is a deployed customer-facing platform and data source, WOOF will not replace PetHub’s core booking, ordering, account management, or customer-facing transaction functions. WOOF will only consume relevant PetHub operational data for analytics and prepare owner-approved campaign outputs for PetHub activation. The study will evaluate WOOF based on its ability to integrate PetHub data, generate recommendations, prepare campaign materials, support owner-governed approval, and log activation outcomes, not on the development or full standalone evaluation of PetHub as a separate system. 

## **d. Model Scope** 

The forecasting model scope is centered on the evaluation and implementation of Prophet and SARIMAX as the primary demand, sales movement, service booking, and foot traffic forecasting engines. Other analytical and optimization techniques, including FP-Growth, VADER, LDA Topic Modeling, Queueing Theory, Linear Programming, Economic Order Quantity, ADWIN, NL2SQL, and the AI Assistant, will be implemented as module-specific methods within WOOF. These models and techniques will support cross-selling analysis, sentiment analysis, service optimization, inventory planning, model monitoring, natural language querying, and decision-support interaction. The study will evaluate each model or method based on its intended module-level function rather than treating all models as general-purpose forecasting engines. 

## **e. Internet Connectivity and Uptime Dependency** 

The WOOF system’s cross-channel capabilities will rely heavily on continuous and stable internet connectivity to function optimally. Because the architecture will utilize live 

19 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

webhooks and APIs for e-commerce synchronization, PetHub data intake, and external contextual data retrieval, any network outage or ISP throttling at the Lucena branch may temporarily delay near real-time data ingestion. During offline periods, the system may not be able to fetch live third-party data, meaning dashboard updates and predictive model feeds may be delayed until network connectivity is restored. To reduce operational disruption, the system may support fallback mechanisms such as CSV ingestion, queued synchronization, local caching, and delayed data processing once connectivity resumes. 

## **1.5 Conceptual Framework** 

_Figure 1.5.1 Input-Process-Output (IPO) model_ 

Figure 1.5.1 illustrates the conceptual framework of the study using the Input-Process-Output (IPO) model. The Input phase consists of the operational and contextual data sources needed by WOOF, including five years of POS transaction data, e-commerce customer reviews and feedback data, Shopee and TikTok Shop e-commerce data, external API 

20 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

data from OpenWeatherMap and Abstract Public Holidays, and PetHub booking, retail order, and customer interaction data. These inputs represent the cross-channel data environment of Happy Tails Pet Cafe, where physical store transactions, online orders, customer feedback, PetHub records, and external demand factors are consolidated for analytics processing. 

During the Process phase, the collected data will undergo an ETL process to clean, validate, standardize, and prepare the records for analysis. After ETL processing, the data will be used by the Data Analytics and Modeling component, which is organized into descriptive, predictive, and prescriptive analysis. The descriptive analysis layer will support cross-channel data aggregation, historical performance tracking, sentiment tracking, and natural language query processing. The predictive analysis layer will generate demand and foot traffic forecasts, identify customer behavior patterns, and monitor system performance or drift. The prescriptive analysis layer will translate analytical outputs into inventory and staffing optimization insights, marketing recommendation triggers for promos and bundles, and owner-reviewable business recommendations. 

The lower part of the process phase represents the Activation Layer, which includes the Campaign Copilot, Approval Gate, and PetHub Activation Preparation. This layer converts approved recommendations into PetHub-ready campaign materials such as announcement drafts, promotional content, and bundle campaign outputs. Although the system can prepare and route approved materials for PetHub, the business owner remains responsible for reviewing and approving recommendations before publication or execution. 

21 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

The Output phase presents the expected system deliverables of WOOF. These include a Cross-Channel Intelligence Web and Mobile Dashboard, an AI assistant for strategy prompts and campaign drafts, prescriptive strategic alerts related to sentiment, restocking, and staff utilization, and approved promotions and bundle campaigns prepared for PetHub deployment. Through this IPO structure, WOOF is positioned as a human-governed cross-channel analytics and recommendation activation system that transforms fragmented operational data into owner-reviewed insights and campaign-ready outputs for Happy Tails Pet Cafe. 

22 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **1.6 Project Milestones and Timeline** 

_Figure 1.6.1 Project Timeline_ 

Figure 1.6.1 illustrates the year-long implementation roadmap of the WOOF system, beginning with Research and Planning in early 2026 to secure client requirements and data 

23 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

feasibility. The project will transition into Documentation and System Design to establish the architectural foundations, followed by a rigorous Development phase from June through October where the core analytics engines and sprints will be executed. Lastly, the timeline will conclude with Final Documentation and Defense to validate the system's performance and operational impact. 

_Figure 1.6.2 Work Breakdown Structure_ 

Figure 1.6.2 illustrates the structural roadmap and developmental phases of the project. It is systematically divided into six core phases to ensure a seamless transition from data collection to a fully integrated decision-support deployment. 

24 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **1.7  Definition of Terms** 

## **AI Chatbot** 

A system feature that allows the owner to ask business-related questions in natural language. In WOOF, the AI chatbot will not directly access raw data. It will use controlled query rules and approved PostgreSQL warehouse views to answer business questions safely. 

## **Association Rule Mining** 

A data mining technique used to discover relationships between items that are often purchased or selected together. In WOOF, association rule mining is used to identify product and service combinations that can support cross-selling strategies. 

## **Behavioral Bridges** 

Patterns that connect customer behavior across different business sectors or channels. In this study, behavioral bridges refer to discovering relationships between cafe purchases, grooming services, retail products, and online orders. 

## **Business Intelligence (BI)** 

The strategies and technologies used by enterprises for the data analysis of business information. Operationally, it refers to the WOOF system's dashboard that visualizes sales trends, inventory levels, and operational metrics for Happy Tails Pet Cafe. 

## **Confidence** 

25 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

A measurement that shows how likely one item is purchased when another item is also purchased. In this study, confidence helps determine whether a customer who buys one product or service is likely to buy another related item. 

## **Context-Aware Forecasting** 

A forecasting approach that considers both historical data and outside factors that may affect demand. In this study, WOOF uses weather, seasons, and holidays to make more realistic predictions for cafe sales, grooming services, and retail demand. 

## **Cross-Channel** 

A business and analytics approach that utilizes multiple independent digital and physical platforms to interact with customers and process transactions. Operationally, within the context of this study, it refers to the WOOF system's capability to extract, consolidate, and analyze data from Happy Tails Pet Cafe's distinct touchpoints (Loyverse POS, Shopee, TikTok Shop, and PetHub) into a single centralized pipeline. This integration allows the system to evaluate the enterprise's performance comprehensively, enabling holistic demand forecasting, inventory tracking, and data-driven recommendations derived from the total scope of the business's physical and online operations. 

## **Cross-selling** 

A sales technique used to get a customer to spend more by purchasing a product that is related to what is already being bought. Operationally, it is the primary goal of the WOOF system's Market Basket Analysis, allowing Happy Tails to offer targeted product and service bundles. 

26 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **Data Ingestion** 

The process of collecting and importing data from different systems into a central platform. In this study, data ingestion refers to how WOOF receives historical CSV files, webhook events, POS records, e-commerce orders, and external API data. 

## **Data Mart** 

A smaller and more focused section of a data warehouse that stores data for a specific business area. In this study, data marts may be used to separate information for cafe sales, retail products, grooming services, inventory, and customer feedback. 

## **Data Silo** 

A data silo refers to a situation where information is stored separately in different systems and cannot easily be accessed or shared with other systems. In this study, data silos refer to the disconnected records from the physical POS system, Shopee, TikTok Shop, inventory records, and service bookings of Happy Tails Pet Cafe. 

## **Data Warehouse** 

A centralized storage system that collects, organizes, and stores data from different sources for reporting and analysis. In the WOOF system, the data warehouse will serve as the unified storage for POS transactions, e-commerce sales, inventory records, customer reviews, and external data such as weather and holidays. 

## **Decision-Support System (DSS)** 

27 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

An automated information system that assists in business decision-making activities. In the context of this study, it is the core module of WOOF that analyzes historical and external data to recommend strategic actions. 

## **Demand Forecasting** 

The process of estimating future customer demand for products or services. In this study, WOOF uses demand forecasting to help Happy Tails prepare enough inventory, staff, and promotional strategies for expected customer activity. 

## **Exogenous Variables** 

External factors added to a forecasting model to improve prediction accuracy. In this study, exogenous variables include weather data, holiday schedules, and seasonal indicators that may influence sales or customer visits. 

## **Foot Traffic** 

In retail, it refers to the number of customers who enter a physical store or location within a specific period. Operationally, it pertains to the actual volume of customers visiting the physical branch of Happy Tails Pet Cafe. The WOOF system utilizes external data, to forecast fluctuations in foot traffic and subsequently recommend strategic promotional campaigns. 

## **FP-Growth (Frequent Pattern Growth) Algorithm** 

A highly efficient data mining technique used to find frequent patterns without candidate generation. Operationally, this algorithm powers the system's Market Basket Analysis to identify 

28 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

which pet services and retail items are frequently purchased together, enabling precision-based product bundling. 

## **Lift** 

A measurement that shows whether the relationship between two items is stronger than random chance. In WOOF, lift helps identify meaningful product and service pairings for promotional bundles. 

## **Market Basket Analysis (MBA)** 

A data mining technique used by retailers to increase sales by better understanding customer purchasing patterns. In this project, it is used to analyze transactional data from Happy Tails Pet Cafe to discover cross-selling opportunities across their multi-line operations. 

## **Mean Absolute Percentage Error (MAPE)** 

A forecasting accuracy metric that shows the average percentage difference between predicted values and actual values. In this study, MAPE is used to assess how close the system’s demand forecasts are to actual business outcomes. 

## **Natural Language Processing (NLP)** 

A branch of artificial intelligence that gives computers the ability to understand text and spoken words. In this system, NLP is applied to process unstructured textual data from online customer reviews. 

## **Prophet** 

29 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

A time-series forecasting model designed to handle seasonal patterns, missing data, and irregular trends. In the WOOF system, Prophet is used to forecast business demand and identify expected changes in sales, foot traffic, and service activity. 

## **Root Mean Square Error (RMSE)** 

A forecasting accuracy metric that measures the size of prediction errors. In WOOF, RMSE helps evaluate whether the forecasting model produces large or small deviations from actual demand. 

## **SARIMAX** 

A statistical forecasting model that predicts future values based on past patterns, seasonality, and external variables. In this study, SARIMAX helps WOOF forecast demand while considering factors such as weather, holidays, and seasonal changes. 

## **Sentiment Analysis** 

The computational study of opinions, sentiments, and emotions expressed in text. Within the WOOF system, it is the mechanism used to evaluate the emotional polarity (positive, negative, or neutral) of customer feedback, which in turn guides the management in making inventory quality control decisions. 

## **Small and Medium Enterprise (SME)** 

Refers to an independent business entity characterized by specific thresholds in asset size and employee count. In the context of this study, it represents Happy Tails Pet Cafe, a growing business operating multiple service lines whose increasing operational complexity and 

30 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

fragmented data management necessitate a centralized business intelligence and decision-support system. 

## **Support** 

A measurement that shows how often a product or service combination appears in the dataset. In the WOOF system, support helps determine whether a product bundle is common enough to be considered useful for promotion. 

## **Term Frequency-Inverse Document Frequency (TF-IDF)** 

A text analysis technique that identifies important words by measuring how often they appear in one document compared to all documents. In WOOF, TF-IDF helps identify meaningful keywords in customer reviews, such as complaints about delays, damaged items, or product quality. 

## **Time-Series Forecasting** 

A method of predicting future values based on data collected over time. In WOOF, time-series forecasting is used to estimate future product demand, service occupancy, foot traffic, and possible sales trends. 

## **Webhooks** 

An automated method for one web application to send near real-time data to another application whenever a specific event occurs. Operationally, the WOOF system uses webhooks to instantly update inventory levels and synchronize data between the physical Point-of-Sale (POS) system and the e-commerce platform the moment a sale happens. 

31 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **WebSockets** 

A communication protocol that keeps a continuous connection between the server and the user interface. In WOOF, WebSockets allow the dashboard and mobile application to receive live updates without repeatedly refreshing the page. 

## **Chapter 2** 

## **2.1 Review of Related Literature** 

## **2.1.1 Data-Driven Strategies for SME** 

## **The Foundational Role of Descriptive Analytics** 

Descriptive analytics serves as the foundational layer of business analytics because it transforms raw operational records into structured information that can explain current and historical business performance. For small and medium enterprises, this is especially important because many operational decisions are still influenced by manual monitoring, fragmented records, and owner intuition. Zamani, Griva, and Conboy (2022) emphasized that descriptive analytics can help SMEs understand their existing operations and adapt their business models under changing market and economic conditions. 

However, descriptive analytics has an important limitation. It mainly answers what has already happened, but it does not independently explain what is likely to happen next, what action should be taken, or how insights should be translated into operational execution. A dashboard may show high-demand periods, slow-moving products, or frequently booked services, but it does not automatically forecast demand, discover cross-selling relationships, recommend campaign actions, or prepare customer-facing 

32 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

materials. Therefore, descriptive analytics is necessary for WOOF, but it is not sufficient as the complete solution. 

In the context of Happy Tails Pet Cafe, descriptive analytics is needed because the business operates across several sectors and channels, including cafe sales, retail products, grooming services, Shopee, TikTok Shop, and PetHub. These sources generate separate records for sales, bookings, orders, inventory movement, reviews, and campaign-related activity. Without descriptive analytics, these records remain fragmented and difficult to interpret. Through WOOF, descriptive analytics will consolidate these records into cross-channel summaries that allow the owner to monitor sales trends, service demand, inventory movement, customer feedback, and campaign activity from a centralized dashboard. 

The gap addressed by WOOF is that Happy Tails does not only need visibility over past performance. It needs a system that uses descriptive analytics as the first layer of a wider decision-support workflow. In WOOF, descriptive analytics provides the structured foundation for later predictive forecasting, association-rule cross-selling, sentiment analysis, inventory recommendations, and owner-governed PetHub campaign activation. This positions descriptive analytics not as the final output of the system, but as the base layer that prepares fragmented operational records for deeper business analytics. 

## **2.1.2 Cross-Channel Data Integration and Channel Coordination** 

**Organizational Factors in Multi-Modal Data Adoption** 

33 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

In a business environment where data comes from multiple sources, successful analytics adoption depends not only on technology but also on organizational readiness, data quality, workflow design, and managerial use of information. Alsulami, Hamid, and Ghani (2024) highlighted that organizational factors influence how SMEs adopt and benefit from data analytics. This means that an analytics system should not only be technically capable; it must also fit the actual decision-making process, data practices, and operational capacity of the business. 

This is important because SMEs may adopt digital tools without necessarily becoming data-driven. A business may have a POS system, e-commerce stores, booking platforms, and digital customer interactions, but these systems may still operate separately. When records are not standardized, cleaned, and connected, the business still depends on manual checking and fragmented reports. Therefore, the challenge is not only whether Happy Tails has digital records, but whether those records can be transformed into analytics-ready information. 

For Happy Tails Pet Cafe, the business does not only need advanced models. It also needs a practical workflow for collecting, cleaning, standardizing, and interpreting data from different operational sources. POS records, Shopee transactions, TikTok Shop orders, PetHub bookings, PetHub retail orders, customer reviews, inventory records, and campaign logs may follow different formats, update cycles, and data structures. If these differences are not addressed, the accuracy of dashboards, forecasts, recommendations, and campaign outputs may be affected. 

34 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

WOOF addresses this issue through data ingestion, ETL processes, and cross-channel standardization. These processes allow fragmented records to be converted into an analytics-ready environment. This is the specific gap WOOF fills: it does not simply collect data from multiple platforms; it organizes and prepares the data so it can support descriptive analytics, demand forecasting, association-rule recommendations, sentiment analysis, inventory monitoring, and owner-governed campaign activation. 

## **Cross-Channel Data Integration for Analytics Readiness** 

The challenge of data fragmentation occurs when physical storefront operations, e-commerce platforms, and internal digital platforms produce separate records that are not consolidated for analysis. For SMEs, this can result in delayed reporting, manual reconciliation, inconsistent inventory visibility, and limited understanding of customer demand across channels. Alsulami, Hamid, and Ghani (2024) emphasized that SME analytics adoption depends on organizational readiness, data quality, and the effective use of information across business processes. Similarly, Bacasmas, Carlos, and Katigbak (2022) highlighted that e-commerce adoption among Philippine MSMEs can support business performance through wider customer reach, sales growth, customer satisfaction, and process improvement. 

However, e-commerce adoption alone does not guarantee analytics maturity. A business may sell through Shopee, TikTok Shop, and an internal platform such as PetHub, but if the data remains separated from physical POS and inventory records, the owner still cannot easily see the complete business picture. In this case, digitalization 

35 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

improves transaction reach, but not necessarily decision quality. This distinction is important because WOOF is not merely responding to the presence of multiple channels. It is responding to the absence of a consolidated, analytics-ready environment across those channels. 

In the context of Happy Tails Pet Cafe, the physical POS system, Shopee, TikTok Shop, and PetHub generate separate records for sales, bookings, orders, customer feedback, campaign activity, and inventory movement. These records are useful individually, but their value is limited if they are analyzed separately. For example, Shopee sales may show product demand online, while POS sales may show in-store purchase behavior. PetHub bookings may show service demand, while reviews may reveal customer concerns. Without integration, these records cannot fully support cross-channel decision-making. 

WOOF addresses this gap by consolidating operational data from the physical POS system, Shopee, TikTok Shop, and PetHub into an analytics-ready environment. This allows the system to support descriptive dashboards, demand forecasting, association-rule cross-selling, sentiment analysis, inventory monitoring, and owner-governed campaign activation. Therefore, the purpose of cross-channel integration in WOOF is not only to combine records, but to make those records usable for business analytics and decision support. 

## **Local Context of E-Commerce Adoption among Philippine MSMEs** 

In the Philippine context, e-commerce adoption has become increasingly relevant for micro, small, and medium enterprises because digital platforms allow businesses to 

36 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

extend their market reach, maintain customer engagement, and participate in online selling environments. Bacasmas, Carlos, and Katigbak (2022), in a Philippine Institute for Development Studies report on women-led MSMEs in Metro Manila, discussed how e-commerce adoption can influence MSME performance by supporting participation in digital trade and online business activity. 

However, the Philippine MSME context also shows a gap between platform adoption and data utilization. While e-commerce platforms can help businesses sell online, they do not automatically provide integrated business intelligence across physical and digital operations. SMEs may still struggle with separated transaction records, manual reconciliation, inconsistent inventory visibility, and limited analytical use of customer behavior data. This means that the benefit of e-commerce depends not only on being present in digital channels, but also on the ability to use the data generated by those channels. 

This local context is relevant to Happy Tails Pet Cafe because the business operates through both physical and digital channels, including its POS system, Shopee, TikTok Shop, and PetHub. These platforms support different aspects of the business, such as in-store sales, online orders, bookings, customer engagement, and campaign visibility. However, if their data remains fragmented, the owner may still rely on separate reports and intuition rather than consolidated analytics. 

Therefore, WOOF addresses a local SME data gap. It transforms separate physical, e-commerce, and PetHub records into a cross-channel analytics environment 

37 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

for descriptive analytics, demand forecasting, association-rule cross-selling, sentiment analysis, and owner-governed campaign activation. In this way, WOOF does not simply support e-commerce participation. It supports the more advanced requirement of using e-commerce and physical store data together for business decision-making. 

## **2.1.3 Business Intelligence and Decision Support Systems** 

## **Prescriptive Analytics as a Human-Governed Decision Artifact** 

Prescriptive analytics represents a more advanced stage of business analytics because it moves beyond describing past events and predicting future outcomes toward recommending possible actions. Wissuchek and Zschech (2024) explained that prescriptive analytics systems can be understood as socio-technical decision artifacts because they combine computational models with human decision-making. This means that prescriptive systems are not only technical tools. They are also part of a decision environment where human judgment, business rules, and organizational context remain important. 

This distinction is important because prescriptive analytics can be misunderstood as automatic decision-making. In an SME setting, this would be risky because recommendations may be affected by incomplete data, changing customer behavior, inventory limitations, pricing constraints, staffing capacity, and the owner’s brand judgment. A system may suggest a promotion or bundle, but the owner still needs to decide whether the recommendation is realistic, profitable, timely, and aligned with the business. 

38 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

In WOOF, prescriptive analytics is therefore treated as decision support rather than decision replacement. The system generates owner-reviewable recommendations based on descriptive insights, forecasting outputs, customer behavior patterns, inventory movement, customer feedback, and service activity. These recommendations may include cross-selling bundles, restocking prompts, slow-moving item campaigns, promotional timing suggestions, service-related prompts, and PetHub-ready campaign materials. 

The gap addressed by WOOF is the movement from passive insight to actionable but human-governed recommendation. Instead of leaving the owner with charts that still require manual interpretation, WOOF helps translate analytics outputs into suggested actions. However, final control remains with the owner, who may review, revise, approve, or reject each recommendation before execution. This ensures that WOOF remains a decision-support system and not an autonomous decision-maker. 

## **Business Intelligence for Centralized Operational Visibility** 

Business Intelligence systems support decision-making by transforming operational data into dashboards, reports, and structured insights that allow managers to interpret business performance more effectively. For small and medium enterprises, this is important because business decisions are often affected by fragmented records, delayed reporting, and limited analytical capacity. Zamani, Griva, and Conboy (2022) emphasized that descriptive analytics can help SMEs understand their existing operations and adapt their business models under 

39 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

changing conditions. Similarly, Alsulami, Hamid, and Ghani (2024) highlighted that the effective use of data analytics in SMEs depends on organizational factors such as data readiness, information use, and the ability to integrate analytics into business processes. 

However, Business Intelligence alone may still result in passive decision support if the system only presents charts and reports. A dashboard may show sales performance, service demand, inventory movement, or customer feedback, but it does not necessarily explain what should be done next. This limitation is important in the case of Happy Tails Pet Cafe because the owner does not only need to view data. The owner also needs help identifying possible operational and promotional actions from that data. 

In the context of Happy Tails Pet Cafe, the BI component of WOOF is represented by the centralized intelligence dashboard. This dashboard consolidates cross-channel records from the physical POS system, Shopee, TikTok Shop, and PetHub to provide visibility over sales movement, service booking trends, inventory status, customer feedback, campaign activity, and generated recommendations. Instead of requiring the owner to manually check separate systems, the dashboard organizes operational data into a more accessible and analytics-ready view. 

WOOF extends traditional BI by connecting dashboard visibility to predictive and prescriptive functions. Forecasting models help anticipate demand and foot traffic, association-rule mining helps identify cross-selling opportunities, 

40 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

sentiment analysis helps identify recurring customer feedback themes, and the recommendation activation layer helps convert selected insights into owner-reviewable PetHub campaign drafts. Therefore, WOOF is not positioned as a dashboard-only system. It is positioned as an integrated decision-support workflow that begins with BI visibility but extends toward analytics-driven recommendations and controlled activation. 

## **Cross-Channel Recommendation Activation and Human-Governed Campaign Support** 

The addition of a recommendation activation layer extends the role of business analytics from insight generation to decision execution support. The Department of Trade and Industry (2022) emphasized the importance of strengthening e-commerce participation and digital commerce readiness in the Philippines, particularly for businesses engaging in online selling and digital market activity. For SMEs such as Happy Tails Pet Cafe, this supports the need to use digital platforms not only as selling channels but also as sources of operational data and customer-facing campaign activity. 

However, many analytics systems stop at reporting or recommendation generation. This creates a last-mile gap where insights are produced but not translated into usable customer-facing outputs. For an SME owner, a dashboard recommendation such as “promote slow-moving items” or “bundle product A with service B” may still require manual work, including deciding the wording, preparing 

41 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

campaign materials, and checking whether the promotion fits the brand and current operations. This gap limits the practical value of analytics because the insight still depends heavily on manual execution. 

In WOOF, recommendation activation refers to the process of converting analytics-generated insights into owner-reviewable campaign outputs. Since PetHub is treated as a deployed customer-facing platform, it serves as both a data source and an activation endpoint. PetHub contributes booking records, retail order records, customer-facing activity, and campaign interaction data that can strengthen WOOF’s analytics process. At the same time, WOOF can translate approved recommendations into PetHub-ready announcements, promotional content, bundle descriptions, and campaign materials. 

The critical limitation is that WOOF does not autonomously publish promotions, modify prices, update listings, apply discounts, or execute campaigns. Its role is to assist in preparing campaign outputs based on analytics recommendations. The owner remains responsible for reviewing, revising, approving, or rejecting the prepared materials before they are released through PetHub. This ensures that recommendation activation supports business decision-making without removing owner control over pricing, branding, campaign timing, and operational readiness. 

## **Generative AI Support for Campaign Preparation** 

Generative artificial intelligence can support marketing and campaign preparation by helping create promotional wording, product descriptions, 

42 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

campaign ideas, and customer-facing communication materials. Kshetri et al. (2024) discussed how generative AI can assist marketing activities by supporting the creation of marketing content and sales-related communication outputs. This is relevant to WOOF because the system includes an AI-assisted component that can help transform analytics recommendations into PetHub-ready campaign drafts. 

However, generative AI also presents limitations that must be considered in a business analytics system. AI-generated text may contain unclear wording, inaccurate promotional claims, inappropriate tone, or suggestions that do not fully match the business context. It may also create campaign language that sounds persuasive but does not consider actual inventory availability, pricing constraints, service capacity, or brand positioning. Therefore, generative AI should not be treated as an autonomous campaign strategist or final decision-maker. 

In WOOF, the role of generative AI is limited to campaign draft preparation. The system may assist in preparing announcement drafts, promotional captions, bundle descriptions, and PetHub-ready campaign text based on demand forecasts, slow-moving inventory alerts, customer feedback patterns, and association-rule cross-selling recommendations. This can reduce the manual effort required to prepare campaign content and help the owner translate analytical insights into customer-facing materials more efficiently. 

The gap addressed by WOOF is the controlled use of generative AI in an SME analytics workflow. WOOF does not allow AI to decide which promotion 

43 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

should be implemented, publish announcements, apply discounts, modify prices, update product listings, or execute campaigns. All AI-generated outputs remain in draft form until reviewed, revised, and approved by the business owner. This limitation ensures that generative AI supports campaign preparation without replacing managerial judgment, pricing authority, brand control, or operational decision-making. 

## **Privacy, Accountability, and Human Oversight in AI-Assisted Analytics** 

The use of analytics and AI-assisted recommendation systems requires privacy safeguards, transparency, accountability, and human oversight. The National Privacy Commission (2024) emphasized the importance of lawful processing, transparency, data protection safeguards, and accountability when personal data is involved in the development or deployment of AI systems. Similarly, Tabassi (2023), through the National Institute of Standards and Technology AI Risk Management Framework, discussed the importance of managing AI-related risks and promoting trustworthy and responsible AI systems. 

This is important because analytics systems can create value from business data, but they can also create risks if data is collected excessively, processed without safeguards, or used to make automated actions without human review. In WOOF, these risks may arise from the use of POS records, Shopee transactions, TikTok Shop orders, PetHub bookings, customer reviews, and campaign interaction logs. Even if the system focuses on operational and 

44 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

transactional data rather than unnecessary personally identifiable information, privacy and accountability remain necessary. 

WOOF addresses this through data minimization, anonymization or exclusion of sensitive customer information, role-based access, audit logs, and owner approval for recommendation activation. These safeguards ensure that the system uses only the data needed for analytics and limits access based on user roles. They also help maintain accountability when recommendations, forecasts, and campaign drafts are generated. 

Human oversight is especially important in WOOF’s recommendation activation process. System-generated recommendations and PetHub-ready campaign materials must remain subject to owner approval before publication, price changes, listing updates, or campaign execution. This protects the business from unauthorized automated actions and ensures that analytics outputs are used as decision-support rather than final decisions. Through this approach, WOOF maintains a balance between automation, business analytics, privacy protection, and managerial control. 

## **Synthesis of Related Literature** 

The reviewed literature establishes the need for an analytics system that can support SME decision-making, but it also shows that no single analytical approach is sufficient to address the operational condition of Happy Tails Pet Cafe. Descriptive analytics is useful for transforming raw operational records into structured summaries, especially for SMEs that rely on manual monitoring and 

45 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

fragmented records. However, descriptive analytics is limited because it mainly explains what has already happened. On its own, it does not forecast future demand, identify product-service relationships, recommend actions, or support campaign execution. This limitation justifies WOOF’s use of descriptive analytics only as the foundational layer of the system. 

The literature on cross-channel data integration further supports the need to consolidate business records from different operational sources. Philippine MSMEs increasingly participate in e-commerce, but the value of digital selling platforms becomes limited when their data remains separated from physical store records. In the case of Happy Tails Pet Cafe, the physical POS system, Shopee, TikTok Shop, and PetHub each produce different records related to sales, bookings, orders, customer feedback, inventory movement, and campaign interaction. A basic e-commerce presence does not automatically create business intelligence. Therefore, the gap addressed by WOOF is not merely the existence of digital channels, but the absence of an analytics-ready environment that connects these channels for decision support. 

The reviewed literature on Business Intelligence and prescriptive analytics also shows that dashboards and reports are not enough when the business still depends on the owner to manually interpret data and decide what action to take. Business Intelligence can improve operational visibility, but it may remain passive if it only displays charts and summaries. Prescriptive analytics addresses this limitation by generating possible actions based on available data. However, prescriptive systems must still consider human judgment, business rules, and 

46 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

operational context. This is why WOOF positions recommendations as owner-reviewable decision artifacts rather than automatic decisions. 

The literature on generative AI supports the use of AI-assisted content preparation, but it also introduces risks related to accuracy, tone, privacy, and accountability. For this reason, WOOF does not treat generative AI as an autonomous marketing engine. Its role is limited to drafting PetHub-ready campaign materials such as announcement drafts, promotional captions, bundle descriptions, and campaign wording based on analytics-generated recommendations. The AI component does not decide which promotion should be implemented, does not publish campaign materials, does not change prices, does not modify product listings, and does not execute discounts. This distinction is important because WOOF is designed as a human-governed analytics and activation system, not an autonomous campaign deployment platform. 

Overall, the reviewed literature supports the individual components of WOOF, including descriptive analytics, cross-channel data integration, Business Intelligence, prescriptive analytics, privacy governance, and AI-assisted campaign preparation. However, the gap identified in the reviewed works is that these components are often discussed separately and are not commonly integrated into a localized SME system that connects physical POS records, e-commerce transactions, PetHub activity, inventory data, customer feedback, forecasting outputs, association-rule recommendations, and owner-approved campaign activation. WOOF fills this gap by combining cross-channel data consolidation, descriptive visibility, predictive forecasting, recommendation generation, and 

47 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

human-governed PetHub campaign preparation into one decision-support workflow for Happy Tails Pet Cafe. 

## **2.2 Review of Related Studies** 

## **2.2.1 Context-Aware Demand and Retail Forecasting** 

## **Use of Multiple Data Sources in Retail Forecasting** 

Retail demand forecasting becomes more reliable when businesses use both internal operational data and relevant external indicators. Mansur et al. (2025) emphasized that combining multiple relevant data sources, such as internal sales data and broader contextual indicators, can improve forecasting performance. This suggests that forecasting should not depend only on historical sales records, especially for businesses where demand may change due to customer behavior, seasonal events, holidays, and environmental conditions. 

However, the use of multiple data sources also introduces challenges. Data from different platforms may follow different formats, update schedules, and levels of completeness. If these records are not cleaned and standardized, combining them may create inaccurate or misleading forecasts. This means that the value of multi-source forecasting depends not only on the number of data sources used, but also on whether the data is properly integrated and prepared for analysis. 

In the context of Happy Tails Pet Cafe, this issue is relevant because demand does not come from only one source. The business generates operational records from the physical POS system, Shopee, TikTok Shop, and PetHub. These 

48 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

records may include sales transactions, retail orders, service bookings, customer activity, campaign responses, and inventory movement. If these records are analyzed separately, the owner may only see partial demand patterns. For example, in-store demand may differ from online retail demand, while service bookings may follow a different pattern from product purchases. 

WOOF addresses this gap by consolidating cross-channel records into an analytics-ready environment before they are used for forecasting. This allows the system to create a stronger forecasting baseline for predicting sales movement, service booking volume, product demand, and possible foot traffic patterns. Therefore, WOOF does not simply apply forecasting models to raw data. It first prepares fragmented internal and external records so that forecasting outputs can better support inventory planning, staffing preparation, service scheduling, and promotional timing. 

## **The Influence of Environmental Variables on Demand and Foot Traffic** 

In service and retail environments, demand may be affected by external conditions such as weather, holidays, and seasonal patterns. Mansur et al. (2025) demonstrated that incorporating environmental and contextual data, such as rainfall and temperature changes, can improve the accuracy of forecasting models. This supports the use of external variables in business forecasting, especially when customer visits and purchasing behavior are affected by daily conditions. 

49 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

However, environmental variables should not be treated as automatically useful in all forecasting situations. Their value depends on whether they have a meaningful relationship with the business activity being predicted. For example, weather may affect physical store visits more directly than online purchases, while holidays may affect grooming appointments, retail demand, and promotional responsiveness differently. This means that WOOF must evaluate contextual variables carefully instead of assuming that every external factor improves forecasting accuracy. 

For Happy Tails Pet Cafe, weather, holidays, weekends, and seasonal patterns may influence physical store visits, grooming appointments, cafe purchases, retail orders, and campaign engagement. Rainy weather may reduce physical foot traffic, while weekends or holidays may increase grooming bookings, pet-related purchases, or responsiveness to promotions. These patterns are important because Happy Tails operates across both service and retail activities, making demand behavior more complex than a single-product business. 

WOOF addresses this by integrating contextual data such as weather, holidays, and seasonality into the forecasting process. This justifies the use of Prophet and SARIMAX as forecasting models. Prophet is suitable for capturing trend and seasonality patterns, while SARIMAX can incorporate exogenous variables such as weather and holiday indicators. However, these models should not be treated as automatically superior. Their performance must be evaluated using forecasting metrics, and the better-performing model should be selected based on the actual dataset and forecasting target. Through this approach, WOOF 

50 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

supports context-aware forecasting while still maintaining model evaluation and business validation. 

## **2.2.2 Behavioral Synergy and Demand Integration** 

## **Market Basket Analysis for Product and Service Association** 

Understanding customer behavior through transaction patterns allows businesses to identify associations among products and services. Chen and Gunawan (2023) demonstrated that integrating association rules with customer behavior data can support more specific, data-driven recommendations in retail environments. Market Basket Analysis is useful because it can identify items or services that are commonly purchased together, which can guide bundling, cross-selling, and promotional planning. 

However, Market Basket Analysis also has limitations. It depends heavily on the structure and quality of transaction-level data. If cafe purchases, grooming services, retail products, and online orders are recorded separately, the system may not always detect cross-sector associations unless the records can be connected at the transaction or customer-session level. This means that Market Basket Analysis should not be presented as a tool that automatically discovers all customer behavior patterns across all channels. Its accuracy depends on whether the available data can meaningfully show co-occurrence relationships. 

In WOOF, Market Basket Analysis is used to identify product and service associations from available transaction records. For example, the system may detect frequently paired retail items, commonly purchased product bundles, or service-related 

51 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

purchase patterns if the data structure supports it. These association patterns can help the owner identify possible cross-selling opportunities and campaign ideas. However, the recommendations should still be reviewed by the owner because statistical association does not automatically mean that a bundle is practical, profitable, or operationally feasible. 

FP-Growth is used because it is efficient for finding frequent itemsets without generating large numbers of candidate combinations, unlike traditional Apriori-based approaches. Hunyadi et al. (2025) supports the efficiency of pattern-growth techniques in transactional datasets. This makes FP-Growth appropriate for WOOF because the system may process transaction records from multiple sales and service channels. However, the use of FP-Growth must still be limited to what the available data can support. WOOF should frame FP-Growth as a method for discovering data-backed bundle opportunities, not as a guarantee of complete customer behavior understanding. 

The gap addressed by WOOF is the lack of a structured method for converting transaction patterns into owner-reviewable cross-selling recommendations. Instead of relying only on intuition or manual observation, WOOF uses association-rule mining to identify possible product and service relationships. These outputs can then support campaign planning, bundle recommendations, and PetHub-ready promotional drafts, while final approval remains with the owner. 

## **2.2.3 Customer Sentiment and Review Analytics** 

## **Sentiment Analysis for Product and Service Feedback** 

52 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Customer feedback from digital platforms provides valuable information for understanding product quality, service issues, and customer satisfaction. Ma et al. (2024) showed that Natural Language Processing and sentiment analysis can extract useful textual features from e-commerce reviews to better understand consumer behavior and purchasing decisions. This supports the use of sentiment analysis in WOOF because Happy Tails Pet Cafe receives customer feedback from online and customer-facing platforms. 

However, customer reviews are different from structured transaction records. Reviews may contain informal language, mixed emotions, sarcasm, incomplete comments, emojis, or Taglish expressions. This means that sentiment analysis should not be treated as perfectly accurate or fully representative of customer satisfaction. The system may classify reviews as positive, negative, or neutral, but these classifications should be interpreted as decision-support indicators rather than absolute judgments. 

In the context of WOOF, customer reviews from Shopee, TikTok Shop, and PetHub can be analyzed to classify feedback and identify recurring concerns. These concerns may include delayed orders, product quality problems, packaging issues, service dissatisfaction, or positive comments about specific products and services. By processing these reviews, WOOF can help the owner understand customer satisfaction beyond sales numbers. 

Sentiment analysis supports both descriptive and prescriptive analytics. Descriptively, it summarizes customer feedback trends. Prescriptively, it can help flag 

53 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

products or services that may require quality control, improved messaging, inventory review, or campaign adjustment. However, sentiment outputs should not automatically trigger business actions. The owner should still review the actual feedback context before deciding whether to restock, promote, discontinue, improve, or investigate a product or service. 

The gap addressed by WOOF is that customer feedback is often available but underused. Reviews may exist on Shopee, TikTok Shop, or PetHub, but if they remain as scattered text comments, they are difficult to use for business decisions. WOOF transforms unstructured customer feedback into summarized sentiment and issue indicators that can support inventory quality control, service improvement, and campaign planning. 

## **Utilizing Customer Sentiment for Inventory Quality Control** 

Consumer feedback is a critical source of operational insight because it can reveal issues that are not visible from sales data alone. A product may sell well but still receive negative comments about packaging, quality, delivery, or customer experience. Similarly, a service may have stable bookings but recurring complaints about waiting time, grooming results, or communication. Sentiment analysis allows the business to detect these concerns more systematically. 

However, sentiment analysis should not be used as the only basis for inventory or quality decisions. Negative feedback may come from isolated incidents, delivery delays outside the business’s control, or customer expectations that do not reflect the 

54 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

general quality of the product. For this reason, sentiment results should be combined with other indicators such as sales volume, return records, complaint frequency, inventory movement, and owner review. 

In WOOF, sentiment analysis can support inventory quality control by flagging products or services with recurring negative feedback. These flagged items may require further review, supplier checking, packaging improvement, service adjustment, or promotional repositioning. Positive feedback may also help identify products or services that can be highlighted in campaigns. 

## **2.2.4 Cross-Channel Operational Efficiency** 

## **Reducing Manual Reconciliation through Centralized Analytics** 

Fragmented records can create repetitive administrative work because the owner or staff must manually compare transactions, inventory movement, orders, bookings, and campaign activity across separate systems. Alsulami, Hamid, and Ghani (2024) emphasized that effective SME analytics adoption requires attention to organizational processes, data readiness, and the effective use of information across business activities. This supports the need for systems that help SMEs organize fragmented business information into usable decision-support outputs. 

However, centralization alone does not automatically produce operational efficiency. If the system only stores data in one place but does not clean, validate, standardize, and organize the records, the owner may still need to manually check 

55 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

inconsistencies. Therefore, WOOF’s value is not only in combining data sources, but in reducing the manual effort required to interpret and reconcile them. 

For Happy Tails Pet Cafe, this issue is reflected in the separation of records across the POS system, Shopee, TikTok Shop, and PetHub. These platforms may contain separate transaction records, order records, booking records, inventory updates, customer reviews, and campaign activity. When these are not connected, the owner may need to compare multiple dashboards, exports, or spreadsheets to understand business performance. 

WOOF addresses this by consolidating records into a centralized analytics environment that supports cross-channel sales visibility, booking visibility, inventory monitoring, review consolidation, and campaign tracking. Instead of relying only on separate platform dashboards or manual spreadsheets, the owner can view consolidated analytics outputs from one system. 

This operational efficiency connects directly to one of WOOF’s measurable outcomes: reduction in manual reconciliation time. By reducing repetitive data checking and improving access to structured information, WOOF supports faster decision-making and more efficient business monitoring. This also strengthens the system’s role as a cross-channel analytics and recommendation activation platform because operational records are not only stored, but transformed into inputs for forecasting, cross-selling analysis, inventory decisions, sentiment review, and PetHub campaign preparation. 

56 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **2.2.5 AI-Assisted Campaign Preparation and PetHub Activation** 

## **Generative AI Support for Marketing Content Preparation** 

Generative artificial intelligence has become increasingly relevant in marketing because it can support the preparation of promotional messages, product descriptions, campaign ideas, and customer-facing communication outputs. Kshetri et al. (2024) explained that generative AI can improve marketing efficiency and productivity by assisting in the creation of marketing content and sales-related communication materials. This supports the inclusion of an AI-assisted campaign preparation component in WOOF. 

However, generative AI should not be treated as an autonomous marketing decision-maker. Generated content may contain inaccurate claims, unclear wording, inappropriate tone, or suggestions that do not match the business’s inventory, pricing, brand identity, or operational capacity. For this reason, AI-generated content should remain subject to human review, especially in an SME setting where the owner directly controls brand voice, pricing decisions, and customer communication. 

In the context of Happy Tails Pet Cafe, WOOF can use analytics outputs such as demand forecasts, slow-moving inventory alerts, customer sentiment insights, and FP-Growth bundle recommendations to help prepare PetHub-ready campaign materials. These materials may include announcement drafts, promotional captions, bundle descriptions, and campaign mechanics. This allows the owner to translate analytics findings into customer-facing outputs more efficiently, instead of manually preparing campaign content from separate reports, spreadsheets, or platform dashboards. 

57 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

The limitation of this feature must be clearly stated. WOOF does not allow generative AI to decide campaigns, publish announcements, modify prices, update product listings, apply discounts, or execute promotions. The AI component only assists in preparing draft text and campaign materials. The owner must review, revise, approve, or reject these outputs before they are used through PetHub. 

The gap addressed by WOOF is the last-mile gap between analytics insight and campaign preparation. Forecasts, sentiment summaries, and bundle recommendations may help identify what the business can act on, but the owner still needs to convert these insights into customer-facing communication. WOOF supports this step by preparing owner-reviewable PetHub campaign drafts while keeping final authority with the owner. 

## **Synthesis of Related Studies** 

The reviewed studies support the use of integrated analytical methods in WOOF, but they also show that each method has limitations when used independently. Forecasting studies justify the use of multiple internal and external data sources, including POS, Shopee, TikTok Shop, PetHub, weather, holidays, and seasonality. However, multi-source forecasting depends on proper data preparation because fragmented or inconsistent records can weaken forecast accuracy. WOOF addresses this by consolidating and standardizing cross-channel records before using them for demand, sales movement, service booking, and foot traffic forecasting. 

58 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

The studies on Market Basket Analysis and FP-Growth support the use of association-rule mining for identifying product and service relationships. However, these methods depend on the availability and quality of transaction-level data. They cannot automatically discover complete customer behavior patterns if records are separated or if product and service purchases are not connected in the data. WOOF therefore uses FP-Growth as a tool for identifying possible bundle and cross-selling opportunities from available transaction patterns, while keeping the final interpretation and approval under the business owner. 

The studies on sentiment analysis and Natural Language Processing support the use of customer reviews as a source of business insight. However, review data is unstructured and may contain informal language, mixed sentiment, or context-specific comments. Sentiment analysis should therefore be treated as a supporting indicator rather than an absolute measure of customer satisfaction. In WOOF, sentiment analysis helps summarize customer concerns and identify possible quality, service, or campaign issues that the owner can further review. 

The studies on operational efficiency and SME analytics adoption support the need to reduce fragmented manual work through centralized analytics. However, centralization is only useful if the data is cleaned, validated, standardized, and transformed into decision-support outputs. WOOF addresses this by using centralized analytics not only for visibility, but also as the foundation for forecasting, association-rule mining, sentiment review, inventory monitoring, and campaign preparation. 

59 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Finally, the studies on generative AI support the use of AI-assisted marketing content preparation, but they also highlight the need for human evaluation. WOOF applies this cautiously by limiting generative AI to PetHub-ready campaign draft preparation. The system does not decide promotions, publish announcements, modify prices, update listings, or apply discounts. All generated outputs remain subject to owner review and approval. Overall, WOOF fills the gap by integrating forecasting, association-rule recommendations, sentiment analysis, centralized operational visibility, and AI-assisted campaign preparation into one owner-governed decision-support workflow for Happy Tails Pet Cafe. 

## **2.3 Analytical Algorithms, Methods, and Models** 

## **Frequent Pattern Discovery via FP-Growth and EMA Normalization** 

Traditional market basket analysis heavily relies on the Apriori algorithm; however, Apriori's necessity for repeated candidate generation creates severe computational bottlenecks when applied to high-volume, multi-channel datasets with increasing SKUs and service categories. While deep learning sequence models offer high predictive accuracy as an alternative, they demand vast, perfectly structured datasets that are rarely available in SME environments. To bridge this gap between computational efficiency and complex cross-channel behavior, the FP-Growth (Frequent Pattern Growth) algorithm utilizes a compressed FP-tree structure, allowing it to mine frequent itemsets without candidate generation (Yu, 2024). 

The WOOF system utilizes the FP-Growth algorithm to process Happy Tails Pet Café’s hybrid dataset, which spans five years of POS transactions alongside 

60 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

e-commerce data from Shopee and TikTok Shop. This method was specifically selected because it efficiently detects subtle behavioral bridges across café, retail, grooming, and online transactions without overwhelming the system's architecture. By bypassing the computational drag of candidate generation, FP-Growth provides a mathematically sound, lightweight foundation for WOOF's reliable bundle recommendations. 

## **Hybrid Time-Series Forecasting and Linear Programming Optimization** 

Conventional time-series forecasting often defaults to standard ARIMA models, which struggle significantly with missing data and fail to natively integrate external environmental factors. Conversely, complex neural networks (such as LSTMs) require massive computational overhead and extensive historical depth. To address these limitations, hybrid approaches utilizing Prophet and SARIMAX excel in identifying seasonal patterns and irregular demand behaviors without the rigidity of traditional statistical models (Saeed et al., 2023; Döring, 2024). Prophet natively supports datasets with missing values and outliers, while SARIMAX actively processes exogenous variables. 

WOOF adopts this specific hybrid forecasting approach to process the café's chaotic historical sales patterns and generate highly accurate planning insights. By utilizing Prophet, the system easily navigates the missing values and outliers common in SME operations. Simultaneously, SARIMAX is deployed to factor in exogenous variables such as sudden weather changes and holiday seasons. Once demand is reliably forecasted using these models, WOOF deploys Linear Programming optimization to 

61 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

automatically translate these predictions into strict resource allocation and staff scheduling decisions. 

Furthermore, functioning as the first layer of defense against stockouts for fast-moving café inventory (e.g., coffee beans and pet treats), WOOF deliberately selects Weighted Moving Average forecasting over complex ML. By mathematically smoothing out daily random spikes in consumption and assigning heavier weights to the most recent sales days, the system generates highly accurate short-term restock alerts without over-complicating the computational load of the server. 

## **Sentiment Analysis** 

Sentiment Analysis typically relies on either basic lexicon matching, which completely fails to interpret context, or advanced deep learning architectures. While deep neural networks are highly accurate at contextual word representations (Ain et al., 2022; Alahmadi et al., 2025), they require massive computational resources and extensive pre-labeled datasets that SMEs simply do not possess. In business and e-commerce environments, the gap lies in finding a scalable framework that can accurately parse informal language without requiring heavy server loads or specialized data scientists (Khan et al., 2021). 

In this study, sentiment analysis is strategically applied using lightweight, highly specialized NLP tools to assess customer reviews from online platforms. This targeted approach allows the system to continuously validate its product recommendations and flag low-performing inventory based on real customer experiences, completely 

62 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

bypassing the infrastructural limitations of deep neural networks. By deliberately selecting resource-efficient models, WOOF strengthens its feedback loop and ensures business decisions are refined without crashing the server. 

## **Time Series Aggregation** 

In optimizing complex systems, integrating extensive time series data often leads to computational intractability. Traditionally, researchers solve this by employing a "one-size-fits-all" input-based Time Series Aggregation (TSA), assuming that clustering algorithms that approximate raw input data will naturally yield accurate optimization outputs. However, Wogrin (2022) heavily critiques this assumption, demonstrating that standard input-based clustering frequently fails to capture the intricate dynamics affecting final optimization outputs, advocating instead for a paradigm shift toward output-error-based TSA methods. 

Recognizing this limitation, WOOF completely abandons generic data compression, such as blindly averaging sales into weekly blocks to save database load. Instead, the system’s aggregation strategy follows Wogrin’s (2022) output-error-based paradigm, tailoring data specifically to its prescriptive outputs. By aggregating data temporally (e.g., strictly by hour-of-day) to preserve the intricate fluctuations in customer foot traffic and grooming appointments, WOOF ensures the predictive models generate highly accurate "Happy Hour" recommendations without succumbing to the computational overload that plagues traditional models. 

## **Historical Discount Tracking** 

63 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Many modern retail systems execute automated promotions based purely on real-time inventory levels, effectively launching blind markdowns that frequently result in revenue loss. Evaluating past campaigns through Historical Discount Tracking is a critical prerequisite to solving this. Biswas (2024) emphasizes that predictive algorithms cannot reliably forecast future demand elasticity without isolating the actual impact of past discounts from baseline sales. Without quantitative tracking of past promotional performance, systems cannot mathematically differentiate between a successful discount and a financial loss. 

Instead of relying on predictive guesswork or static markdown rules, WOOF’s architecture integrates Biswas’s (2024) framework to require a precise historical baseline. The system actively tracks and evaluates how previous discounts on grooming or café items impacted overall revenue, identifying exactly which cuts drove engagement and which caused financial strain. Consequently, WOOF only triggers new "Happy Hour" markdowns based entirely on these historically proven successes, fundamentally shifting the platform from reactive price-slashing to mathematically optimized profitability. 

## **Service Occupancy Mapping** 

Strategic capacity planning often defaults to reactive staffing or basic heuristic scheduling, which fails to prevent opportunity loss during unpredicted peak hours. According to Rizki and Dhewanto (2025), advanced scheduling models are useless without first establishing a descriptive baseline of current resource utilization. Furthermore, Owczarek (2025) highlights that mapping utilization metrics allows businesses to transition away from reactive management. Without tracking when and 

64 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

how existing resources are utilized, predictive simulations cannot reliably optimize output. 

Addressing the severe limitations of static appointment books, WOOF employs Service Occupancy Mapping to descriptively isolate "dead hours" on Happy Tails’ grooming tables. By systematically defining these temporal gaps first, WOOF provides the necessary constraint parameters for its prescriptive engine. Once the idle slots are mapped descriptively, the system’s Mixed-Integer Linear Programming can automatically route promotional discounts directly to those empty periods, successfully converting idle operational time into measurable profit. 

## **TF-IDF Algorithm** 

Transforming unstructured textual data into a quantifiable format is often handled by basic Bag-of-Words (BoW) models, which erroneously assign equal importance to all words, or complex Word2Vec embeddings, which are too computationally heavy for simple review extraction. According to Alqurafi and Alsanoosy (2024), the Term Frequency-Inverse Document Frequency (TF-IDF) algorithm provides the optimal balance. By calculating a word's weight based on its frequency in a single review versus its commonality across the entire dataset, TF-IDF effectively isolates context-heavy keywords and filters out meaningless stop words. 

Because Happy Tails aggregates informal, slang-heavy customer feedback from Shopee and TikTok, a basic BoW model would overwhelm the system with conversational noise. By deploying the TF-IDF algorithm, WOOF autonomously filters out irrelevant stop words and assigns mathematical weight exclusively to critical, 

65 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

sentiment-bearing keywords (such as "defective," "mabango," or "delayed"). This deliberate mathematical filtering ensures that the system's predictive NLP models evaluate a refined, high-value dataset for highly accurate customer satisfaction evaluation. 

## **ETL Data Transformation and Multi-Tier Architecture** 

Raw data extracted from diverse digital platforms is inherently noisy, inconsistently formatted, and entirely unsuitable for immediate algorithmic processing. While some systems attempt to query operational databases directly, this inevitably causes algorithmic bias and system crashes. According to Sarker (2021), the transformation phase within an Extract, Transform, Load (ETL) pipeline is an obligatory prerequisite to prevent predictive models from generating mathematically flawed outputs. This rigorous transformation ensures that only high-quality, standardized information reaches the machine learning environment. 

To bridge the gap between unstructured cross-channel APIs and strict algorithmic requirements, WOOF utilizes a multi-tier ETL architecture. Because Happy Tails generates drastically different data structures across TikTok Shop, Shopee, and Loyverse POS, WOOF systematically neutralizes this chaotic influx. Semi-structured records initially land in a MongoDB staging layer, pass through an automated ETL pipeline that cleanses and unifies variables, and are finally loaded into a centralized Supabase repository. This staged architectural alignment guarantees that WOOF's analytical engines ingest exclusively clean, domain-ready data. 

66 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **Prophet** 

Traditional statistical forecasting models, such as standard exponential smoothing, frequently break down when exposed to irregular trends, missing data, and holiday spikes. According to Saeed et al. (2023), the Prophet algorithm specifically resolves this vulnerability, proving highly resilient to missing data, outliers, and extreme seasonal shifts. Its underlying mathematical architecture makes it vastly superior for business forecasting in environments where data is sparse and heavily dictated by external events rather than clean, linear progression. 

Because Happy Tails Pet Café’s foot traffic and grooming demands are chaotic and highly seasonal (e.g., severe weekend spikes or sudden holiday surges), traditional models would generate highly inaccurate baseline forecasts. Prophet is exclusively utilized by WOOF because it automatically adjusts for these extreme seasonal parameters. This targeted deployment ensures that the system's prescriptive engine continuously receives a stable, accurate baseline to trigger its promotional logic, despite the chaotic nature of daily SME operations. 

## **Linear Programming** 

Assigning schedules and maximizing resources within finite operational constraints is frequently handled by manual heuristics or basic greedy algorithms, both of which struggle to manage overlapping limitations and often leave profitable gaps unfilled. As illustrated by Lee et al. (2024), Mixed-Integer Linear Programming (MILP) is an elite optimization framework capable of adhering to finite resource limitations while finding the mathematical absolute optimum configuration. 

67 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

To maximize profitability at Happy Tails, the WOOF system outright rejects basic scheduling heuristics in favor of an MILP framework. By mathematically treating the café's physical grooming tables as finite variables and the groomers' working hours as strict constraints, the algorithm systematically identifies the single most profitable configuration of appointments. The system is then able to automatically route promotional discounts strictly to time slots that would otherwise yield zero revenue. 

## **Moving Average Forecasting** 

While deep learning and complex predictive models are highly praised in modern literature, applying them to short-term, fast-moving consumer goods often leads to severe computational waste, server strain, and model overfitting. Research by Alharbi and Csala (2022) validates that Moving Average methodologies remain incredibly robust at smoothing out chaotic temporal data to provide reliable, short-term predictive benchmarks without requiring heavy machine learning infrastructure. 

Functioning as the first layer of defense against stockouts for fast-moving café inventory (e.g., coffee beans and pet treats), WOOF deliberately selects Weighted Moving Average forecasting over complex ML. By mathematically smoothing out daily random spikes in consumption and assigning heavier weights to the most recent sales days, the system generates highly accurate short-term restock alerts without over-complicating the computational load of the server. 

68 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **SARIMAX (Seasonal AutoRegressive Integrated Moving Average with eXogenous** 

## **variables)** 

While standard ARIMA models effectively analyze historical sequences, they operate in a vacuum, completely blind to external market forces. Döring (2024) notes that SARIMAX extends traditional analysis by actively capturing the influence of exogenous variables alongside autoregressive patterns. This integration of external context, such as climate variability and market shifts, is required to optimize predictions in highly volatile operational environments where historical sales alone do not dictate future demand. 

This distinction is critical for WOOF’s Demand & Foot Traffic Forecaster. Because a pet café’s foot traffic is heavily dictated by external realities, such as severe weather dropping walk-ins to zero, standard autoregressive models would confidently, and incorrectly, predict high sales on a stormy weekend. SARIMAX serves as the mathematical core of the forecaster precisely to fill this gap, ensuring the manager receives context-aware predictions that dynamically adjust to both historical trends and external environmental realities. 

## **Economic Order Quantity Algorithm (EOQ)** 

Modern retail often flirts with Just-In-Time (JIT) inventory systems; however, JIT is highly vulnerable to supply chain disruptions—a risk most SMEs cannot financially absorb. Conversely, arbitrary manual ordering leads to massive inventory holding costs. The Economic Order Quantity (EOQ) model remains a fundamental mathematical tool that provides the optimal middle ground. Implementing EOQ systematically reduces total 

69 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

holding costs by strictly calculating optimal order sizes, safety stock, and reorder points (Zanabazar et al., 2025). 

Within the prescriptive phase of WOOF, EOQ completely replaces management guesswork. Rather than estimating order volumes intuitively, the system utilizes EOQ to provide a strict, mathematically sound prescription of exact stock requirements based on the predicted demand. This data-driven approach streamlines Happy Tails' supply chain management by minimizing ordering frequencies and balancing holding constraints without exposing the business to the risks of overstocking. 

## **Master Data Management (MDM) via Transaction Frequency Matrix** 

Without a centralized governance framework, cross-channel analytics typically devolve into isolated data silos, rendering enterprise-wide insights mathematically impossible. Implementing a robust Master Data Management (MDM) framework enables enterprises to consolidate disparate data silos, forcing fragmented information into a unified, single "golden record" (Sharma, 2024). MDM acts as a critical prerequisite, ensuring that predictive algorithms process reliable, standardized information rather than conflicting datasets. 

Instead of letting the analytical engines struggle with fragmented product names across Shopee, TikTok, and the physical POS, WOOF employs MDM as a strict descriptive baseline. By utilizing a Transaction Frequency Matrix, the system standardizes all cross-channel identities into a single source of truth before any predictive algorithms attempt to compute frequent itemsets. This actively resolves the root cause of algorithmic failure caused by disjointed multi-platform data structures. 

70 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **Automated Threshold Triggering** 

Modern operational software frequently attempts to use opaque machine-learning models for all automated decisions, which often leads to illogical "black box" interventions that users cannot interpret or trust. To solve this, Samineni (2020) emphasizes that rule-based threshold frameworks leverage domain-aware constraints to ensure reliable, adaptive actions. By establishing pre-defined statistical boundaries, systems can execute transparent, immediate responses the moment critical limits are breached, minimizing computational latency and false alarms. 

WOOF’s Smart Bundle & Cross-Selling Engine completely rejects opaque ML for its final decision gates, relying instead on Automated Threshold Triggering to execute prescriptive commands. Operating as a strict rule-based logic gate, this method restricts the system from making suggestions unless predefined statistical values are met. For example, the module will only recommend a bundle if the calculated Confidence and Lift strictly exceed a proven mathematical baseline, preventing operational guesswork. 

## **Random Forest Classifier** 

When evaluating probabilities, single Decision Trees are highly interpretable but notoriously prone to overfitting, while Deep Neural Networks prevent overfitting but act as uninterpretable black boxes requiring immense data. The Random Forest algorithm perfectly bridges this gap. By aggregating discrete predictions across a multitude of trees, it mitigates overfitting while remaining highly adept at processing complex, 

71 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

non-linear variables where multiple unpredictable environments interact simultaneously (Palczewska, 2024). 

To power the predictive phase of the "Happy Hour" Dynamic Promo Engine, WOOF deploys a Random Forest Classifier. The algorithm is tasked with processing multi-faceted variables, such as the combination of current weather conditions, time of day, and historical conversion rates. Utilizing this ensemble method ensures that the platform generates highly accurate probability scores for promotional success without succumbing to data overfitting, allowing Happy Tails to confidently predict if an off-peak discount will actually convert. 

## **Prescriptive Rule-Based Heuristics** 

Relying purely on predictive probabilities forces business owners to manually compute complex statistics for every operational decision. Conversely, fully autonomous execution strips the owner of agency. Prescriptive heuristics provide the optimal solution by codifying "fast and frugal" rules into strict conditional logic, effectively bridging the gap between predictive insights and actual physical execution (Nadurak, 2022). This ensures that automated decisions rapidly translate complex probabilities into concrete actions while remaining within safe boundaries. 

To translate predictive probabilities into actionable business recommendations safely, the “Happy Hour” Dynamic Promo Engine integrates Prescriptive Rule-Based 

72 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Heuristics. Once the system outputs a probability score for a potential discount, the module uses conditional logic to determine whether a recommendation should be generated for owner review. This strictly applied heuristic framework ensures targeted discount opportunities are recommended only when anticipated foot traffic is low and statistical success is high, effectively preventing illogical promotional prompts. 

## **Generative Campaign Copilot** 

While generative artificial intelligence dramatically accelerates marketing production and efficiency (Kshetri et al., 2024), utilizing it as a fully autonomous publishing agent introduces severe brand safety and compliance risks. The challenge in enterprise deployment lies in leveraging the AI’s generative power to translate raw analytics into marketing copy without relinquishing human oversight and strategic control over public-facing materials. 

WOOF addresses this exact limitation through its Generative Campaign Copilot. It leverages generative AI to convert validated analytics outputs into editable PetHub-ready campaign materials, but enforces a strict Human-In-The-Loop boundary. The Copilot does not autonomously publish content; instead, it supports human decision-making by drafting materials that remain subject to owner review. This bridges the gap between insight generation and marketing execution while completely neutralizing the risks of autonomous AI hallucination. 

## **Queueing Theory (M/M/c Model)** 

73 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Managing physical service wait times is often handled by deterministic scheduling, which falsely assumes every customer arrives precisely on time and every service takes the exact same duration. In reality, physical operations experience highly stochastic variables. The M/M/c Queueing Model specifically addresses operational scenarios characterized by unpredictable arrival rates and exponential service durations handled by multiple servers, enabling organizations to calculate critical metrics like system delays and average queue lengths accurately (D’Auria et al., 2022). 

Beyond theoretical calculations, implementing this stochastic model allows service-oriented businesses to effectively balance customer satisfaction with operational efficiency. Utilizing the M/M/c queueing framework enables management to optimize resource allocation, ensuring that the number of active servers dynamically aligns with fluctuating demand (D’Auria et al., 2022). This systematic approach prevents severe service bottlenecks during sudden peak hours while simultaneously minimizing the financial strain of overstaffing during idle periods. 

To reliably forecast customer waiting times and prevent operational bottlenecks, the predictive phase of the Service Maximizer integrates the M/M/c Queueing Model. Because Happy Tails' pet grooming services inherently experience random walk-in arrivals and highly variable service durations depending on the pet, this specific mathematical framework accurately mimics the unpredictable nature of the café’s physical operations. By applying the multi-server queueing principles analyzed by D’Auria et al. (2022), the system effectively anticipates delays before they occur. This empowers the module to mathematically determine the optimal minimum number of active grooming staff needed per shift, ensuring walk-in traffic is handled smoothly 

74 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

without exceeding budgetary constraints or target waiting times. 

## **VADER (Valence Aware Dictionary and sEntiment Reasoner)** 

Traditional sentiment classifiers require extensive, domain-specific labeled training datasets to function accurately, a luxury SMEs cannot afford. Furthermore, standard models consistently fail to interpret modern digital syntax. VADER bridges this gap as a highly specialized lexicon tool engineered to accurately evaluate nuanced, informal language without computationally heavy training (Youvan, 2024). It specifically decodes complex syntactic cues like emphatic capitalization, Taglish slang, and emojis to instantly gauge emotional intensity. 

To drive the descriptive analytics of the Customer Sentiment Radar, WOOF exclusively utilizes VADER. Because Happy Tails processes massive amounts of chaotic, slang-heavy customer feedback from Shopee and TikTok, standard NLP models would fail entirely. By leveraging VADER, the system can instantly capture the precise emotional intensity of a customer's experience straight out-of-the-box. This provides management with an authentic, near real-time pulse of their market's satisfaction levels without the barrier of expensive machine learning training. 

## **Latent Dirichlet Allocation (LDA) Topic Modeling** 

Standard text classification typically relies on supervised machine learning, which depends heavily on massive, manually pre-labeled datasets. For an SME processing a continuous, chaotic stream of cross-channel reviews, manual labeling is logistically impossible, while basic keyword grouping frequently fails to capture semantic context. 

75 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Latent Dirichlet Allocation (LDA) bridges this gap as a powerful unsupervised generative statistical model. By treating documents as mathematical mixtures of overarching topics rather than rigid categories, LDA autonomously discovers hidden thematic structures without the labor-intensive requirement of pre-labeling (Chidi et al., 2024). 

Within the predictive phase of the Customer Sentiment Radar, WOOF deploys LDA specifically to bypass the bottleneck of manual data sorting. Because Happy Tails receives highly variable feedback across multiple platforms, the system uses LDA to autonomously cluster the unstructured text into hidden operational categories. This integration empowers management to instantly identify whether underlying sentiments are driven by grooming quality, barista behavior, or facility hygiene—an analytical depth that would be unachievable through standard supervised classification. 

## **Automated Alert Routing** 

Traditional enterprise dashboards often broadcast generic warnings across an entire network, a practice that inevitably leads to alert fatigue, cognitive overload, and ultimately, ignored critical warnings. To resolve this operational bottleneck, Verma (2026) emphasizes the necessity of targeted automation that categorizes issues by severity and directs them strictly to appropriate personnel. This systematic filtering minimizes response latency and guarantees that critical anomalies are addressed by the correct decision-makers rather than getting lost in a general feed. 

Addressing the severe limitations of static dashboard alarms, WOOF functions on a prescriptive communication protocol governed by Automated Alert Routing. Instead of 

76 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

overwhelming the café manager with a continuous stream of raw analytical outputs, the system utilizes this routing mechanism to dispatch notifications exclusively when mathematically validated interventions, such as a critical inventory drop or a trigger-ready "Happy Hour" promotion, are required. This specific framework minimizes response latency and actively bridges the gap between predictive insight and focused managerial execution. 

## **System-Prompted Business Heuristics** 

Integrating Large Language Models (LLMs) into commercial applications introduces the severe risk of AI hallucination, where open-ended generative models may confidently invent non-existent policies or offer unauthorized discounts. While fine-tuning an LLM to prevent this is computationally and financially prohibitive for SMEs, system-prompted business heuristics offer a lightweight, highly secure alternative. This framework embeds strict conditional logic directly into the model's underlying architecture, forcing it to filter outputs through predefined business rules before interacting with the user (Saeedi et al., 2025). 

To guarantee that WOOF’s Claude-powered chatbot remains a safe digital concierge, developers explicitly rejected open-ended conversational models. By utilizing system-prompted heuristics, WOOF strictly bounds the AI with actual business logic. The developers embedded specific operational constraints, such as mandating proof of pet vaccination before scheduling or restricting promotions strictly to valid time windows, directly into the LLM's hidden instructions. This effectively neutralizes the risk of unauthorized AI actions and ensures the bot adheres to Happy Tails' policies. 

77 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **Model Evaluation Tracking** 

A critical flaw in many automated analytical systems is the "deploy-and-forget" approach, where predictive models are assumed to remain accurate indefinitely. In reality, machine learning models inevitably degrade due to shifting environmental variables and changing consumer behaviors. Song et al. (2022) established that tracking model evaluation against historical baselines using standardized statistical metrics is mandatory. This ongoing validation is the only way to detect concept drift and algorithmic anomalies before they trigger flawed business decisions. 

To prevent the Demand Forecaster and Dynamic Promo engines from acting on obsolete patterns, WOOF deliberately integrates Model Evaluation Tracking into its continuous feedback loop. Rather than trusting initial algorithmic predictions blindly, WOOF actively captures the real-world outcomes of its automated recommendations (e.g., tracking whether a forecasted grooming bottleneck actually materialized) and compares them against the initial output. This closed-loop diagnostic bridges the gap between static deployment and dynamic reality, ensuring the system continuously audits and refines its own accuracy. 

## **Concept Drift Detection (ADWIN)** 

When the underlying statistical properties of consumer behavior change over time, concept drift may occur. This can reduce the reliability of forecasting and recommendation systems because historical patterns may no longer reflect current business conditions. Adaptive Windowing (ADWIN) addresses this by continuously monitoring data streams and adjusting its observation window when distribution changes 

78 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

are detected. During stable periods, ADWIN keeps a wider window of historical data, while during sudden shifts, it narrows the window to prioritize recent patterns and reduce the influence of outdated data (Assis & Souza, 2025). 

In WOOF, ADWIN-based concept drift detection is integrated into the feedback loop to support both predictive and prescriptive analytics. For predictive analytics, it monitors changes in sales movement, service booking volume, inventory activity, campaign response, and demand patterns. For prescriptive analytics, it helps identify when recommendation logic, such as bundle rankings, cross-selling rules, campaign heuristics, or strategic low-association bundle rules, may need to be refreshed based on updated transaction patterns and recommendation outcomes. When significant deviation is detected, WOOF flags the affected forecasting model, recommendation rule set, or bundling logic for scheduled or drift-triggered batch retraining, rule refresh, or recalibration. The system does not perform continuous per-transaction learning. Instead, it uses accumulated ETL-validated data to prevent raw, duplicated, incomplete, or anomalous records from directly affecting the models or recommendation rules. After retraining or recalibration, the updated model or rule set is treated as a candidate output and evaluated against the currently active model or recommendation logic before replacement. This allows WOOF to adapt to changing customer demand and purchasing behavior while maintaining data quality, model stability, and owner-governed business execution. 

## **Automated Batch Retraining** 

79 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Maintaining model accuracy typically presents a dilemma for software architects: continuous learning updates models per transaction but crushes server resources, while complete manual retraining causes severe system downtime. Automated batch retraining serves as the optimal architectural middle ground. It systematically refreshes predictive models by processing newly accumulated data in consolidated, discrete cycles rather than processing every individual data point (Wong & Perumal, 2025). 

WOOF deliberately rejects computationally expensive continuous learning in favor of Automated Batch Retraining. Once the system's concept drift detection flags a significant shift in café operations, the platform does not instantly halt operations to retrain the algorithm. Instead, it compiles the recent operational feedback into a structured batch and seamlessly updates the model exclusively during off-peak hours. This structured strategy successfully mitigates model degradation while preserving the café's backend processing power during busy store hours. 

## **Trend Extrapolation** 

Standard reporting modules inherently suffer from a retrospective bias; they effectively summarize past sales figures but force managers to rely on manual intuition to guess future trajectories. Tsai et al. (2023) advocate for advanced trend extrapolation to bridge this gap. Unlike static baselines that simply average past performance, extrapolation algorithms utilize mathematical smoothing to actively filter out random, day-to-day statistical noise, successfully isolating genuine longitudinal shifts in consumer behavior. 

To elevate its Automated Report Engine from a passive tracking tool to a 

80 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

proactive strategic asset, WOOF integrates robust trend extrapolation algorithms. Instead of merely presenting past sales figures or historical grooming volumes, the engine mathematically projects the isolated directional patterns into the future. This bridges the critical gap between descriptive data and forward-looking action, inherently equipping decision-makers with data-backed estimates for resource allocation before a projected surge or decline actually occurs. 

## **Parameterized Natural Language Generation (NLG)** 

While predictive algorithms generate highly accurate numerical matrices, these raw outputs frequently overwhelm non-technical management, rendering the data practically useless. Conversely, rigid "fill-in-the-blank" text templates break down when variables shift unexpectedly. Parameterized Natural Language Generation (NLG) bridges this cognitive gap by dynamically weaving fluctuating metrics, such as time-series projections or operational triggers, into fluent, context-aware narratives (Jayawardena & Yapa, 2024). 

Recognizing that SME operators require immediate clarity, WOOF integrates Parameterized NLG to autonomously translate hard metrics into conversational executive summaries. Instead of presenting the café owner with a complex SARIMAX forecast table, the system uses underlying metrics to generate precise narratives, such as, "Grooming appointments are projected to increase by 20% next weekend due to the upcoming holiday, requiring two additional staff members." This specific methodology ensures that advanced cross-channel analytics are immediately digestible and 

81 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

actionable at a glance. 

## **Synthesis of Analytical Models** 

A critical evaluation of modern retail literature reveals a persistent gap in SME digital transformation: while multi-channel data integration and advanced predictive analytics are widely recognized as competitive necessities, the computational overhead, required data science expertise, and risk of autonomous AI execution render enterprise-grade solutions inaccessible for small-scale operations. The analytical algorithms, methods, and models selected for the WOOF system systematically resolve these barriers, deliberately prioritizing lightweight, high-yield frameworks over resource-heavy deep learning architecture. 

To solve the foundational challenge of cross-channel data fragmentation, WOOF rejects direct API querying in favor of a robust ETL pipeline and Master Data Management (MDM). This multi-tier staging ensures that disparate records from POS, Shopee, TikTok Shop, and PetHub are mathematically unified before reaching downstream models. For predictive accuracy in a highly volatile environment, WOOF discards traditional static methods, utilizing Prophet and SARIMAX to seamlessly handle missing data and exogenous market variables. Simultaneously, ADWIN and Automated Batch Retraining ensure these models autonomously adapt to concept drift without requiring manual recalibration. 

Furthermore, the system strategically bridges the divide between predictive insight and physical execution. Rather than relying on generic scheduling heuristics, 

82 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

WOOF implements rigorous M/M/c Queueing and Mixed-Integer Linear Programming to mathematically allocate service capacities, alongside EOQ for inventory optimization. To mitigate the operational risks of "black-box" AI systems, WOOF intentionally limits its prescriptive engine through Automated Threshold Triggering, Historical Discount Tracking, and System-Prompted Business Heuristics, guaranteeing mathematically validated and financially safe automated recommendations. Finally, by integrating Parameterized NLG and a Generative Campaign Copilot under a strict Human-in-the-Loop constraint, WOOF successfully establishes itself as a fully architected decision-support engine capable of safely transforming chaotic data into automated, owner-reviewable business actions. 

## **2.4 Related Systems** 

## **2.4.1 Existing Systems and the Gap Analysis** 

## **Operational Constraints of Standalone POS Systems** 

Standalone point-of-sale systems are commonly used by small and medium enterprises to record sales transactions, monitor basic inventory movement, and generate sales reports. According to Ramadhani et al. (2025), SMEs that rely on manual recording methods or legacy POS systems may experience operational problems such as delayed inventory updates, data inconsistencies, human error, and difficulty accessing timely business information. These limitations can affect inventory monitoring, sales tracking, and management decision-making. 

However, while POS systems are useful for recording in-store transactions, they are often limited when used as the only source of business intelligence. A standard POS 

83 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

system can show what was sold, when it was sold, and how much revenue was generated, but it may not automatically connect these records with e-commerce transactions, customer reviews, campaign activity, external demand factors, or predictive analytics. This means that POS systems can support transaction recording but may remain insufficient for cross-channel decision support. 

This limitation is relevant to Happy Tails Pet Cafe because the business uses physical store transaction records, but these records are not fully synchronized with other operational sources such as Shopee, TikTok Shop, PetHub, customer feedback, and campaign-related activity. As a result, the owner may still need to manually compare records across separate platforms to understand sales movement, inventory status, service demand, and customer behavior. 

WOOF does not aim to replace the existing POS system. Instead, it functions as an analytics layer that consolidates POS records with other business data sources. Through this integration, POS data becomes part of a wider decision-support workflow involving descriptive dashboards, demand forecasting, cross-selling analysis, sentiment review, inventory insights, and owner-governed campaign activation. 

## **Fragmentation of Isolated E-Commerce Channels** 

E-commerce platforms allow SMEs to expand their selling activities beyond the physical store. Platforms such as Shopee and TikTok Shop can support online ordering, customer reach, digital product visibility, and marketplace-based sales. Febriani, Sopha, and Wibisono (2025) explained that MSMEs may experience partial integration when physical and digital storefronts operate separately due to resource and technological 

84 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

limitations. This creates difficulty in coordinating inventory, sales information, customer service, and operational decisions across channels. 

However, the presence of e-commerce platforms does not automatically mean that the business has cross-channel intelligence. Shopee and TikTok Shop may provide their own transaction records and platform dashboards, but these are usually isolated from physical POS records, service bookings, customer feedback from other sources, and internal campaign activity. As a result, the business may have multiple sources of data but no centralized view of how these channels relate to one another. 

For Happy Tails Pet Cafe, this fragmentation is important because the business operates through both physical and digital channels. Physical store sales, Shopee orders, TikTok Shop transactions, and PetHub activity may each provide useful information, but separate records make it difficult to identify complete demand patterns, inventory implications, and cross-channel customer behavior. This may lead to manual reconciliation, delayed reporting, inconsistent inventory visibility, and limited basis for promotional planning. 

WOOF addresses this gap by consolidating records from the physical POS system, Shopee, TikTok Shop, and PetHub into one analytics-ready environment. Rather than replacing these platforms, WOOF connects their data so that the owner can view cross-channel sales movement, product demand, service activity, customer feedback, and campaign performance from a centralized decision-support system. 

## **Context-Aware Demand Forecasting Systems** 

Demand forecasting systems help businesses anticipate future sales, service 

85 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

demand, inventory needs, and customer activity. Conventional forecasting approaches often rely mainly on historical sales data. While historical data is important, it may not fully explain demand changes caused by external factors such as weather, holidays, weekends, seasonal patterns, and local events. Gopinathan (2025) emphasized the value of context-aware forecasting by considering external indicators alongside historical demand patterns. 

However, context-aware forecasting systems are often more accessible to larger businesses with stronger data infrastructure, technical expertise, and system integration capacity. Localized SMEs may not have the resources to connect POS records, e-commerce data, weather indicators, holiday calendars, and service demand into one forecasting workflow. As a result, many SMEs may still rely on manual judgment when preparing inventory, staffing, service schedules, and promotions. 

For Happy Tails Pet Cafe, demand may be affected by both internal and external conditions. Physical foot traffic, grooming appointments, cafe purchases, retail orders, and campaign responsiveness may change depending on weather, holidays, weekends, and seasonal customer behavior. If these factors are not considered, the business may experience stockouts, overstocking, poor promotional timing, or reactive service preparation. 

WOOF addresses this gap by incorporating contextual indicators such as weather, holidays, and seasonality into its forecasting process. The system uses historical and cross-channel data as the forecasting baseline, while external variables provide additional context for anticipating demand changes. This allows the owner to 

86 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

make more proactive decisions regarding inventory planning, staffing preparation, service scheduling, and campaign timing. 

## **Synthesis of Related Systems** 

The review of related systems shows that standalone POS systems, e-commerce platforms, basic dashboards, context-aware forecasting tools, and AI-assisted marketing tools each address only one part of Happy Tails Pet Cafe’s operational needs. A POS system can record in-store transactions, but it does not fully connect physical sales with online orders, PetHub activity, customer reviews, campaign records, and external forecasting indicators. E-commerce platforms can support online selling, but their data may remain isolated from the physical store and internal decision-making process. Forecasting systems can help anticipate demand, but they may not be accessible or fully integrated into the workflow of a localized SME. AI marketing tools can assist in preparing content, but they require human review to avoid inaccurate or inappropriate campaign outputs. 

This creates a system gap between operational data collection and owner-approved business action. Happy Tails Pet Cafe does not only need a POS system, an e-commerce platform, a dashboard, or a forecasting model. It needs an integrated decision-support workflow that connects physical POS records, Shopee transactions, TikTok Shop orders, PetHub activity, inventory data, customer feedback, weather, holidays, seasonality, forecasting outputs, cross-selling recommendations, and campaign preparation. 

87 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

WOOF fills this gap by serving as the missing intelligence and activation layer between the business’s existing operational systems and the owner’s final business decisions. It does not replace the existing POS, Shopee, TikTok Shop, or PetHub. Instead, it consolidates their fragmented records, transforms them into analytics-ready insights, generates forecasts and recommendations, and prepares owner-reviewable PetHub campaign outputs. Therefore, WOOF is positioned not as another standalone system, but as a cross-channel analytics and recommendation activation system designed to support decision-making for a localized multi-line SME. 

## **2.5 Related Technologies** 

## **2.5.1 Technical Stack** 

## **Expo and React Native for Cross-Platform Mobile Development** 

Developing mobile operations interfaces traditionally requires building separate native codebases for iOS (Swift) and Android (Kotlin). Small-to-medium enterprises (SMEs) face unsustainable development costs, require specialized IT teams, and experience severe maintenance bottlenecks when attempting this dual-platform approach. According to a comparative software engineering study by Hutri (2023), Expo combined with React Native solves this constraint by providing an advanced abstraction layer. This framework allows developers to write a single, platform-neutral JavaScript/TypeScript codebase that natively compiles to both environments, significantly reducing the lines of code required to handle complex mobile architectures. 

Implementing these architectural advantages, the WOOF system utilizes Expo to enable the rapid deployment of a unified mobile operations interface without demanding heavy IT resources. Happy Tails staff utilize varying personal devices; therefore, the 

88 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

cross-platform nature of React Native ensures that the café owner, groomers, and baristas can seamlessly receive near real-time operational alerts, task prompts, and inventory notifications regardless of their operating system. This specific framework allows the system to bridge the gap between complex backend analytics and front-line mobile execution without the financial burden of native dual-platform development. 

## **Webhooks for Near Real-Time E-Commerce Synchronization** 

In modern cross-channel retail and service environments, collecting transactional data from third-party platforms requires a mechanism that reduces the inefficiency of continuous polling. Webhooks provide an event-driven architecture where external platforms send data to a receiving endpoint when a predefined event occurs, such as a completed purchase, booking update, inventory movement, review submission, or campaign interaction. Unlike traditional REST API polling, which repeatedly queries external services at fixed intervals regardless of whether new data exists, webhooks operate on a push-based model that transmits data only when relevant events occur, reducing unnecessary network traffic and server load (Zhang et al., 2021). 

For e-commerce and platform integrations, event-driven architectures have been shown to reduce data latency and improve operational responsiveness in distributed systems where multiple data sources must remain coordinated (Murley et al., 2021). In the context of WOOF, webhooks support the timely ingestion of relevant operational data from Shopee, TikTok Shop, PetHub, and other available digital touchpoints. These events may include order placements, payment confirmations, inventory-related updates, booking records, campaign interactions, and review-related activities. This push-based 

89 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

approach supports cross-channel visibility by helping the system receive updated operational records without relying solely on repeated manual checking or constant API requests. 

Applying these technical advantages to the WOOF system, integrating webhooks allows the centralized NestJS backend to receive near-real-time transactional and operational notifications from connected platforms. Rather than continuously polling Shopee, TikTok Shop, and PetHub APIs every few seconds, the system can listen for incoming webhook payloads, validate them, and pass them through the Redis queue and ETL pipeline for staging and processing. Consequently, this allows WOOF to update 

its raw data lake, analytical warehouse, dashboard summaries, inventory alerts, and recommendation logs more efficiently. This supports the owner’s ability to monitor cross-channel sales performance, detect stock discrepancies, review customer activity, and receive system-generated alerts without depending entirely on manual platform checking. 

## **Near Real-Time Data Synchronization via WebSockets** 

The integration of environmental data into predictive analytics has been documented as a method for improving forecasting accuracy. In retail and service environments, demand forecasting may be affected by exogenous factors because sales, service bookings, customer visits, and product demand can vary depending on local weather conditions, holidays, and seasonal events (Fildes et al., 2022). By incorporating meteorological indicators into time-series forecasting models, analytics systems can become more responsive to external demand drivers. 

90 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Webhooks efficiently pull data from external servers to the backend; however, pushing those newly analyzed insights from the backend to a user’s web browser typically requires the user to manually refresh the page. Relying on manual page reloads or frontend HTTP polling creates a lag in operational awareness, which proves fatal during fast-paced retail hours. WebSockets resolve this by providing a full-duplex, bidirectional communication channel over a single TCP connection, allowing the server to push live updates directly to the client's interface without the overhead of repeated HTTP requests. 

Operating as an active decision-support dashboard, the WOOF system cannot afford analytical delays when a critical ingredient stocks out. The architecture implements WebSockets to maintain a persistent connection between the NestJS backend and the Next.js frontend. The moment a webhook registers a sudden spike in online orders or a machine learning algorithm triggers a "Happy Hour" recommendation, the WebSocket instantly pushes that alert to the Happy Tails manager's screen. This capability ensures that prescriptive analytics translate into immediate physical awareness, fundamentally shifting the dashboard from a static reporting tool to a live operational radar. 

## **Environmental Context-Awareness using OpenWeatherMap API** 

Standard time-series forecasting models operate in a statistical vacuum, relying strictly on historical sales to predict future trends. Physical retail and service environments, however, experience demand fluctuations heavily dictated by exogenous environmental factors; an unexpected storm can instantly drop walk-in foot traffic to zero, 

91 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

rendering historical baseline forecasts entirely useless (Fildes et al., 2022). Incorporating live meteorological indicators into machine learning frameworks empowers analytical systems to break free from historical bias and become highly responsive to immediate external demand drivers. 

Preventing its predictive engines from making blind mathematical assumptions, WOOF integrates the OpenWeatherMap API as a critical contextual variable. Happy Tails Pet Café relies heavily on walk-in customers and physical pet transport, necessitating the ingestion of live weather indicators directly into the Prophet and SARIMAX forecasting models. This context-aware integration allows the dashboard to dynamically adjust staffing visibility and promotional timing recommendations. Severe rain detection, for example, forces the system to mathematically lower foot traffic estimates and recalculate optimal inventory readiness, ensuring recommendations remain grounded in physical reality. 

## **Anomaly Detection and Seasonality via Public Holiday APIs** 

Calendar events and public holidays can introduce volatility into historical sales and service demand data, often appearing as temporary demand anomalies. Recent studies in time-series forecasting emphasize that incorporating calendar-based features is important for capturing seasonal patterns and avoiding the misinterpretation of short-term demand spikes as long-term trends (Bandara et al., 2021). Furthermore, empirical research shows that integrating event-based indicators can improve forecasting accuracy by accounting for irregular demand fluctuations (Wang et al., 2024). In the WOOF system, public holiday data from the Abstract Public Holidays API will be 

92 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

used as an external contextual variable for Prophet and SARIMAX forecasting. By supplying the forecasting models with holiday and calendar-based indicators, WOOF can better distinguish temporary holiday-related demand changes from regular demand patterns. These outputs will support context-aware demand forecasting, inventory readiness, staffing visibility, foot traffic estimation, and promotional timing recommendations for Happy Tails Pet Cafe. 

## **Redis for Scalable Message Queueing and Parallel Processing** 

In modern data-driven architectures, the volume of data extraction and transformation can create performance bottlenecks, especially when multiple platforms send operational data at different speeds and formats. According to Singh and Verma (2022), data engineering tasks such as handling, cleaning, and transforming incoming data can consume a large portion of total processing time in complex analytics frameworks. To address this issue, Redis can be used as a messaging queue and caching framework to support faster, parallel, scalable, and fault-tolerant data processing. By temporarily holding incoming data streams before they are processed, Redis helps prevent backend overload and supports both near-real-time and batch-processing workflows. 

Applying these technical advantages to the WOOF system, integrating Redis allows the centralized NestJS backend to manage the continuous influx of cross-channel data from the POS system, Shopee, TikTok Shop, PetHub, customer review sources, and external APIs. Redis will serve as a message queue that safely holds incoming webhook payloads, API responses, CSV uploads, and operational events before they 

93 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

are passed into the ETL pipeline. This allows WOOF to process data in an organized and fault-tolerant manner, even when multiple sources send data at the same time. After queued data is validated and transformed, raw and semi-structured payloads may be staged in MongoDB, while cleaned analytical records are loaded into the Supabase PostgreSQL warehouse. Through this setup, Redis supports faster dashboard updates, reliable data processing, inventory alerts, forecasting inputs, and owner-reviewable recommendation logs without requiring continuous manual checking of each platform. 

## **Multi-Tier Database Architecture: Staging vs. Integrated Data Layers** 

Instead of treating document-oriented and relational databases as mutually exclusive alternatives, the WOOF system implements a multi-tier data pipeline where MongoDB and PostgreSQL serve highly specialized, complementary roles. 

In the WOOF architecture, MongoDB acts exclusively as the initial Staging Layer. Because the system continuously ingests highly variable, semi-structured API payloads and webhooks from diverse cross-channel sources (TikTok Shop, Shopee, Loyverse POS), the ingestion layer requires a schema-less environment. As evaluated by Carvalho et al. (2023), NoSQL document databases like MongoDB excel in these exact environments, offering the structural flexibility required to capture and store chaotic, fragmented JSON documents rapidly without forcing immediate data typing or relational constraints. MongoDB is therefore utilized strictly to handle the volatility of raw cross-channel ingestion. 

94 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Conversely, PostgreSQL (deployed via Supabase) powers the Integrated Data Layer and the downstream analytical Data Marts. Once the raw, multi-channel data staged in MongoDB undergoes the transformation phase of the ETL pipeline, an obligatory prerequisite for ensuring data quality in analytics (Sarker, 2021), the cleansed and standardized records are loaded into PostgreSQL. At this layer, the rigid, relational structure of SQL becomes essential. PostgreSQL enforces strict data integrity and enables the complex, high-performance table joins required by WOOF’s descriptive, predictive, and prescriptive analytical engines. Ultimately, the technologies do not compete: MongoDB absorbs the chaotic influx of unstructured cross-channel data, while PostgreSQL enforces the structured relational integrity required to generate accurate machine learning forecasts and operational recommendations. 

## **MongoDB for Scalable and Flexible Data Management** 

In modern data-driven architectures, the volume of data extraction and transformation can create performance bottlenecks, especially when multiple platforms send operational data at different speeds and formats. According to Singh and Verma (2022), data engineering tasks such as handling, cleaning, and transforming incoming data can consume a large portion of total processing time in complex analytics frameworks. To address this issue, Redis can be used as a messaging queue and caching framework to support faster, parallel, scalable, and fault-tolerant data processing. By temporarily holding incoming data streams before they are processed, Redis helps prevent backend overload and supports both near-real-time and batch-processing workflows. 

95 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Applying these technical advantages to the WOOF system, integrating Redis allows the centralized NestJS backend to manage the continuous influx of cross-channel data from the POS system, Shopee, TikTok Shop, PetHub, customer review sources, and external APIs. Redis will serve as a message queue that safely holds incoming webhook payloads, API responses, CSV uploads, and operational events before they are passed into the ETL pipeline. This allows WOOF to process data in an organized and fault-tolerant manner, even when multiple sources send data at the same time. After queued data is validated and transformed, raw and semi-structured payloads may be staged in MongoDB, while cleaned analytical records are loaded into the Supabase PostgreSQL warehouse. Through this setup, Redis supports faster dashboard updates, reliable data processing, inventory alerts, forecasting inputs, and owner-reviewable recommendation logs without requiring continuous manual checking of each platform. 

## **Supabase PostgreSQL for SME-Based Analytical Warehousing** 

Small and medium enterprises often require information systems that are cost-efficient, scalable, and manageable without requiring extensive internal IT infrastructure. Al-Sharafi et al. (2023) explained that cloud computing integration can support SMEs by improving flexibility, scalability, cost reduction, and overall business performance. These characteristics are relevant to WOOF because Happy Tails Pet Cafe requires a structured database solution that can support analytics, reporting, forecasting, and recommendation logs while remaining practical for an SME environment. 

96 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

In the WOOF system, Supabase PostgreSQL will be used as the structured analytical warehouse after ETL processing. While MongoDB will serve as the raw data lake and staging layer for webhook payloads, API responses, customer reviews, and CSV uploads, Supabase PostgreSQL will store cleaned and validated fact tables, dimension tables, data marts, campaign logs, feedback records, and model outputs. This relational layer is necessary because WOOF requires consistent cross-channel queries, dashboard-ready datasets, forecasting inputs, inventory monitoring records, sentiment analysis outputs, and owner-reviewable recommendation logs. By using Supabase PostgreSQL as a managed cloud-based database platform, WOOF can maintain reliable analytical structures while reducing the complexity of manually managing database infrastructure, making it suitable for the operational limitations of a small business. 

## **Next.js for Optimized Server-Side Rendering and Performance** 

Delivering a responsive and maintainable web interface for managerial analytics requires a reliable front-end architecture. WOOF utilizes Next.js paired with the React library. According to a recent web architecture study by Vallamsetla (2024), Next.js provides a Server-Side Rendering (SSR) mechanism that helps address the initial loading latency and search engine crawlability limitations commonly associated with traditional Client-Side Rendering (CSR) single-page applications. Vallamsetla (2024) demonstrated that SSR can serve fully rendered HTML documents from the server, improving request handling capacity and reducing the time to first contentful paint. Applying these technical advantages to the WOOF system, Next.js supports the development of a responsive web dashboard for Happy Tails Pet Cafe, allowing the owner and authorized users to access cross-channel sales summaries, forecasting 

97 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

results, inventory alerts, sentiment insights, campaign recommendation drafts, and approval logs with improved loading performance. Consequently, the web interface supports timely decision-making and smoother access to analytics-driven business insights without positioning WOOF as a replacement for PetHub’s customer-facing ordering and booking functions. 

## **NestJS for Scalable and Maintainable Backend Architecture** 

Processing cross-channel operational data and coordinating backend services requires an efficient and structured server-side framework. WOOF utilizes NestJS to power its backend application logic. According to an architectural study on scalable web platforms by Shim et al. (2024), NestJS provides a uniform framework structure consisting of controllers, services, repositories, and modules, making complex backend code easier to understand, maintain, and extend. Shim et al. (2024) demonstrated that integrating a React-based frontend with a TypeScript-driven NestJS backend can produce a responsive interface and a scalable, stable solution for efficient data processing and inference. Applying these technical advantages to the WOOF system, NestJS will organize the system’s backend functions into modular components for data ingestion, API handling, webhook processing, Redis queue coordination, ETL orchestration, authentication, dashboard services, WebSocket updates, forecasting outputs, and recommendation logs. This structure allows the development team to maintain and scale the backend more effectively while supporting cross-channel data processing from the POS system, Shopee, TikTok Shop, PetHub, customer reviews, and external APIs. Consequently, NestJS supports the stability and maintainability of WOOF 

98 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

as a centralized analytics and recommendation activation system for Happy Tails Pet Cafe. 

## **Jest for Unit Testing and Assertion Validation** 

Ensuring the correctness of the WOOF system’s individual software components requires a reliable testing framework that can validate application logic before full system integration. WOOF will utilize Jest as its primary JavaScript and TypeScript testing framework for unit testing and assertion validation. In modern JavaScript application development, testing is essential for verifying whether individual functions, modules, and components behave according to expected results before they are integrated into the larger system. Da Costa’s Testing JavaScript Applications emphasizes the importance of structured JavaScript testing practices, making it relevant to the validation of systems developed using JavaScript-based technologies. 

In the context of the WOOF system, Jest will be used to test isolated backend and frontend logic such as data transformation functions, validation rules, dashboard computations, and helper utilities used by the analytics modules. This is particularly important because WOOF depends on accurate processing of POS records, e-commerce payloads, forecasting results, and inventory-related computations. By using Jest, the proponents can verify whether each function produces the expected output before it becomes part of the larger cross-channel pipeline. This reduces the likelihood of undetected programming errors affecting the dashboard, recommendation engine, or operational alerts. Ultimately, Jest strengthens the dependability of the system by 

99 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

ensuring that core application logic remains accurate, consistent, and testable throughout development. 

## **Supertest for Backend API and HTTP Endpoint Testing** 

Since the WOOF system relies on backend APIs to connect the dashboard, mobile application, databases, and external data sources, validating API behavior is essential to ensure stable communication across system components. WOOF will utilize Supertest as its HTTP testing library for verifying backend routes and API endpoints. Supertest is suitable for testing Node.js-based backend environments because it allows developers to simulate HTTP requests and assert expected responses, including status codes, response bodies, and error-handling behavior. 

In the context of the WOOF system, Supertest will be applied to test API endpoints responsible for receiving webhook payloads, retrieving dashboard data, processing inventory updates, handling authentication requests, managing PetHub-related records, and storing system-generated recommendation logs. This is particularly important because WOOF depends on accurate data exchange between the physical POS system, Shopee, TikTok Shop, PetHub, MongoDB staging, the Supabase PostgreSQL analytical warehouse, the dashboard, and the mobile operations interface. Salutt and Thirunavukkarasu (2024) emphasized that APIs are central to modern software systems because they enable communication and data exchange between different platforms; however, they also become vulnerable when authentication, data exposure, logging, and error-handling mechanisms are poorly implemented. Their discussion supports the need to validate API behavior before deployment, especially for systems that process operational, transactional, and recommendation-related data. 

100 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

By integrating Supertest into the development workflow, the proponents can detect faulty routes, malformed responses, incorrect request handling, failed webhook ingestion, and backend communication errors before the system is deployed. This strengthens the reliability of WOOF as a centralized cross-channel analytics and recommendation activation system by ensuring that API endpoints remain functional, consistent, and secure enough to support data ingestion, dashboard updates, mobile notifications, forecasting workflows, and owner-reviewable decision-support operations. 

## **Apache JMeter for Load, Stress, and Performance Testing** 

Beyond functional correctness, the WOOF system must also be evaluated based on its ability to remain stable under high-volume data activity and concurrent user interaction. Apache JMeter will be used as the primary performance testing tool for conducting load testing, stress testing, and response-time evaluation. Raweyai and Widiasari (2024) used Apache JMeter to evaluate website performance under normal, peak, and stress usage conditions by measuring response time, failed responses, user threads, and system behavior under heavy load. Their study supports the relevance of JMeter as a performance testing tool for determining whether a web-based system can maintain acceptable response times and operational stability during varying levels of user activity. 

In the context of WOOF, JMeter will be used to simulate high-traffic scenarios such as multiple webhook events arriving from Shopee, TikTok Shop, and PetHub, simultaneous dashboard requests, backend API calls, Redis queue activity, and concurrent use of the Next.js web dashboard and Expo React Native mobile operations 

101 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

interface by authorized users. This directly supports the system’s need to validate whether the backend can sustain cross-channel data ingestion and dashboard responsiveness during peak operational periods, particularly when online orders, physical POS transactions, PetHub bookings, review updates, and dashboard queries occur at the same time. Through this performance testing layer, the proponents can measure latency, throughput, error rates, and server stability, ensuring that WOOF can maintain acceptable response times and prevent service interruptions during high-demand business conditions. 

## **Synthesis of Related Technologies** 

The reviewed technologies support the technical feasibility of WOOF as a cross-channel analytics and recommendation activation system. Expo React Native supports mobile access for staff operations, while Next.js and NestJS support the web dashboard and backend services needed for data ingestion, API handling, authentication, forecasting outputs, and recommendation logs. Webhooks, WebSockets, and Redis support timely data synchronization, event queueing, and responsive updates across POS, Shopee, TikTok Shop, PetHub, customer reviews, and external APIs. 

The reviewed database and external API technologies also support WOOF’s analytics workflow. MongoDB serves as the staging layer for semi-structured webhook payloads, API responses, reviews, and CSV uploads, while Supabase PostgreSQL provides the structured warehouse and data marts needed for descriptive analytics, predictive forecasting, and prescriptive recommendations. OpenWeatherMap and public holiday APIs provide contextual variables for Prophet and SARIMAX forecasting, 

102 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

allowing the system to account for weather, holidays, and seasonality in demand, sales, booking, and foot traffic predictions. 

Finally, the reviewed testing technologies support system reliability before deployment. Jest validates isolated application logic, Supertest verifies backend API behavior, and Apache JMeter evaluates system performance under concurrent requests and high-volume data activity. Together, these technologies are not included merely as a modern software stack; they directly support WOOF’s end-to-end workflow from cross-channel data ingestion, ETL processing, analytics generation, recommendation creation, owner approval, and PetHub-ready campaign activation. 

## **2.6 Synthesis** 

The literature, studies, analytical models, related systems, and technologies reviewed in this chapter collectively identify a clear gap in SME business analytics implementation. Existing literature supports the importance of descriptive analytics, cross-channel data integration, predictive forecasting, prescriptive analytics, and human-governed AI-assisted decision-support. Existing studies also validate the usefulness of context-aware forecasting, Market Basket Analysis, sentiment analysis, centralized analytics environments, and AI-assisted campaign preparation. However, these works often discuss the components separately and are commonly framed for broader retail, logistics, or e-commerce settings rather than for a localized multi-sector pet cafe SME with fragmented physical and digital operations. 

This gap is directly reflected in Happy Tails Pet Cafe’s current condition. The Lucena branch does not only need a dashboard, a POS enhancement, or a forecasting model. It needs 

103 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

an integrated cross-channel analytics workflow that can consolidate POS, Shopee, TikTok Shop, PetHub, inventory, customer review, weather, holiday, booking, and campaign-related data; analyze customer behavior and demand patterns; generate owner-reviewable recommendations; and prepare approved recommendations into PetHub-ready customer-facing outputs. WOOF addresses this gap by combining descriptive, predictive, and prescriptive analytics within a centralized SME-appropriate recommendation activation system. 

The reviewed algorithms provide the analytical foundation for this workflow. FP-Growth supports association-rule cross-selling and bundle discovery, Prophet and SARIMAX support context-aware demand, sales, booking, and foot traffic forecasting, sentiment analysis and topic modeling support customer feedback interpretation, EOQ and threshold rules support inventory recommendations, and optimization models support service and resource planning. Meanwhile, the selected technologies provide the implementation foundation needed to make these analytics usable in actual operations through dashboards, mobile access, near real-time synchronization, backend processing, activation logs, owner approval workflows, and system testing. 

Therefore, Chapter 2 establishes that WOOF is not merely a collection of unrelated technologies, algorithms, or system features. It is a localized cross-channel analytics and recommendation activation system designed to fill the gap between fragmented operational data, analytics-based insight generation, owner-approved decision-making, and PetHub-based customer-facing activation for Happy Tails Pet Cafe. 

104 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **Chapter 3** 

This chapter presents the research and technical methodology that will be utilized to develop Workflow Orchestration, Optimization, and Forecasting (WOOF). It details the processes of data extraction from physical Point-of-Sale (POS) terminals and e-commerce platforms, the integration of these streams into a cross-channel data warehouse, and the analysis of five years of transactional records. The chapter also outlines the analytical tools and models that will be employed for tracking key performance indicators, developing predictive demand analytics, and creating a prescriptive dashboard. By adopting a structured and data-driven approach, this methodology will provide a solid foundation for generating actionable insights to optimize multi-sector workflows and ensure operational equilibrium across all 

105 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

business channels. 

## **3.1 Development Methodology** 

The proponents will utilize a hybrid framework combining the Cross-Industry Standard Process for Data Mining (CRISP-DM) and Agile Methodology to systematically execute the development of the WOOF system. While Agile governs the team's collaboration, iterative software development, and the delivery of the system interface, CRISP-DM provides the specialized technical workflow required for the data engineering and machine learning components. 

By integrating these frameworks, CRISP-DM will guide the analytics work (data preparation, modeling, and evaluation), while Agile will manage the concurrent development and delivery of the dashboard and application features. 

106 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **3.1.1 The CRISP-DM Framework** 

For the analytical foundation of the system, this iterative approach includes six main stages: (1) understanding the business context and operational pain points of the Lucena branch, (2) exploring and understanding five years of historical data from the POS and the data from the e-commerce, (3) preparing and transforming siloed datasets through ETL processes into a unified warehouse, (4) building analytical models for forecasting and behavioral analysis, (5) assessing model performance through technical error metrics and review vetting, and (6) implementing the final solution via a prescriptive executive dashboard. 

**==> picture [227 x 35] intentionally omitted <==**

**----- Start of picture text -----**<br>
.A & \- o<br>F<br>Figure 3.1 CRISP-DM Process of Data Mining<br>**----- End of picture text -----**<br>


## **3.1.2 Agile Integration and Cadence Mapping** 

To ensure that the predictive models and the system architecture will be developed cohesively, the CRISP-DM phases will be embedded within Agile development cadences. The team utilizes Kanban’s flexible workflow to continuously manage tasks. If iterative testing during 

107 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

the CRISP-DM lifecycle requires the team to revisit a previous phase, such as returning to Data Preparation after discovering missing variables during the Modeling phase, these adjustments are aggressively locked into the In Progress column or the Product Backlog based on real-time developer workload and immediate priority, rather than waiting for a formal backlog grooming ceremony. 

For instance, during the first development cadence focusing on the system's initial data extraction via APIs, the proponents will utilize Kanban practices to build the connection endpoints, while concurrently executing the "Data Understanding" phase of CRISP-DM to explore the five years of longitudinal data from the POS and e-commerce platforms. The alignment and adjustments for these workflows are governed by regular team cadences, which are dynamically scheduled based on the stability or predictability of the development phase. 

|**KANBAN**<br>**CADENCE**|**CRISP-DM**<br>**PHASE**|**ANALYTICS FOCUS**|**SYSTEM FOCUS**|**OUTPUT**|
|---|---|---|---|---|
|Cadence<br>1:<br>Requirements<br>&<br>Architecture Setup|1:<br>&<br>Architecture Setup<br>Business & Data<br>Understanding|Business & Data<br>Understanding<br>the<br>business<br>context,<br>exploring the five years<br>of historical data strictly<br>from the physical POS,<br>and<br>analyzing<br>recent<br>data<br>streams<br>from<br>e-commerce platforms.|the<br>exploring the five years<br>of historical data strictly<br>from the physical POS,<br>Setting<br>up<br>the<br>technology stack,<br>designing<br>database<br>schemas,<br>and<br>creating<br>initial<br>UI/UX mockups.|the<br>initial<br>Defined<br>system<br>architecture,<br>Exploratory Data<br>Analysis<br>(EDA)<br>Report, and initial<br>UI wireframes.|



108 

## **UNIVERSITY OF SANTO TOMAS** 

## **COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

|Cadence 2: Data<br>Engineering & API<br>Integration|Cadence 2: Data<br>Engineering & API<br>Data<br>Preparation|Preparing<br>and<br>transforming the 5-year<br>historical POS dataset<br>and the live e-commerce<br>streams<br>through<br>ETL<br>processes into a unified<br>warehouse.|transforming the 5-year<br>and the live e-commerce<br>ETL<br>processes into a unified<br>Building webhook<br>connections,<br>setting<br>up<br>API<br>polling,<br>and<br>establishing<br>the<br>NestJS backend<br>infrastructure.|Building webhook<br>and<br>the<br>NestJS backend<br>Functional<br>API<br>endpoints,<br>automated<br>data<br>pipelines, and a<br>cleaned,<br>standardized<br>dataset.|
|---|---|---|---|---|
|Cadence 3: Core<br>Logic & Backend<br>Development|Cadence 3: Core<br>Logic & Backend<br>Modeling|Building<br>analytical<br>models for forecasting<br>and behavioral analysis.|analytical<br>Developing<br>background<br>processes<br>and<br>integrating<br>the<br>machine learning<br>models into the<br>system backend.|and<br>the<br>machine learning<br>models into the<br>Trained<br>time-series<br>forecasting<br>models<br>(Prophet/SARIM<br>AX),<br>Market<br>Basket Analysis<br>(FP-Growth)<br>scripts, and core<br>backend logic.|
|Cadence<br>4:<br>Dashboard<br>Development<br>&<br>Testing|4:<br>&<br>Evaluation|Assessing<br>model<br>performance<br>through<br>technical error metrics<br>and review vetting.|model<br>Building<br>the<br>React/Next.js<br>dashboard<br>components and<br>conducting<br>Unit<br>and Stress tests.|the<br>components and<br>Model evaluation<br>results<br>(MAPE/RMSE<br>metrics),<br>tested<br>UI<br>components,<br>and<br>sentiment<br>analysis<br>vetting<br>reports.|
|Cadence 5: Final<br>Integration & UAT|Cadence 5: Final<br>Deployment|Finalizing the algorithm<br>triggers and monitoring<br>live cross-channel data<br>flows.|Finalizing the algorithm<br>triggers and monitoring<br>live cross-channel data<br>Implementing the<br>final solution via a<br>prescriptive<br>executive<br>dashboard<br>and<br>executing<br>User<br>Acceptance<br>Testing.|Implementing the<br>final solution via a<br>and<br>User<br>The<br>fully<br>deployed WOOF<br>cross-channel<br>system,<br>integrated<br>dashboard<br>modules,<br>and<br>final<br>user<br>documentation.|



109 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Table 3.1.1 illustrates the specific mapping between the Agile system development lifecycle and the CRISP-DM analytics phases. 

## **3.2 Business Process** 

This section establishes the fundamental comparative framework between the legacy operational workflows and the proposed WOOF system architecture. By utilizing a systemic transition from manual, reactive methodologies toward a system-assisted Intelligent Decision Support System (IDSS), the Business Process section provides an analytical overview of the enterprise’s functional evolution. The swimlane diagrams map the personas’ responsibilities and procedural handoffs within both the fragmented current state and the system-assisted proposed environment. To delineate the precise resolution of current operational bottlenecks, the study employs cross-functional swimlane diagrams (3.2.1.1) that visually map the personas’ responsibilities and procedural handoffs within both the fragmented current state and the automated proposed environment. Furthermore, this architectural mapping is reinforced by structural Data Flow Diagrams (3.2.1.2) that trace the lifecycle and transformation of cross-channel data. By contrasting isolated platform repositories with a unified, near real-time data pipeline, this section defines the technical milestones required to achieve operational equilibrium and actionable executive intelligence. 

## **3.2.1 Comparison of Existing and Proposed Business Processes** 

The transition from the existing operational framework to the proposed WOOF system represents a fundamental architectural shift from a manual, retroactive business model to a 

110 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

system-assisted, proactive Intelligent Decision Support System (IDSS). The existing setup is heavily constrained by modal fragmentation; staff members are forced to act as data processors, manually checking disparate platforms and maintaining offline paper logs for critical services and inventory. This lack of integration isolates the management, forcing executive decisions to rely on delayed intuition and guesswork. 

In contrast, the proposed architecture will eliminate these manual administrative bottlenecks by introducing a seamless, automated data pipeline. Driven by NestJS Task Scheduler, the system will actively ingest multi-platform data, process it through a robust NestJS ETL backend, and apply advanced Machine Learning analytics to deliver near real-time, prescriptive intelligence directly to a unified workforce. 

To clearly illustrate the resolution of the current operational bottlenecks, Tables 3.2.1.1 and 3.2.1.2 will outline the direct comparative differences between the manual current operations and the automated proposed architecture. 

111 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **3.2.1.1 Process Maps** 

## **3.2.1.1.1 Existing Business Process/es** 

_Figure 3.2.1.1.1 Current Business Process Diagram_ 

The current operational architecture of the Happy Tails Pet Cafe enterprise is characterized by modal fragmentation and a heavy reliance on manual administrative labor. To illustrate the exact bottlenecks constraining the business, the cross-functional flowchart above maps the existing workflow. By categorizing the operations into four distinct lanes, the visualization demonstrates how the lack of system integration forces staff and management to bridge digital and physical data silos manually, resulting in a highly retroactive decision-making process. 

## **Customer Lane** 

The business process begins organically with the customer. They initiate their journey either by visiting the physical retail store/cafe or by browsing the digital 

112 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

storefronts. This immediate split between physical and digital actions dictates the subsequent operational flow, creating the initial point of data fragmentation. 

## **External Channels & Sources Lane** 

Because the enterprise lacks a unified data pipeline, the platforms in this lane operate strictly as isolated repositories. Digital orders are captured separately within Shopee, TikTok Shop, and Pethub, while physical transactions are recorded in the Loyverse POS System. Crucially, there is no automated communication between these channels; the data remains trapped within its respective vendor platform until a human intervenes. 

## **Staff (Floor Operations & Manual Record Keeping)** 

This lane highlights the core administrative bottleneck of the existing framework. Instead of focusing entirely on floor operations, the staff acts as manual data processors. For physical visits, the staff interacts with the customer and evaluates the transaction: if a product is bought, it is tracked via the POS; if a service is rendered, it will be logged in the POS and staff updates service schedules manually. Concurrently, for digital sales, staff must individually check digital orders via the e-commerce sites. To bridge these isolated channels, staff are forced to manually track and write down physical inventory counts. This continuous cycle of manual checking and listing of records is highly susceptible to human error. Ultimately, the staff compiles these fragmented pieces of information and manually reports the results to the manager/owner. 

## **Cafe Owner (Retroactive Analytics & Strategy)** 

113 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

The culmination of this fragmented workflow places the management in a strictly retroactive position. Upon receiving the staff's report, the manager must attempt to analyze past performance by cross-referencing disconnected digital outputs with the staff's manually written records. As depicted in the decision flow, the manager evaluates if an action should be driven by this data. However, because there is no integrated analytics engine in place, the owner is forced to rely on an "Intuition and Guesswork Strategy". Consequently, any business action taken is a delayed, reactive response rather than a proactive, data-driven operational strategy before the workflow officially ends. 

## **3.2.1.1.2 Proposed Business Process/es** 

## **Proposed Business Process/es Narrative** 

The proposed WOOF (Workflow Orchestration, Optimization, and Forecasting) operational framework transforms the enterprise from a manual, fragmented operation into a fully automated, closed-loop Intelligent Decision Support System (IDSS). The lifecycle is triggered organically by customer transactions across the physical branch and digital storefronts (Shopee, TikTok Shop, and PetHub), which act as active data 

touchpoints. This cross-channel transactional data, alongside contextual external APIs, is automatically ingested, queued, and processed through a robust backend ETL pipeline. The centralized data then fuels the WOOF Analytics Engines to generate descriptive, predictive, and prescriptive insights. 

Crucially, the system features a branched execution model. For the native 

PetHub platform, WOOF functions as an automated deployment engine, directly pushing 

114 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

stock updates, bundles, and promotional announcements only after they are explicitly approved by the owner. Conversely, for external channels like Shopee, TikTok Shop, and the physical POS, the system serves strictly as an advanced decision-support tool, requiring the owner to manually execute the recommended campaigns. As the sole digital gatekeeper, the Cafe Owner reviews these intelligence outputs on a centralized dashboard, governs all strategic digital interventions, and delegates the approved physical operational actions down to the staff. Relieved of all digital navigation, the staff strictly handles offline floor execution. The workflow completes its lifecycle when the owner logs the staff's tangible execution results back into the system, creating a continuous machine-learning feedback loop that recalibrates the underlying predictive models based on actual business outcomes. 

## **User Roles & Responsibilities** 

|**Role**|**Modules Accessed**|**Permissions**<br>**(CRUD)**|**Key**<br>**Responsibiliti**<br>**es & Actions**|**Authentication**|
|---|---|---|---|---|
|Custome<br>r|**None** _(End-User of_<br>_Storefronts)_|**None**_(Generates_<br>_external triggers only)_|- Initiates the<br>data pipeline by<br>organically<br>completing<br>transactions,<br>booking<br>services, or<br>making<br>purchases.<br>- Interacts<br>seamlessly<br>across the<br>physical store<br>or digital<br>channels<br>(Shopee,|**None (WOOF**<br>**System)**<br>_(Customers log_<br>_in via_<br>_third-party_<br>_storefronts like_<br>_Shopee,_<br>_TikTok, or_<br>_PetHub using_<br>_their respective_<br>_consumer_<br>_accounts)_|



115 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

||||TikTok Shop,<br>PetHub).<br>- Leaves public<br>reviews that act<br>as external<br>data triggers for<br>sentiment<br>analysis.||
|---|---|---|---|---|
|WOOF<br>Automate<br>d System|**Backend**<br>**Infrastructure**|**Create, Read,**<br>**Update, & Delete**<br>**(**_Automated Backend_<br>_Execution)_|- Automatically<br>extracts raw<br>cross-channel<br>and contextual<br>data via<br>Webhooks and<br>REST APIs.<br>- Orchestrates<br>tasks, queues<br>data streams,<br>and executes<br>the ETL<br>(Extract,<br>Transform,<br>Load)<br>sequence.<br>- Generates<br>Descriptive,<br>Predictive, and<br>Prescriptive<br>analytics via<br>integrated<br>machine<br>learning<br>models.<br>- Direct<br>Automation:<br>Autonomously<br>executes stock<br>updates,<br>discounts, and<br>promotional<br>actions directly<br>onto the<br>PetHub<br>platform once<br>approved by|**System-to-Sys**<br>**tem Auth**<br>_(Utilizes_<br>_Webhook_<br>_Secrets, REST_<br>_API Keys, and_<br>_OAuth Tokens_<br>_to securely_<br>_authenticate_<br>_and extract_<br>_data from_<br>_external_<br>_channels and_<br>_APIs)_|



116 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

||||the cafe owner.<br>- Ingests<br>logged<br>performance<br>results to<br>continuously<br>monitor drift<br>and retrain<br>models.||
|---|---|---|---|---|
|Cafe<br>Owner|**Full System Access**<br>_(Sole Gatekeeper)_|**Create, Read,**<br>**Update, & Delete**<br>_(Frontend Dashboard_<br>_Management)_|- Logs securely<br>into the WOOF<br>Dashboard to<br>review<br>centralized<br>cross-channel<br>metrics.<br>- Receives<br>automated<br>alerts (spoilage<br>warnings, stock<br>alerts, demand<br>spikes).<br>- Acts as the<br>central<br>decision-maker<br>by analyzing,<br>approving,<br>modifying, or<br>rejecting<br>AI-generated<br>recommendatio<br>ns.<br>- Manually<br>executes<br>data-driven<br>strategies for<br>non-automated<br>external<br>channels<br>(Shopee/TikTok<br>).<br>- Assigns<br>approved<br>operational<br>directives|**Email +**<br>**Password +**<br>**OTP**|



117 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

||||directly to the<br>staff.<br>- Logs the final,<br>real-world<br>execution<br>results back<br>into the system<br>to close the<br>feedback loop.||
|---|---|---|---|---|
|Staff|**None**_(Physical Floor_<br>_Execution)_|**None**|- Receives<br>operational<br>directives and<br>task<br>assignments<br>strictly from the<br>Cafe Owner.<br>- Executes<br>approved<br>data-driven<br>strategies and<br>physical tasks<br>on the cafe<br>floor.<br>- Measures and<br>reports the<br>tangible<br>outcomes of<br>these<br>operational<br>actions back to<br>the owner.||



_Table 3.2.1.1.2 User Roles & Responsibilities Table_ 

118 =>are’ | 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## _Figure 3.2.1.1.2 Proposed Business Process/es Diagram_ 

The proposed WOOF (Workflow Orchestration, Optimization, and Forecasting) operational framework dictates a systemic transition from fragmented, manual data consolidation to a fully automated Intelligent Decision Support System (IDSS). As visualized in the newly simplified diagram, the complete cross-channel data lifecycle is categorized into five distinct operational lanes, establishing clear boundaries between customer actions, automated data engineering, strategic management, and physical floor operations. 

## **Customer Lane** 

The operational flow begins with the customer, whose actual purchasing behavior remains organic and unchanged. They initiate a transaction either by visiting the physical Happy Tails Pet Cafe branch or by browsing the digital storefronts via Shopee, TikTok Shop, and Pethub. If a transaction occurs, this interaction immediately acts as an active trigger, passing data to the external channels. 

## **External Channels & Sources (Data Touchpoints)** 

This tier functions as the system's data collection boundary. On the transactional front, activities recorded through the Loyverse POS system, the Shopee and TikTok Shop Seller Centers, and PetHub will instantly emit Webhook or REST API triggers for data extraction. Concurrently, Customer Reviews from Shopee and TikTok, alongside External Context APIs providing weather, season, and holiday data, will be ingested. This dual mechanism establishes a continuous, automated flow of both transactional sales and contextual payloads into the backend. 

119 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **WOOF Automated System (Backend Logic & Engineering)** 

Positioned as the core technical infrastructure, this lane handles data processing 

and advanced analytics orchestration: 

## **Data Ingestion & Processing** 

The system fetches and ingests the raw data, followed by a strict validation phase. Once validated, the system cleans, consolidates, and records the information to update the unified Sales/Inventory/Customer/Product Dataset. 

## **Analytics Generation** 

Using this refined dataset, the system generates Descriptive, Predictive, and Prescriptive business insights and prepares them for display on the WOOF Dashboard. 

## **Security & Authentication** 

To protect the dashboard, the backend manages a high-security login flow. It checks if the entered login credentials are valid, sends an OTP (One-Time Password) to the registered email, and verifies if the entered OTP is correct before granting access. 

## **PetHub Automation** 

Crucially, once strategies are approved by the owner, this lane autonomously executes those directives by directly reflecting the operational changes into the PetHub system. 

## **Distribution** 

120 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Finally, the generated business intelligence and operational data will be routed through an API Presentation Layer. This gateway will utilize WebSockets for near real-time synchronization and REST API endpoints to distribute data seamlessly to the frontend applications. 

## **Cafe Owner (Execution, Strategy, and Feedback)** 

The Cafe Owner acts as the sole operator and gatekeeper of the digital ecosystem. Their workflow begins by inputting login credentials, receiving the email OTP, and entering the code to gain system access. Once authenticated, the owner views the dashboard to review the generated insights. Acting as the central decision-maker, the owner evaluates these suggestions and chooses to approve, modify, or reject them. 

From here, the owner executes two distinct actions: they assign the approved physical operational actions down to the staff, and they explicitly approve/execute data-driven promos and strategies specifically for PetHub. Once the staff completes their tasks, the owner logs the real-world results and provides qualitative feedback on whether the system's recommendations were helpful or not, officially ending their workflow. 

## **Staff (Floor Operations)** 

Relieved entirely from system navigation and digital dashboard management, the staff workflow is strictly operational. They do not possess login access to the WOOF Dashboard. Instead, they begin their workflow by executing the approved operational actions assigned to them by the Cafe Owner on the physical floor. Once the assigned 

121 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

tasks are completed, the staff reports the results of those actions directly back to the 

owner. 

## **Machine Learning Feedback Loop** 

The entire framework concludes with a closed-loop recalibration mechanism. The results and qualitative feedback logged by the Cafe Owner are routed directly into the backend (Supabase). The system ingests and processes this real-world performance data to retrain its models, ensuring the underlying algorithms continuously adapt to actual business outcomes. 

_Figure 3.2.1.1.2.1 WOOF Authentication Diagram_ 

The WOOF Authentication Diagram illustrates the secure, multi-step verification process required for the Cafe Owner to access the digital ecosystem. Because the owner acts as the sole gatekeeper with full CRUD capabilities, the system enforces a strict Multi-Factor Authentication (MFA) protocol, splitting the workflow between the user's manual inputs and the backend's automated validation logic. In the standard login flow, the process begins with the Cafe Owner entering their registered user credentials on the login screen, which the WOOF 

122 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Automated System then evaluates for validity. If incorrect, the system loops the user back to the credential entry step; however, if the credentials are valid, the backend automatically generates and sends a One-Time Password (OTP) to the owner's registered email address. The owner retrieves and inputs this code into the system, prompting a final backend validation check. An invalid OTP prompts the user to re-enter it, whereas a correct OTP grants full access, officially logging the owner into the system and concluding the primary authentication workflow. Alternatively, if the owner cannot access their account, they can initiate the password recovery flow by clicking "Forget Password" from the start screen. This action bypasses the standard credential check and immediately triggers the system to send a dedicated Reset Password OTP to the owner's email. The owner enters this reset code, and upon successful validation by the system, is prompted to enter a new password. The backend captures this input, updates the database to reflect the new security credentials, and finally loops the user back to the initial user credential entry stage so they can securely log in using their newly established password. 

123 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.2.1.1.2.2 WOOF Analytics Decision-Support Diagram_ 

The Analytics Decision-Support Diagram outlines the data-driven workflow between the WOOF Automated System, the Cafe Owner, and the Staff. The process begins within the WOOF Automated System's Database, which houses historical and live sales, inventory, customer, and product data. The system processes this raw information to generate integrated Descriptive, Predictive, and Prescriptive Analytics. These insights are pushed to the Cafe Owner, who starts their workflow by reviewing the system-generated suggestions and choosing to approve, modify, or reject them. From there, the owner's actions split into two main pathways. For physical operations, the owner provides the approved operational actions down to the Staff, who receive the instructions, execute them, and report the tangible results back to the owner before their workflow ends. Concurrently, for digital operations, the owner can approve and execute data-driven promos and strategies specifically for PetHub, which triggers the WOOF Automated System to automatically reflect those operational changes directly into the PetHub system. To close the loop, the cafe owner logs the final physical execution results reported by the staff back into the digital system. This feeds directly into the backend, where the system 

124 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

ingests and processes the data to retrain its models, ensuring continuous optimization before the entire process concludes. 

_Figure 3.2.1.1.2.3 WOOF Descriptive Analytics Diagram_ 

The WOOF Descriptive Analytics Diagram illustrates the journey of raw cross-channel transaction data transforming into role-specific operational insights. The descriptive analytics engine actively processes this data to generate four core features: Sales & Revenue Trends, a KPI Dashboard, Inventory Levels, and Natural Language Querying (NL2SQL), which are transmitted through an API Presentation Layer directly to the WOOF Dashboard. 

Acting as the sole administrator of the digital ecosystem, the Cafe Owner logs in to access these descriptive insights, leveraging the data for high-level management tasks such as live financial monitoring, tracking platform performance, and conducting deep-dive merchandising analysis to prevent digital stock-outs. From here, the owner's workflow splits into digital automation and physical delegation. For digital operations, the owner evaluates and 

125 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

approves the execution of data-driven promos and operational strategies specifically for PetHub; once approved, the WOOF Automated System autonomously executes these targeted interventions and reflects the changes directly into the PetHub platform itself. 

Concurrently, to drive immediate physical operations, the owner assigns approved operational directives down to the staff. Operating entirely without digital system access, the staff executes these delegated tasks on the cafe floor, applying the owner's guidance for shift performance adjustments, fulfillment queue management, and accurate pick-and-pack execution. Ultimately, the staff reports the tangible results of their actions back to the owner. To finalize the process, the cafe owner logs these real-world outcomes into the system, allowing the backend to ingest and process the feedback to continuously retrain its analytical models before the workflow concludes. 

_Figure 3.2.1.1.2.4 WOOF Predictive Analytics Diagram_ 

The WOOF Predictive Analytics Workflow illustrates how centralized data from the Supabase’s Data Mart is leveraged to forecast future operational conditions and drive proactive decision-making. The WOOF Automated System processes this integrated data to generate 

126 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

predictive business insights, specifically displaying five core forecasting categories on the dashboard: Demand Forecasting, Foot Traffic, Inventory Spoilage, Market Basket Analysis, and Sentiment Analysis. Crucially, the Inventory Spoilage predictions proactively flag slow-moving items and high-spoilage liabilities, which directly inform the owner’s authorization of targeted 'algorithmic cross-selling' through smart bundling and 'digital flash sales' via dynamic promotions to mitigate inventory risk. 

Acting as the sole digital administrator, the Cafe Owner begins their workflow by viewing and analyzing these predictive recommendations. The owner utilizes these forecasts for high-level strategic planning, such as performing restocking based on demand prediction, constructing optimized employee schedules, authorizing targeted "Happy Hours," deploying digital flash sales or markdowns for at-risk inventory, executing algorithmic cross-selling to move stagnant stock, and performing quality control based on sentiment trends. After reviewing, the owner may approve, modify, or reject these system-generated suggestions. From here, the execution splits: for digital channels, the WOOF Automated System autonomously reflects the approved operational changes directly into the PetHub system. 

Concurrently, to translate these insights into physical readiness, the owner assigns the approved operational actions down to the staff. Operating strictly without dashboard access, the staff executes these delegated tasks on the floor, applying the strategies to prepare stations, perform guided FIFO packing, execute verbal upselling, optimize the backroom layout, and perform immediate fulfillment adjustments. After executing these proactive measures, the staff reports the tangible results back to the owner. Finally, the owner logs these real-world outcomes into the system, allowing the backend to ingest and process the integrated data to continuously retrain its predictive models before the workflow concludes. 

127 

## é& q%,3 **UNIVERSITY OF SANTO TOMAS** 2=< -& —2[a] xe) 5[=] **COLLEGE OF INFORMATION AND COMPUTING SCIENCES** %No KS< **Information Systems Department** 

_Figure 3.2.1.1.2.5 WOOF Prescriptive Analytics Diagram_ 

The WOOF Prescriptive Analytics Workflow maps the journey of turning integrated data from the backend Data Mart into automated, role-specific operational directives. The WOOF Automated System processes this data to generate four core actionable outputs: Promotions Displays, Bundling, Restocking, and Staffing recommendations. These 'Promotions Displays' and 'Bundling' outputs are the primary strategies designed to resolve the liabilities identified in the predictive phase, especially concerning slow-moving or perishable items. 

Acting as the exclusive operator of the digital system, the Cafe Owner starts their workflow by viewing and analyzing these prescriptive insights on the WOOF Dashboard. The owner utilizes these prescriptions for high-level oversight, performing one-click strategy approvals for promotions and markdowns, evaluating strategic "add-on" creations for bundles, managing just-in-time procurement for restocking, and implementing data-driven digital scheduling. The owner's review confirms the application of this dual strategy, smart bundling and markdowns, as a core mechanism for inventory optimization. After evaluating the 

128 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

suggestions, the owner may approve, modify, or reject them. From here, the execution splits into two distinct pathways. For digital automation, the WOOF Automated System autonomously reflects the approved operational changes directly into the PetHub platform. 

Concurrently, to drive immediate physical operations, the owner assigns the approved operational actions down to the staff. Completely removed from dashboard management, the staff translates these directives into physical execution by handling targeted floor promotions, performing guided upselling, pre-packing high-probability bundles, executing tactical floor replenishment via backroom stock allocation, and implementing dynamic role and task shifting. After executing these interventions, the staff reports the tangible results of their actions back to the cafe owner. Finally, the owner logs these real-world outcomes into the system, enabling the backend to ingest and process the integrated data to continuously retrain its models before the workflow concludes. 

## **3.2.1.2 Data Flow Diagrams** 

The Data Flow Diagrams provide a logical visualization of the movement, transformation, and storage of information within the study's scope. By mapping the data trajectories, these diagrams highlight the critical transition from the current manual and fragmented state to the proposed autonomous architecture. This section begins by documenting the Existing System, which characterizes the siloed nature of the current operations, and subsequently presents the Proposed System, detailing the integrated, dual-pipeline flow that fuels the three-tiered Analytics Engine. Through this logical decomposition, the system’s ability to synchronize physical storefront metrics with digital e-commerce events is rendered transparent and defensible. 

129 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **3.2.1.2.1 Existing System/s** 

_Figure 3.2.1.2.1 Existing System Data Flow Diagram_ 

Figure 3.2.1.2.1 illustrates the existing system data flow of Happy Tails Pet Cafe, where customer activity is processed and stored separately across the POS system, TikTok Shop, Shopee, and PetHub. The diagram shows that in-store transactions are processed through the POS system, online orders are managed through TikTok Shop and Shopee, and bookings or order-related records are handled through PetHub. Each platform maintains its own processing function and database, resulting in separate POS, TikTok, Shopee, and PetHub records. Because these systems are not connected to a centralized analytics environment, the owner must manually check and compare reports from each platform to monitor sales, bookings, inventory movement, and customer activity. This fragmented data flow increases the risk of delays, inconsistent records, and limited visibility into overall business performance. The current setup highlights the need for WOOF as a centralized cross-channel analytics and 

130 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

recommendation activation system that can consolidate these separate data sources into an analytics-ready environment. 

## **3.2.1.2.2 Proposed System** 

**==> picture [26 x 10] intentionally omitted <==**

**----- Start of picture text -----**<br>
—<br>**----- End of picture text -----**<br>


_Figure 3.2.1.2.2 Proposed System Data Flow Diagram_ 

Figure 3.2.1.2.2 illustrates the proposed system Data Flow Diagram of the WOOF system, showing how data from multiple operational sources, including the POS system, Shopee, TikTok Shop, PetHub, customer reviews, inventory records, service records, and external APIs, will be collected through the system’s ingestion layer. These records will be extracted through webhook-based near real-time ingestion, API-based extraction, and CSV or Excel batch uploads before being temporarily queued, staged, and stored in the raw data storage layer. 

After extraction, the data will undergo ETL processing, which includes data cleaning, validation, integration, transformation, and feature engineering to ensure that 

131 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

records are complete, consistent, standardized, and ready for analysis. Raw and semi-structured source records, especially API payloads, webhook events, and uploaded files, will be preserved in MongoDB staging collections for auditability, traceability, and possible reprocessing. Once validated and transformed, the cleaned analytical datasets will be loaded into the PostgreSQL analytical warehouse. 

The PostgreSQL analytical warehouse will organize processed data using structured fact tables, dimension tables, and dedicated data marts for sales, inventory, customer behavior, service demand, feedback, campaign activity, and model outputs. This architecture ensures that MongoDB functions as the flexible staging environment for raw and semi-structured records, while PostgreSQL serves as the structured analytical layer for reporting, forecasting, recommendation generation, and dashboard queries. 

The analytics layer will process the integrated warehouse data through descriptive, predictive, and prescriptive analytics engines. These engines will generate sales trends, inventory insights, demand and foot traffic forecasts, market basket results, sentiment analysis outputs, restocking suggestions, promotional alerts, and bundle recommendations. The results will be delivered through the WOOF dashboard and AI assistant, where the business owner can review the insights and approve, modify, reject, or schedule recommended actions. 

Once approved, selected promotions, bundle campaigns, and announcement drafts may be pushed to PetHub through the PetHub Recommendation Activation Layer. Actions for external platforms and physical store operations will remain subject to owner or staff execution and will not be automatically performed by the system. The system will 

132 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

also store recommendation outcomes, campaign activation logs, model outputs, and feedback records to support performance monitoring, model evaluation, and future model retraining. This enables WOOF to provide a human-governed, data-driven decision-support process for cross-channel business operations. 

133 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **3.3 Business Solution** 

The WOOF system will be designed as a centralized framework to connect the fragmented data environments of Happy Tails Pet Café. This capstone project aims to transition the enterprise from intuition-based management to a data-driven cross-channel ecosystem. To address the operational limitations identified at the Lucena branch, the system will provide the following core business solutions: 

## **Purpose-Built Recommendation Activation vs. Generic BI Systems** 

The enterprise currently struggles with translating raw data into immediate, actionable strategies, a bottleneck that generic Business Intelligence (BI) tools cannot fully resolve. While commercial platforms like Microsoft Power BI or Tableau excel at descriptive data visualization, they function strictly as passive dashboards requiring human interpretation to translate graphs into physical operations. To resolve this, WOOF transcends passive analytics by functioning as a purpose-built Recommendation Activation System. Instead of merely displaying data, WOOF automatically orchestrates the backend ETL pipeline, generates algorithmic insights, and features a Human-in-the-Loop (HITL) deployment engine that pushes approved operational changes directly into the PetHub platform. 

134 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Recent research highlights that transitioning from generic descriptive dashboards to domain-specific prescriptive analytics significantly reduces the cognitive load on SME owners and accelerates the data-to-action lifecycle (Zamani et al., 2022). Furthermore, Prescriptive Analytics Systems (PAS) represent the most mature iteration of business analytics because they shift the responsibility of the decision-making process; rather than just showing data, the analytical system takes agency in generating and executing strategic actions (Wissuchek & Zschech, 2024). Ultimately, implementing AI-driven prescriptive analytics allows business decision-makers to move beyond mere forecasting, providing automated frameworks that substantially enhance operational agility and supply chain resilience without requiring the owner to act as a full-time data scientist (Smyth et al., 2024). 

## **Centralized Cross-Channel Data Synchronization** 

In the current operation, sales and inventory data from online retail channels such as Shopee and TikTok Shop are isolated from the physical storefront, leading to delayed reports and fragmented records. To eliminate these data silos, WOOF will integrate data from the physical Point-of-Sale (POS) system and e-commerce platforms utilizing webhooks. By establishing live-ready API and webhook connections between the physical POS and digital marketplaces, the system acts as a centralized cross-channel ingestion pipeline. This allows the business to capture purchasing patterns across multiple independent touchpoints without requiring a fully seamless, bidirectional infrastructure. According to Iglesias-Pradas and Acquila-Natale (2023), navigating the modern retail environment requires businesses to actively bridge the gap 

135 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

between physical and digital channels, as centralizing fragmented data is a fundamental prerequisite for advanced analytics. By consolidating this operational data, WOOF ensures that its core Recommendation Activation System is fed with holistic intelligence, enabling more accurate demand forecasting and algorithmic strategy generation derived from the total scope of the enterprise's operations. 

## **Context-Aware Demand and Resource Forecasting** 

The business frequently experiences an overstock of perishable pet treats during slow periods and staff shortages during peak weekends. To resolve this, WOOF will merge historical sales data with external factors, such as weather forecasts, holidays, and seasonal trends, to accurately predict demand. Integrating environmental indicators into generative artificial intelligence models will produce "context-aware" predictions that will outperform traditional linear methods; this external integration will optimize inventory management, minimize stockouts, and reduce perishable waste in dynamic environments (Gopinathan, 2025). Additionally, Mansur et al. (2025) proved that incorporating meteorological data, such as rainfall and temperature changes, significantly increases prediction accuracy, allowing for proactive operational adjustments. 

## **Data-Driven Cross-Selling via Behavioral Bridges** 

The inability to track cross-platform purchasing habits results in missed cross-selling opportunities and reactive promotional strategies. WOOF applies Market Basket Analysis (MBA), specifically utilizing the FP-Growth algorithm, to establish "behavioral bridges" across the cafe, retail, and pet service sectors. Integrating association rules with consumer behavior data yields highly specific, data-driven 

136 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

recommendations (Chen & Gunawan, 2023). Furthermore, Hunyadi et al. (2025) validate that pattern-growth techniques like the FP-Growth algorithm are highly effective in large e-commerce environments, as they identify product correlations without excessive memory consumption, empowering multi-line businesses to formulate accurate product bundles. 

## **Closed-Loop Campaign Activation** 

To address the gap between insight generation and execution, WOOF will include a Closed-Loop Campaign Activation feature. This feature converts approved analytics recommendations into tangible, customer-facing outputs such as PetHub announcements, promotional captions, bundle descriptions, and campaign drafts. By connecting the Recommendation Activation System's outputs directly to customer-facing channels, WOOF strengthens its cross-channel function by ensuring that backend data insights are successfully translated into coordinated actions across digital touchpoints, supporting the critical need for integrated channel execution in modern retail environments (Cai & Choi, 2023). Furthermore, the use of AI-assisted campaign preparation is supported by Kshetri et al. (2024), who highlight that generative AI significantly accelerates the production of customized marketing content and sales-related communication materials. However, to maintain strict system boundaries, these outputs will never be published autonomously. The WOOF architecture enforces a Human-in-the-Loop (HITL) protocol, ensuring the business owner retains final control over reviewing, editing, approving, and deploying any customer-facing material. This guarantees that all automated campaigns remain perfectly aligned with the enterprise's business context, brand voice, and real-world operational constraints. 

137 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **Automated Quality Control via Sentiment Analysis** 

To ensure that system recommendations align with actual customer satisfaction and to protect operational reputation, WOOF employs Natural Language Processing (NLP) to conduct sentiment analysis on unstructured online e-commerce reviews. Utilizing NLP and sentiment analysis to extract textual features from e-commerce reviews serves as a powerful tool for understanding consumer decisions; continuous sentiment monitoring allows businesses to make rapid adjustments, such as automatically halting the restocking of poorly rated products (Ma et al., 2024). Daraghmi and Zyadeh (2026) reinforce that evaluating the emotional polarity of online reviews helps companies proactively flag defective products and maintain optimal inventory equilibrium based on genuine consumer satisfaction. 

## **Proactive Executive Decision Support** 

Currently, the owner-operator analyzes raw data manually, making business decisions highly dependent on intuition and delayed operational reports. WOOF resolves this by introducing a centralized Intelligence Dashboard that consolidates digital sales, physical inventory, forecasting outputs, customer behavior patterns, and recommendation alerts into a single decision-support interface. Omisola et al. (2025) emphasize that near real-time predictive analytics enables businesses to anticipate demand patterns by analyzing historical data alongside seasonal variations and external disruptions. Similarly, Li (2025) explains that integrating artificial intelligence into Business Intelligence systems helps optimize decision-making, improve operational efficiency, and support dynamic trend prediction. In this context, WOOF functions as an Intelligent Decision Support System (IDSS) by transforming fragmented operational data 

138 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

into owner-reviewable insights, allowing management to monitor business conditions, evaluate recommendations, and make timely data-driven decisions. Furthermore, the system’s prescriptive outputs align with Wissuchek and Zschech’s (2024) view of prescriptive analytics as a socio-technical decision artifact, where computational recommendations support but do not replace human judgment. 

## **3.4 Project Risk and Feasibility Studies** 

Deploying the Workflow Orchestration, Optimization, and Forecasting (WOOF) architecture introduces specific variables that can impact overall system reliability and user acceptance. Before writing the actual codebase or configuring the data pipelines, the proponents must anticipate potential operational roadblocks. This section outlines the prioritized project risks based on their potential to disrupt the Lucena branch's digital transformation. It also examines the project's viability across technical, operational, and financial perspectives to guarantee that WOOF serves as a practical, long-term solution for the Happy Tails Pet Cafe enterprise. 

## **3.4.1 Risk Management** 

The development and deployment of the Workflow Orchestration, Optimization, and Forecasting (WOOF) system introduces specific technical and operational variables. Because the architecture relies heavily on continuous data streaming, third-party APIs, and automated machine learning models, anticipating potential failure points is essential to ensure system stability. 

139 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **Risk Assessment and Mitigation Table** 

_Likelihood Criteria Legend: 5 - Almost Certain | 4 - Likely | 3 - Possible | 2 - Unlikely | 1 -_ 

## _Rare_ 

|**ID**|**Identified Risk Likelihood**|**Identified Risk Likelihood**|**Severity Level**|**Mitigation**<br>**Action**|
|---|---|---|---|---|
|R1|Incomplete<br>or<br>inconsistent<br>historical data<br>(Pre-system<br>manual<br>records)|3|High|Implement<br>strict<br>data<br>cleaning<br>protocols in the<br>NestJS<br>ETL<br>staging<br>layer.<br>Focus<br>initial<br>machine<br>learning<br>training<br>exclusively on<br>verified<br>datasets<br>to<br>prevent<br>skewed<br>forecasting.|
|R2|Third-party API<br>rate limits and<br>unexpected<br>downtime<br>(Shopee,<br>TikTok,<br>Weather APIs)|4|High|Configure<br>the<br>native NestJS<br>Task Scheduler<br>with<br>exponential<br>backoff<br>and<br>retry<br>logic.<br>Utilize<br>the<br>Redis broker to<br>safely<br>queue<br>incoming<br>webhook<br>payloads until<br>the<br>external<br>connection<br>is<br>restored.|
|R3|Schema<br>mismatch from|2|High|Enforce<br>rigid<br>TypeScript|



140 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

||external<br>vendor<br>updates<br>(Changes<br>in<br>e-commerce<br>JSON<br>payloads)|||validation<br>interfaces<br>within<br>the<br>backend<br>data<br>extraction<br>phase<br>to<br>immediately<br>trap malformed<br>payloads<br>before<br>they<br>corrupt<br>the<br>MongoDB<br>warehouse.|
|---|---|---|---|---|
|R4|Machine<br>learning model<br>degradation<br>(Concept<br>drift<br>due to shifting<br>consumer<br>behavior)|3|Moderate|The system will<br>use automated<br>model<br>monitoring and<br>scheduled<br>or<br>drift-triggered<br>batch<br>retraining<br>to<br>address model<br>degradation.<br>Forecast<br>errors,<br>actual<br>outcomes, and<br>drift signals will<br>be<br>monitored<br>using<br>ETL-validated<br>data. Retrained<br>outputs will be<br>evaluated<br>as<br>candidate<br>models before<br>replacement to<br>avoid unstable<br>or<br>inaccurate<br>model updates.|
|R5|Hardware and<br>cloud resource<br>bottlenecking<br>(System<br>overload|2|Moderate|Utilize<br>a<br>containerized<br>Docker<br>architecture for<br>the<br>backend|



141 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

||during<br>peak<br>holiday sales)|||services,<br>enabling<br>the<br>development<br>team<br>to<br>dynamically<br>scale<br>processing<br>power<br>and<br>database<br>read/write<br>capacity during<br>high-traffic<br>periods.|
|---|---|---|---|---|
|R6|Data<br>privacy<br>vulnerabilities<br>and<br>unauthorized<br>access|1|High|Apply<br>Role-Based<br>Access Control<br>(RBAC) within<br>the<br>executive<br>dashboard<br>to<br>restrict<br>data<br>visibility.<br>Encrypt<br>sensitive<br>customer<br>identifiers<br>stored<br>within<br>the centralized<br>database.|
|R7|Unstable<br>internet<br>connectivity<br>may<br>interrupt<br>near real-time<br>synchronizatio<br>n between the<br>POS,<br>e-commerce<br>platforms,<br>dashboard,<br>and<br>mobile<br>interface.|3|High|Implement<br>local<br>caching<br>and<br>offline<br>queuing so that<br>transaction<br>records, alerts,<br>and<br>operational<br>updates can be<br>temporarily<br>stored<br>when<br>the network is<br>unavailable.<br>Once<br>connectivity is<br>restored,<br>the|



142 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

|system<br>will|
|---|
|automatically|
|synchronize|
|cached<br>data|
|with the central|
|database<br>and|
|log any failed|
|or<br>duplicate|
|sync attempts|
|for<br>review.|
|Additionally, to|
|ensure|
|uninterrupted|
|data ingestion|
|during|
|prolonged|
|network|
|disruptions,<br>a|
|manual<br>CSV|
|file<br>upload|
|feature<br>has|
|been|
|integrated as a|
|secondary|
|fallback.|



_Table 3.4.1 Risk Assessment and Mitigation Table_ 

## **3.4.2 Technological Feasibility** 

The technological feasibility of developing the WOOF system relies on Happy Tails Pet Cafe already having a working digital foundation. Currently, the Lucena branch operates using a standard POS terminal alongside active e-commerce storefronts on Shopee and TikTok Shop. Because the establishment has already digitized its daily operations and captured 5 years of longitudinal transactional data, the basic hardware and internet connectivity required to deploy a new integrated system are already in place. The project does not require the business to 

143 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

purchase highly specialized physical servers; rather, it builds on its existing digital footprint to address the current issue of modal fragmentation. 

To synchronize these disconnected channels into a centralized data warehouse, the proposed architecture will utilize a standard Extract, Transform, Load (ETL) framework. The integration process is technically viable because it is designed to be implemented in progressive phases. The system is highly feasible for deployment, leveraging a practical, two-tiered data integration architecture. First, the system efficiently processes historical business data via standard CSV uploads, which are necessary for training Meta’ Prophet predictive model. Second, for near-real-time synchronization, the system directly uses modern push mechanisms (webhooks) from the marketplace. This allows continuous and automated data extraction from e-commerce channels like TikTok Shop and Shopee without overwhelming the server, ensuring that the system's business intelligence dashboards reflect current multi-line operations. This layered data-gathering approach guarantees that pulling information from both physical and digital storefronts is technically manageable and secure. 

On the analytical side, powering the "Digital Manager" and its prescriptive logic is highly achievable using current open-source machine learning technologies. The core engines of the system, such as the FP-Growth algorithm for Market Basket Analysis and hybrid time-series forecasting model like Meta's Prophet are well-documented and optimized to handle large volumes of transactional data. Additionally, integrating external context via public APIs for weather, holidays, and seasons, along with an NLP scraper to monitor e-commerce sentiment, relies on standard web communication protocols. Because the heavy computational processing of these models is handled within the system's backend and simply projected to the owner via an accessible dashboard, the technical execution of this autonomous revenue intelligence 

144 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

system is entirely practical and realistic. 

## **3.4.3 Organizational/Cultural Feasibility** 

The organizational feasibility of the WOOF system is strongly supported by the management's direct recognition of their current operational bottlenecks. Currently, the Lucena branch of Happy Tails Pet Cafe struggles with modal fragmentation, where physical store operations and digital e-commerce channels are managed in silos. Because the management is actively seeking a solution to bridge this gap and optimize periods of low physical foot traffic, there is a high level of executive motivation to transition toward a centralized environment. The leadership is fully prepared to adopt the proposed "Digital Manager" framework to consolidate their multi-line SME operations and maximize their revenue opportunities. 

Culturally, this project requires a shift from traditional, experience-based operations to an autonomous intelligence framework. Historically, the formulation of service bundles and promotional efforts at the cafe relied heavily on subjective managerial intuition or outdated reporting. The implementation of WOOF will introduce a new operational culture where business decisions are driven by prescriptive analytics. This means the management must be willing to trust and execute the system-generated strategies, such as dynamic Happy Hour triggers and data-backed service bundling derived from Market Basket Analysis. Given the establishment's explicit goal of maximizing the value of every customer interaction through targeted cross-selling, the organizational mindset is already aligned with embracing this data-centric approach. 

145 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

On the operational level, the system is designed to be highly accessible for the cafe and grooming staff, ensuring strong end-user readiness and minimal friction during deployment. While the backend relies on complex forecasting models and continuous learning feedback loops, the actual interface presented to the staff and management is a streamlined executive dashboard. The system performs the heavy analytical lifting in the background; therefore, the employees' daily workflow will not be unnecessarily complicated by technical data science tasks. Instead, they will simply interact with clear visual metrics, AI-assisted explanations, and actionable promotional suggestions. As a result, the transition will only require standard operational training on navigating the dashboard and executing the recommended actions, making the system highly feasible for a smooth cultural integration. 

## **3.4.4 Economic Feasibility** 

To determine if replacing the current manual consolidation workflow with the WOOF architecture is a sound financial decision for Happy Tails Pet Cafe, a practical cost-benefit analysis was conducted. The proposed system deliberately utilizes open-source data engineering tools, specifically Redis and the NestJS framework, to avoid the massive licensing fees typically associated with enterprise-grade intelligence platforms. Consequently, the financial requirements are strictly limited to the necessary cloud infrastructure, developer deployment accounts, and ongoing database maintenance. 

## **Estimated Financial Requirements (Before and After Development) in PHP** 

|**Expense Category**|**Description**|**Before**<br>**Development**|**After**<br>**Development**|
|---|---|---|---|
|Domain<br>Registration & SSL|Securing the official<br>web domain for the|₱<br>1,500.00<br>(Annual)|N/A|



146 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

||Next.js<br>Executive<br>Dashboard<br>and<br>ensuring encrypted<br>data routing.|||
|---|---|---|---|
|Expo<br>Application<br>Services (EAS) &<br>Internal Distribution|Utilizing Expo for<br>internal B2B app<br>compilation<br>and<br>distributing<br>the<br>mobile interface via<br>side-loaded<br>APKs<br>for<br>staff devices,<br>bypassing<br>public<br>app store fees.|N/A|N/A|
|NestJS<br>Backend<br>Server (VPS)|Mid-tier<br>Virtual<br>Private<br>Server<br>(e.g.,<br>DigitalOcean/AWS)<br>to host the core<br>ETL<br>processing<br>logic.|N/A|₱ 1,200.00|
|Hybrid<br>Database:<br>MongoDB Atlas +<br>Supabase<br>PostgreSQL|MongoDB will store<br>raw webhook, API,<br>review, and CSV<br>payloads,<br>while<br>Supabase<br>PostgreSQL<br>will<br>store cleaned fact<br>tables,<br>dimension<br>tables, data marts,<br>feedback logs, and<br>model outputs.|N/A|₱ 3,200.00|
|Redis<br>Managed<br>Cache|Cloud-managed<br>Redis instance to<br>handle<br>streaming<br>queues and prevent<br>payload loss during<br>peak traffic.|N/A|₱ 800.00|
|External<br>API<br>Allowances|Buffer budget for<br>third-party<br>context<br>data<br>(Weather,<br>Holiday<br>APIs)<br>if|N/A|₱ 800.00|



147 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

||polling<br>exceeds<br>free-tier limits.|||
|---|---|---|---|
|System<br>Contingency Fund|Emergency<br>buffer<br>for<br>unexpected<br>technical<br>troubleshooting<br>or<br>temporary<br>server<br>scaling<br>during<br>holidays.|₱ 3,000.00|₱ 1,500.00|
|**Total**<br>**Estimated**<br>**Cost**||**₱ 4,500.00**|**₱ 7,500.00 / month**|



_Table 3.4.4 Estimated Financial Requirements_ 

## **3.5 Business Requirements Overview** 

The business requirements for the proposed WOOF system are derived directly from the operational challenge of resolving data silos between the physical Point-of-Sale systems and digital e-commerce platforms. The system's architecture is firmly grounded in established analytical methodologies, specifically FP-Growth-based Market Basket Analysis and context-aware time-series forecasting. Together, these requirements dictate the system’s core capabilities, performance baselines, and interface design, ensuring it successfully integrates fragmented datasets, elevates executive decision-making, and drives Happy Tails Pet Cafe toward a fully data-driven, cross-channel operational model. 

## **3.5.1 Functional Requirements** 

The WOOF system is designed to perform a range of core functionalities that enable the integration, analysis, and utilization of business data across multiple operational channels. It integrates transactional data from the physical Point-of-Sale (POS) system and e-commerce platforms such as Shopee and TikTok Shop into a centralized data warehouse using both 

148 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

historical batch processing and near real-time synchronization through APIs and webhooks. Through this unified data environment, the system provides a centralized executive dashboard that visualizes key performance indicators, including sales trends, inventory levels, and service demand across all business sectors, serving as the primary interface for monitoring and decision-making. 

|Requirement ID|Functional Requirement|Description|
|---|---|---|
|FR-01|User Authentication and<br>Role-Based Access|The system shall allow<br>authorized users, such as the<br>owner, to securely log in and<br>access system features<br>based on their assigned<br>roles.|
|FR-02|Cross-Channel Data<br>Integration|The system shall consolidate<br>historical and operational<br>data from the physical POS,<br>Shopee, TikTok Shop, CSV<br>uploads, and external APIs<br>into a unified data<br>warehouse.|
|FR-03|Data Cleaning and<br>Standardization|The system shall clean,<br>validate, deduplicate, and<br>standardize incoming records<br>to ensure consistent product<br>names, transaction details,<br>timestamps, inventory values,<br>and review data.|
|FR-04|Centralized Dashboard and<br>Reporting|The system shall display<br>sales performance, inventory<br>levels, demand trends,<br>e-commerce activity,<br>customer feedback<br>summaries, and operational<br>alerts through a centralized<br>dashboard and generated<br>reports.|
|FR-05|Demand Forecasting and|The system shall forecast|



149 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

||Accuracy Evaluation|sales demand, inventory<br>needs, service activity, and<br>possible foot traffic using<br>time-series models and<br>evaluate forecast reliability<br>using appropriate error<br>metrics such as MAPE and<br>RMSE.|
|---|---|---|
|FR-06|Inventory Monitoring and<br>Alerting|The system shall monitor<br>inventory movement and<br>generate alerts for low stock,<br>overstocking, slow-moving<br>items, spoilage risk, expiry<br>risk, and forecasted stock<br>shortages.|
|FR-07|Market Basket and<br>Cross-Selling Analysis|The system shall analyze<br>transaction-level purchasing<br>patterns using Market Basket<br>Analysis to identify frequent<br>itemsets, compute support,<br>confidence, and lift, and<br>recommend possible product<br>or service bundles.|
|FR-08|Promotional<br>Recommendation Support|The system shall recommend<br>data-driven promotional<br>strategies based on demand<br>forecasts, historical sales<br>patterns, slow-moving<br>inventory, market basket<br>results, weather, holidays,<br>and seasonal indicators.|
|FR-09|NLP-Based Sentiment and<br>Feedback Analysis|The system shall process<br>customer reviews from<br>e-commerce platforms using<br>NLP and sentiment analysis<br>to identify positive, negative,<br>and neutral feedback,<br>recurring complaints, and<br>possible product or service<br>quality issues.|
|FR-10|Staff Scheduling and Service|The system shall use service|



150 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

||Occupancy Support|demand, forecasted foot<br>traffic, and staffing thresholds<br>to support staff scheduling<br>recommendations and<br>identify peak or idle service<br>periods.|
|---|---|---|
|FR-11|AI-Assisted Insight<br>Explanation|The system shall provide an<br>AI-assisted explanation<br>feature that summarizes<br>dashboard trends, forecasts,<br>inventory alerts, customer<br>feedback, and<br>recommendation logic in<br>language understandable to<br>non-technical users.|
|FR-12|Owner Review and Manual<br>Approval|The system shall allow<br>management to review,<br>approve, reject, or modify<br>system-generated<br>recommendations before any<br>promotion, bundle, restocking<br>action, or external platform<br>update is implemented.|
|FR-13|Feedback Loop and Model<br>Monitoring|The system shall record<br>manager feedback,<br>recommendation outcomes,<br>actual sales and booking<br>results, campaign<br>performance, inventory<br>movement, bundle<br>acceptance or rejection,<br>bundle redemption, and<br>forecast errors to support<br>model evaluation tracking,<br>concept drift detection,<br>automated batch retraining,<br>and recommendation-rule<br>recalibration using<br>ETL-validated data.<br>Retrained models shall be<br>treated as candidate models<br>and evaluated against the<br>currently active model before|



151 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

replacement, while updated recommendation rules or bundle rankings shall be evaluated before replacing active rule sets. FR-14 Mobile Operations The system shall send Notification relevant operational alerts, including restocking prompts, quality warnings, task reminders, and schedule-related notices, to the Cafe Owner's mobile interface to enable them to assess notifications and prompt the staff to execute necessary operational actions on the floor. 

_Table 3.5.1 Functional Requirements_ 

## **3.5.2 Non-Functional Requirements** 

The WOOF system is expected to meet several quality attributes to ensure efficient and reliable operation. It maintains high performance by ensuring that data processing and dashboard updates occur within acceptable response times, particularly for near real-time synchronization. Reliability is ensured through consistent system availability and minimal downtime during business operations. The system also prioritizes accuracy in its analytical outputs, particularly in forecasting models and recommendation engines, by utilizing validated algorithms and performance evaluation metrics. 

Scalability is incorporated to allow future expansion, including additional branches, increased transaction volumes, and integration with other digital platforms. Security measures 

152 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

are implemented to protect transactional and customer data from unauthorized access, ensuring data integrity and confidentiality. In terms of usability, the system is designed with a user-friendly interface that allows non-technical user/s to easily navigate the dashboard and interpret system-generated insights with minimal training. 

|**Requirement ID**|**Quality Attribute**|**Description**|
|---|---|---|
|**NFR-01**|Performance|Ensure data processing and<br>dashboard<br>updates<br>happen<br>within<br>acceptable<br>response<br>times,<br>particularly<br>for<br>near<br>real-time synchronization.|
|**NFR-02**|Reliability|Maintain<br>consistent<br>system<br>availability and ensure minimal<br>downtime<br>during<br>business<br>operations.|
|**NFR-03**|Accuracy|Ensure<br>high<br>accuracy<br>in<br>analytical outputs, forecasting<br>models, and recommendation<br>engines by utilizing validated<br>algorithms<br>and<br>performance<br>evaluation metrics.|



153 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

|**NFR-04**|Scalability|Support<br>future<br>business<br>expansion,<br>including<br>the<br>addition<br>of<br>new<br>branches,<br>increased transaction volumes,<br>and integration with additional<br>digital platforms.|
|---|---|---|
|**NFR-05**|Security|Protect all transactional and<br>customer<br>data<br>from<br>unauthorized<br>access<br>to<br>guarantee data integrity and<br>confidentiality.|
|**NFR-06**|Usability|Feature<br>a<br>user-friendly<br>interface<br>that<br>allows<br>non-technical user/s to easily<br>navigate the dashboard and<br>interpret<br>system-generated<br>insights with minimal training.|



_Table 3.5.2 Non-Functional Requirements_ 

154 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **3.5.3 Mock-Ups** 

The WOOF system includes user interface mock-ups that visually represent the structure and functionality of the application. These mock-ups act as a blueprint for the system’s front-end design and user interaction flow. The primary interface is an executive dashboard that presents both near real-time and historical analytics through charts, graphs, and summary metrics, covering areas such as sales performance, inventory monitoring, demand forecasting, and recommended actions. 

155 

## **UNIVERSITY OF SANTO TOMAS** 

## **COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.1.1 Mobile Login_ 

Figure 3.5.3.1.1 shows the mobile mockup of the Login Screen of the WOOF system. It allows the owner to enter their email and password, and access a password reset dialog, making authentication clear and fast. 

_Figure 3.5.3.1.2 Mobile Forget Password_ 

156 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Figure 3.5.3.1.2 shows the mobile mockup of the Owner Forget Password functionality. This provides a secure way to reset the owner's password by having an OTP sent to their registered email address first before being able to reset their password. 

_Figure 3.5.3.1.3 Mobile Home Page_ 

Figure 3.5.3.1.3 presents the mobile mockup of the Home Dashboard within the WOOF AI system. The top portion features a Hero Banner displaying a personalized greeting. Below 

157 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

the banner is the Data Ingestion Center, which replaces standard sales KPIs with system health metrics. Additionally, the interface provides comprehensive tools for manual data management. This includes a Manual Ingestion Section wherein it provides a drag-and-drop zone for standardizing CSV and Excel file uploads, and an "Upload History" log to track recently processed documents. Finally, the dashboard includes a WOOF AI Insight Panel that highlights key operational trends, delivering specific, text-based intelligence such as sector growth percentages, service utilization rates, and targeted cross-sell opportunities. 

_Figure 3.5.3.1.4 Mobile Home Page: Cross-Channel Revenue Accumulation_ 

158 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Figure 3.5.3.1.4 shows the mobile mockup for the Cross-Channel Revenue Accumulation section, featuring a line graph that compares revenue trends across four key streams: Cafe, Retail, Services, and Online sales. 

_Figure 3.5.3.1.5 Mobile Home Page: Offline vs. Online Channel Balance & Sales Intensity Map_ 

Figure 3.5.3.1.5 shows the mobile mockup of the performance analysis interface, featuring a horizontal bar chart that evaluates the Offline vs. Online Channel Balance across 

159 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

various product and service categories, alongside a Sales Intensity Map that utilizes a color-coded heatmap to identify peak operational hours and high-traffic days throughout the week. 

_Figure 3.5.3.1.6 Mobile Home Page: Suggestion Feed_ 

Figure 3.5.3.1.6 shows the mobile mockup of the Suggestion Feed that delivers proactive, data-driven promotional recommendations. This module allows the management to interact directly with AI-generated triggers through approval and dismissal mechanisms, while 

160 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

simultaneously capturing user feedback to facilitate the continuous recalibration of the underlying machine learning models. 

_Figure 3.5.3.1.7 Mobile Home Page: Next Schedule Action & AI_ 

Figure 3.5.3.1.7 shows the mobile mockup of the Next Scheduled Action module that monitors queued promotional deployments with an execution countdown, alongside an AI Business Partner chat feature that delivers context-aware operational recommendations and allows users to query near real-time business insights. 

161 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.1.8 Mobile: AI Chat Bot_ 

Figure 3.5.3.1.8 shows the mobile mockup of the AI Chatbot interface, functioning as an interactive decision-support tool. It features a conversational module that delivers proactive, data-driven business recommendations, accompanied by a natural language input field and 

162 

## a **UNIVERSITY OF SANTO TOMAS** 4 7 <vd ke y = Sg **COLLEGE OF INFORMATION AND COMPUTING SCIENCES** oy ) L & KZ = Sow **Information Systems Department** 

context-aware prompt suggestions (such as forecasting explanations and bundle optimizations) to facilitate rapid and intuitive data querying by the management. 

_Figure 3.5.3.1.9 Mobile Cafe Page: KPI Overview_ 

Figure 3.5.3.1.9 shows the mobile mockup of the KPI Summary section of the cafe page. 

It included cafe revenue, orders, average check size, and active menu items in card format. 

163 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.1.10 Mobile Cafe Page: Cafe Demand Forecast_ 

Figure 3.5.3.1.10 shows the mobile mockup for the cafe sector’s time-series forecast chart that projects anticipated revenue and order volume over a 30-day horizon. Additionally, the module displays the active forecasting model's statistical evaluation metrics, specifically MASE, RMSE, MAPE, and R-squared, alongside an automated analysis panel that rationalizes the AI-selected algorithm and provides a direct execution button for manual model retraining. 

164 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.1.11 Mobile Cafe Page: WOOF AI Insight & Menu Item Performance_ 

Figure 3.5.3.1.11 shows the mobile mockup of the Menu Item Performance table that evaluates cross-channel sales data and equilibrium status alongside trend visualizations to facilitate comprehensive product reviews and strategic adjustments by management. 

165 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.1.12 Mobile Cafe Page: Happy Hour Suggestion & Previous Happy Hour_ 

## _Effectiveness_ 

Figure 3.5.3.1.12 shows the mobile mockup of the dynamic promotional management interface, featuring a predictive Next Quiet Period module that identifies anticipated low-traffic 

hours and utilizes a configurable discount slider to prepare owner-reviewable happy hour recommendations, alongside a historical performance tracker that evaluates past campaign effectiveness and an NLP-driven sentiment monitor for analyzing cross-platform customer reviews. 

166 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.1.13 Mobile Services Page: KPI Overview_ 

Figure 3.5.3.1.13 shows the mobile mockup of the KPI Overview section of the Services 

Command Screen in the WOOF AI system. It presented services revenue, active bookings, utilization rate, and peak alerts in mobile cards. 

167 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.1.14 Mobile Services Page: Booking Demand Forecast_ 

Figure 3.5.3.1.14 shows the mobile mockup of the Booking Forecast Chart section of the Services Command Screen in the WOOF AI system. It showed demand predictions with time-range toggles for operational planning. 

168 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.1.15 Mobile Services Page: Woof Analysis & AI Insight_ 

Figure 3.5.3.1.15 shows the mobile mockup of the WOOF Analysis module that evaluates the active forecasting model, alongside an AI Insight component that delivers proactive, context-aware recommendations, such as dynamic pricing adjustments, based on near real-time data from the Service Utilization Monitor. 

169 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.1.16 Mobile Services Page: Service Utilization Monitor & Current Hourly Bookings_ 

Figure 3.5.3.1.16 shows the mobile mockup for the near real-time capacity tracking interface, featuring a Service Utilization Monitor that evaluates active booking volumes and overall capacity percentages across various pet care services, alongside a daily hourly bar chart that visualizes the distribution of appointments throughout the established operating schedule. 

170 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.1.17 Mobile Services Page: Weekly Service Mix & Capacity Alerts & Occupancy_ 

## _Risks_ 

Figure 3.5.3.1.17 shows the mobile mockup for the service distribution and risk management interface, featuring a Weekly Service Mix area chart that visualizes the proportional trends of various pet care services over a seven-day period, alongside a Capacity Alerts and Occupancy Risks module that proactively identifies predicted operational bottlenecks and provides actionable prompts for immediate managerial intervention. 

171 

2Seae a **UNIVERSITY OF SANTO TOMAS** 1seY <4,%“roTe7 b >KSS<a=ie **COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** N ay¥ eS7 Ls 

_Figure 3.5.3.1.18 Mobile Retail Page: Inventory Health Monitor_ 

Figure 3.5.3.1.18 shows the mobile mockup for the Inventory Health Monitor that evaluates current stock levels against predicted stockout dates to facilitate proactive reordering. 

172 

## me| aik **UNIVERSITY OF SANTO TOMAS** y36 2 2 ie A [ S he = **COLLEGE OF INFORMATION AND COMPUTING SCIENCES** DC} 4% L <a C “ro7 xSS **Information Systems Department** AJ 

_Figure 3.5.3.1.19 Mobile Retail Page: Sales Velocity Trend & Quick Stats_ 

Figure 3.5.3.1.19 shows the mobile mockup for the Sales Velocity Trend line graph that tracks product movement across physical and online channels over a 14-day period, alongside a Quick Stats module that summarizes key operational metrics, such as average daily sales and total inventory value. 

173 

ea **UNIVERSITY OF SANTO TOMAS** >ay Ema Sis fe) **COLLEGE OF INFORMATION AND COMPUTING SCIENCES** \ 4 g i Go fs y 3 1S “to7 b ~S< **Information Systems Department** N U 

_Figure 3.5.3.1.20 Mobile Retail Page: AI Spoilage Prevention Engine_ 

Figure 3.5.3.1.20 shows the mobile mockup for the AI Spoilage Prevention Engine that identifies at-risk retail products by analyzing upcoming expiration dates against current sales velocity, alongside a dynamic discounting module that calculates specific spoilage risk percentages and provides automated, actionable markdown recommendations to instantly activate sales and minimize inventory waste. 

174 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.1.21 Mobile Retail Page: Cross-Channel Performance by Category_ 

Figure 3.5.3.1.21 shows the mobile mockup for the cross-platform revenue analysis interface, featuring an Cross-Channel Performance by Category module that utilizes a grouped bar chart to visualize and compare revenue distribution across the physical storefront and integrated digital e-commerce channels, specifically Shopee and TikTok, segmented by various product and service classifications. 

175 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.1.22 Mobile Retail Page: Retail Review Sentiment Monitor_ 

Figure 3.5.3.1.22 shows the mobile mockup for the Sentiment and Reviews Panel of the cafe page. This section aggregates cross-platform consumer feedback, featuring platform-specific markers and NLP-driven keyword flags to descriptively monitor emotional polarity and track critical customer satisfaction trends. 

176 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.1.23 Mobile AI Simulation Page: KPI Overview & Raw Transaction Data Analysis_ 

Figure 3.5.3.1.23 shows the mobile mockup for the AI Simulation Laboratory that evaluates key predictive metrics, such as active simulations, deployed bundles, and confidence levels, across configurable testing environments (including bundle, pricing, and traffic simulators), alongside a Raw Transaction Data Analysis module that utilizes a time window selection slider to monitor live transaction streams for AI pattern detection. 

177 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.1.24 Mobile AI Simulation Page: Hourly Transaction Volume & Top Products_ 

## _Purchase Combinations_ 

Figure 3.5.3.1.24 shows the the mobile mockup for the Hourly Transaction Volume bar chart that visualizes customer activity levels across the operating day, alongside a Top Product Co-Purchases module that identifies high-frequency item combinations within specific time windows, accompanied by key summary metrics such as the peak transaction hour, average items per cart, and cross-category percentage to uncover actionable cross-selling opportunities. 

178 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.1.25 Mobile AI Simulation Page: Live Behavioral Web_ 

Figure 3.5.3.1.25 shows the mobile mockup for the near real-time behavioral analysis and pattern recognition interface, featuring a Live Behavioral Web module that visualizes association rules through a dynamic node graph, alongside Interactive AI Controls equipped with configurable support and confidence threshold sliders to dynamically filter data patterns. Furthermore, the interface displays actionable, AI-generated insights, such as top bundle recommendations, emerging trends, and high-conversion cross-sell opportunities, complemented by a Time-Based Pattern Analysis slider for granular temporal evaluation. 

179 

## **UNIVERSITY OF SANTO TOMAS** ‘| mA **2** -& =| >2 **COLLEGE OF INFORMATION AND COMPUTING SCIENCES** N| % L 4 oO “No7 xSy **Information Systems Department** NN 

_Figure 3.5.3.1.26 Mobile AI Simulation Page: AI-Predicted Bundle Opportunities_ 

Figure 3.5.3.1.26 shows the mobile mockup for the predictive cross-selling interface, featuring an AI-Predicted Bundle Opportunities module that utilizes FP-Growth analysis to identify optimal product and service combinations. The interface presents these algorithmic recommendations, such as a "Cappuccino + Grooming" pairing, alongside vital evaluation metrics including statistical confidence, expected revenue lift, and profit margin, while providing direct execution buttons for the immediate deployment of targeted promotional campaigns. 

180 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.1.27 Mobile AI Simulation Page: Strategic Proximity Recommendations_ 

Figure 3.5.3.1.27 shows the mobile mockup for the Strategic Proximity Recommendations module designed to optimize physical store layouts. The interface presents targeted product pairings, such as "Dog Shampoo + Dog Toothbrushes" and "Pet Treats + Chew Toys", alongside calculated synergy scores and actionable merchandising advice, guiding management to position complementary items in close proximity to maximize impulse purchases. 

181 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.1.28 Mobile AI Simulation Page: AI Insight_ 

Figure 3.5.3.1.28 shows the mobile mockup for the AI Insight component that delivers proactive, context-aware recommendations, such as high-synergy pairings and recommendations based on near real-time data. 

182 

me| akk **UNIVERSITY OF SANTO TOMAS** ye 2 By és Ne A **COLLEGE OF INFORMATION AND COMPUTING SCIENCES** 2% L Ny& fe} “to7 KS **Information Systems Department** N L 

_Figure 3.5.3.1.29 Mobile Feedback Page: KPI Overview_ 

Figure 3.5.3.1.29 shows the mobile mockup of the Feedback Table section of the feedback page. It lists promotions with actual lift, confidence scores, sectors, and user reaction options. 

183 

SeBae a **UNIVERSITY OF SANTO TOMAS** y36 Sisz 2 g|e **COLLEGE OF INFORMATION AND COMPUTING SCIENCES** i \ Go fs S$% b <a eo} “to7 ~S **Information Systems Department** N U 

_Figure 3.5.3.1.30 Mobile Feedback Page: AI Insight & Active Promotions_ 

Figure 3.5.3.1.30 shows the mobile mockup for the Active Promotions module that monitors live campaigns, such as a Birthday Package Deal, by tracking target operating windows, applied discounts, and predicted revenue lift. Furthermore, the interface incorporates a WOOF AI Insight component demonstrating how user feedback directly enhances the system's predictive accuracy. 

184 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.1.31 Mobile Feedback Page: Completed Promotions_ 

Figure 3.5.3.1.31 shows the mobile mockup for the post-campaign analysis interface, featuring a Completed Promotions module that evaluates past promotional performance by comparing predicted revenue lift against actual financial outcomes, alongside a direct user feedback mechanism designed to capture managerial input and continuously refine the accuracy of future AI recommendations by autonomous retraining of models. 

185 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.1.32 Mobile Feedback Page: Learning Insights_ 

Figure 3.5.3.1.32 shows the mobile mockup for the Learning Insights module that quantifies how direct managerial input actively refines the AI's predictive algorithms. The interface highlights key system improvement metrics, while providing specific, text-based summaries of recent recalibrations, such as the system learning to prioritize highly effective afternoon cross-sell bundles over underperforming late-night flash sales. 

186 

2Seae a **UNIVERSITY OF SANTO TOMAS** 1seY isy% L 2 o:|e) **COLLEGE OF INFORMATION AND COMPUTING SCIENCES** 4 | @c4o “to7 KSNy **Information Systems Department** ‘ L 

_Figure 3.5.3.1.33 Mobile Audit Page_ 

Figure 3.5.3.1.33 shows the mobile mockup for the comprehensive audit log and activity tracking interface, featuring a detailed chronological record of both automated AI engine executions and manual administrative interventions. The module ensures granular operational oversight and accountability by systematically capturing transaction metrics across seven distinct parameters: Timestamp, User/System originator, Target Record, Action & Module, State Transition, Turnaround Time, and the final execution Status. 

187 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.1.34 Mobile Settings Page: Notification Preferences_ 

Figure 3.5.3.1.34 shows the mobile mockup for the System Settings module designed to manage WOOF system preferences and overarching data operations. The interface provides granular control through a Notification Preferences section, allowing users to toggle specific alerts for critical capacity and spoilage events, AI bundle suggestions, daily automated reports, and system updates. 

188 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.1.35 Mobile Settings Page: AI Model Configuration & Data Management_ 

Figure 3.5.3.1.35 shows the mobile mockup for the AI & Model Configuration module that allows administrators to toggle automatic model retraining, manually trigger system-wide retraining, and precisely define the minimum confidence threshold for algorithmic suggestions (currently displayed at 80%). Additionally, the interface includes a Data Management section providing granular control over data lifecycle policies, such as setting historical data retention limits to 90 days, alongside comprehensive data export capabilities. 

189 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.1.36 Mobile Settings Page: Appearance Option_ 

Figure 3.5.3.1.36 shows the mobile mockup for the visual personalization interface, featuring an Appearance configuration module designed to customize the overall dashboard experience. The interface provides users with a selection of distinct color themes, including the currently active "Pink Fusion" default, alongside alternative palettes such as "Ocean Breeze," "Sunset Glow," and "Minimal Gray", allowing for aesthetic tailoring of the application, positioned just above a dedicated panel for accessing System Information. 

190 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.1.37 Mobile Settings Page: System Information_ 

Figure 3.5.3.1.37 shows the mobile mockup for the technical overview interface, featuring a System Information module designed to display core application details and operational health metrics. The interface provides administrators with immediate visibility into critical system specifications, including the active software version, the currently deployed AI model, near real-time database connectivity status alongside latency tracking, and the precise timestamp of the most recent data synchronization. 

191 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.2.1 Web Login_ 

Figure 3.5.3.2.1 shows the web mockup of the Login Screen of the WOOF system. It allows the owner to enter their email and password, and access a password reset dialog, making authentication clear and fast. 

192 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## _Figure 3.5.3.2.2 Web Forget Password_ 

Figure 3.5.3.2.2 shows the web mockup of the Owner Forget Password functionality. This provides a secure way to reset the owner's password by having an OTP sent to their registered email address first before being able to reset their password. 

_Figure 3.5.3.2.3 Web Home Page_ 

193 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Figure 3.5.3.2.3 presents the web mockup of the Home Dashboard within the WOOF AI system. The top portion features a Hero Banner displaying a personalized greeting. Below the banner is the Data Ingestion Center, which replaces standard sales KPIs with system health metrics. Additionally, the interface provides comprehensive tools for manual data management. This includes a Manual Ingestion Section wherein it provides a drag-and-drop zone for standardizing CSV and Excel file uploads, and an "Upload History" log to track recently processed documents. Finally, the dashboard includes a WOOF AI Insight Panel that highlights key operational trends, delivering specific, text-based intelligence such as sector growth percentages, service utilization rates, and targeted cross-sell opportunities. 

**==> picture [32 x 18] intentionally omitted <==**

**----- Start of picture text -----**<br>
® 194<br>**----- End of picture text -----**<br>


## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.2.4 Web Home Page: Cross-Channel Revenue Accumulation_ 

Figure 3.5.3.2.4 shows the web mockup for the Cross-Channel Revenue Accumulation 

section, featuring a line graph that compares revenue trends across four key streams: Cafe, Retail, Services, and Online sales. 

_Figure 3.5.3.2.5 Web Home Page: Offline vs. Online Channel Balance & Sales Intensity Map_ 

195 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Figure 3.5.3.2.5 shows the mobile mockup of the performance analysis interface, featuring a horizontal bar chart that evaluates the Offline vs. Online Channel Balance across various product and service categories, alongside a Sales Intensity Map that utilizes a color-coded heatmap to identify peak operational hours and high-traffic days throughout the week. 

_Figure 3.5.3.2.6 WebHome Page: Suggestion Feed_ 

196 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Figure 3.5.3.2.6 shows the web mockup of the Suggestion Feed that delivers proactive, data-driven promotional recommendations. This module allows the management to interact directly with AI-generated triggers through approval and dismissal mechanisms, while simultaneously capturing user feedback to facilitate the continuous recalibration of the underlying machine learning models. 

_Figure 3.5.3.2.7 Web Home Page: Next Schedule Action & AI_ 

197 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Figure 3.5.3.2.7 shows the web mockup of the Next Scheduled Action module that monitors queued promotional deployments with an execution countdown, alongside an AI Business Partner chat feature that delivers context-aware operational recommendations and allows users to query near real-time business insights. 

_Figure 3.5.3.2.8 Web: AI Chat Bot_ 

198 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Figure 3.5.3.2.8 shows the web mockup of the AI Chatbot interface, functioning as an interactive decision-support tool. It features a conversational module that delivers proactive, data-driven business recommendations, accompanied by a natural language input field and context-aware prompt suggestions (such as forecasting explanations and bundle optimizations) to facilitate rapid and intuitive data querying by the management. 

_Figure 3.5.3.2.9 Web Cafe Page: KPI Overview_ 

199 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Figure 3.5.3.2.9 shows the mobile mockup of the KPI Summary section of the cafe page. It included cafe revenue, orders, average check size, and active menu items in card format. 

_Figure 3.5.3.2.10 Web Cafe Page: Cafe Demand Forecast_ 

200 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Figure 3.5.3.2.10 shows the web mockup for the cafe sector’s time-series forecast chart that projects anticipated revenue and order volume over a 30-day horizon. Additionally, the module displays the active forecasting model's statistical evaluation metrics, specifically MASE, RMSE, MAPE, and R-squared, alongside an automated analysis panel that rationalizes the AI-selected algorithm and provides a direct execution button for manual model retraining. 

_Figure 3.5.3.2.11 Mobile Cafe Page: WOOF AI Insight, Menu Item Performance, Happy Hour_ 

_Suggestion, & Previous Happy Hour Effectiveness_ 

201 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Figure 3.5.3.2.11 shows the web mockup of the Menu Item Performance table that evaluates cross-channel sales data and equilibrium status alongside trend visualizations to facilitate comprehensive product reviews and strategic adjustments by management. It also shows the web mockup of the dynamic promotional management interface, featuring a predictive Next Quiet Period module that identifies anticipated low-traffic hours and utilizes a configurable discount slider to prepare owner-reviewable happy hour recommendations, alongside a historical performance tracker that evaluates past campaign effectiveness and an NLP-driven sentiment monitor for analyzing cross-platform customer reviews. 

_Figure 3.5.3.2.12 Web Services Page: KPI Overview, Booking Demand Forecast, & Woof_ 

_Analysis_ 

Figure 3.5.3.2.12 shows the web mockup of the KPI Overview section of the Services Command Screen in the WOOF AI system. It presented services revenue, active bookings, utilization rate, and peak alerts in mobile cards. It also shows the mobile mockup of the Booking Forecast Chart section of the Services Command Screen in the WOOF AI system. It showed 

202 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

demand predictions with time-range toggles for operational planning. Lastly, it shows the mobile mockup of the WOOF Analysis module that evaluates the active SARIMA forecasting model 

_Figure 3.5.3.2.13 Web Services Page: AI Insight, Service Utilization Monitor,  Current Hourly_ 

_Bookings, & Weekly Service Mix_ 

203 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Figure 3.5.3.2.13 shows the web mockup for the near real-time capacity tracking interface, featuring a Service Utilization Monitor that evaluates active booking volumes and overall capacity percentages across various pet care services, alongside a daily hourly bar chart that visualizes the distribution of appointments throughout the established operating schedule. I also shows the web mockup for the service distribution and risk management interface, featuring a Weekly Service Mix area chart that visualizes the proportional trends of various pet care services over a seven-day period 

_Figure 3.5.3.2.14 Web Services Page: Capacity Alerts & Occupancy Risks_ 

204 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Figure 3.5.3.2.14 shows the web mockup for Capacity Alerts and Occupancy Risks module that proactively identifies predicted operational bottlenecks and provides actionable prompts for immediate managerial intervention. 

_Figure 3.5.3.2.15  Web Retail Page: KPI Overview & AI Insight_ 

205 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Figure 3.5.3.2.15 shows the web mobile mockup of the Inventory Risk Alerts section of the retail page. It listed critical SKU issues with reorder controls and discount sliders for immediate action. It also shows an AI Insight component that delivers proactive, context-aware recommendations, such as recommendation of flash sale drafts for owner review and spoilage risk reminder, based on near real-time data. 

_Figure 3.5.3.2.16 Web Retail Page: Inventory Health Monitor, Sales Velocity Trend, & Quick_ 

_Stats_ 

206 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Figure 3.5.3.2.16 shows the mobile mockup for the Inventory Health Monitor that evaluates current stock levels against predicted stockout dates to facilitate proactive reordering, alongside the Sales Velocity Trend line graph that tracks product movement across physical and online channels over a 14-day period. It also shows the Quick Stats module that summarizes key operational metrics, such as average daily sales and total inventory value. 

_Figure 3.5.3.2.17 Web Retail Page: AI Spoilage Prevention Engine_ 

Figure 3.5.3.2.17 shows the web mockup for the AI Spoilage Prevention Engine that identifies at-risk retail products by analyzing upcoming expiration dates against current sales 

207 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

velocity, alongside a dynamic discounting module that calculates specific spoilage risk percentages and provides automated, actionable markdown recommendations to instantly activate sales and minimize inventory waste. 

_Figure 3.5.3.2.18 Web Retail Page: AI Spoilage Prevention Engine_ 

Figure 3.5.3.2.18 shows the web mockup for the cross-platform revenue analysis interface, featuring an Cross-Channel Performance by Category module that utilizes a grouped 

208 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

bar chart to visualize and compare revenue distribution across the physical storefront and integrated digital e-commerce channels, specifically Shopee and TikTok, segmented by various product and service classifications. 

_Figure 3.5.3.2.19 Web Retail Page: AI Spoilage Prevention Engine_ 

Figure 3.5.3.2.19  shows the web mockup for the Sentiment and Reviews Panel of the cafe page. This section aggregates cross-platform consumer feedback, featuring 

209 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

platform-specific markers and NLP-driven keyword flags to descriptively monitor emotional polarity and track critical customer satisfaction trends. 

_Figure 3.5.3.2.20 Web AI Simulation Page: KPI Overview, Raw Transaction Data Analysis,_ 

_Hourly Transaction Volume, & Top Products Purchase Combinations_ 

Figure 3.5.3.2.20 shows the web mockup for the AI Simulation Laboratory that evaluates key predictive metrics, such as active simulations, deployed bundles, and confidence levels, across configurable testing environments (including bundle, pricing, and traffic simulators), alongside a Raw Transaction Data Analysis module that utilizes a time window selection slider to monitor live transaction streams for AI pattern detection. It also shows the the web mockup for the Hourly Transaction Volume bar chart that visualizes customer activity levels 

210 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

across the operating day, alongside a Top Product Co-Purchases module that identifies high-frequency item combinations within specific time windows, accompanied by key summary metrics such as the peak transaction hour, average items per cart, and cross-category percentage to uncover actionable cross-selling opportunities. 

_Figure 3.5.3.2.21 Web AI Simulation Page: Hourly Transaction Volume & Top Products_ 

## _Purchase Combinations_ 

Figure 3.5.3.2.21 shows the web mockup for the near real-time behavioral analysis and pattern recognition interface, featuring a Live Behavioral Web module that visualizes association rules through a dynamic node graph, alongside Interactive AI Controls equipped with configurable support and confidence threshold sliders to dynamically filter data patterns. Furthermore, the interface displays actionable, AI-generated insights, such as top bundle recommendations, emerging trends, and high-conversion cross-sell opportunities, complemented by a Time-Based Pattern Analysis slider for granular temporal evaluation. 

211 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.2.22 Web AI Simulation Page: AI-Predicted Bundle Opportunities_ 

Figure 3.5.3.2.22 shows the web mockup for the predictive cross-selling interface, featuring an AI-Predicted Bundle Opportunities module that utilizes FP-Growth analysis to identify optimal product and service combinations. The interface presents these algorithmic recommendations, such as a "Cappuccino + Grooming" pairing, alongside vital evaluation metrics including statistical confidence, expected revenue lift, and profit margin, while providing direct execution buttons for the immediate deployment of targeted promotional campaigns. 

212 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.2.23 Web AI Simulation Page: Strategic Proximity Recommendations_ 

Figure 3.5.3.2.23 shows the web mockup for the Strategic Proximity Recommendations module designed to optimize physical store layouts. The interface presents targeted product pairings, such as "Dog Shampoo + Dog Toothbrushes" and "Pet Treats + Chew Toys", alongside calculated synergy scores and actionable merchandising advice, guiding management to position complementary items in close proximity to maximize impulse purchases. 

213 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.2.24 Web AI Simulation Page: AI Insight_ 

Figure 3.5.3.2.24 shows the mobile mockup for the AI Insight component that delivers proactive, context-aware recommendations, such as high-synergy pairings and recommendations based on near real-time data. 

214 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.2.25 Web AI Simulation Page: AI Insight_ 

Figure 3.5.3.2.25 shows the web mockup for the AI Insight component that delivers proactive, context-aware recommendations, such as high-synergy pairings and recommendations based on near real-time data. 

215 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.2.26 Web Feedback Page: KPI Overview_ 

Figure 3.5.3.2.26 shows the web mockup for the AI Insight component that delivers proactive, context-aware recommendations, such as high-synergy pairings and recommendations based on near real-time data. 

216 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.2.27 Web Feedback Page: AI Insight & Active Promotions_ 

Figure 3.5.3.2.27 shows the web mockup for the Active Promotions module that monitors 

live campaigns, such as a Birthday Package Deal, by tracking target operating windows, applied discounts, and predicted revenue lift. Furthermore, the interface incorporates a WOOF AI Insight component demonstrating how user feedback directly enhances the system's predictive accuracy. 

217 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.2.28 Web Feedback Page: Completed Promotions_ 

Figure 3.5.3.2.28 shows the web mockup for the post-campaign analysis interface, featuring a Completed Promotions module that evaluates past promotional performance by comparing predicted revenue lift against actual financial outcomes, alongside a direct user feedback mechanism designed to capture managerial input and continuously refine the accuracy of future AI recommendations by autonomous retraining of models. 

218 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.2.29 Web Feedback Page: Leraning Insights_ 

Figure 3.5.3.2.29 shows the web mockup for the Learning Insights module that quantifies how direct managerial input actively refines the AI's predictive algorithms. The interface highlights key system improvement metrics, while providing specific, text-based summaries of recent recalibrations, such as the system learning to prioritize highly effective afternoon cross-sell bundles over underperforming late-night flash sales. 

219 

## Q 4 a **UNIVERSITY OF SANTO TOMAS** ‘| E ° \ ryt 7, <afs 2 >gite **COLLEGE OF INFORMATION AND COMPUTING SCIENCES** a \\ Gos S% L o Oo %y, \ Oy & **Information Systems Department** ‘ 

_Figure 3.5.3.2.30 Web Audit Page_ 

Figure 3.5.3.2.30  shows the web mockup for the comprehensive audit log and activity tracking interface, featuring a detailed chronological record of both automated AI engine executions and manual administrative interventions. The module ensures granular operational oversight and accountability by systematically capturing transaction metrics across seven distinct parameters: Timestamp, User/System originator, Target Record, Action & Module, State Transition, Turnaround Time, and the final execution Status. 

220 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.2.31 Web Settings Page: Notification Preferences_ 

Figure 3.5.3.2.31 shows the web mockup for the System Settings module designed to manage WOOF system preferences and overarching data operations. The interface provides granular control through a Notification Preferences section, allowing users to toggle specific alerts for critical capacity and spoilage events, AI bundle suggestions, daily automated reports, and system updates. 

221 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.2.32 Web Settings Page: AI Model Configuration & Data Management_ 

Figure 3.5.3.2.32 shows the web mockup for the AI & Model Configuration module that 

allows administrators to toggle automatic model retraining, manually trigger system-wide retraining, and precisely define the minimum confidence threshold for algorithmic suggestions (currently displayed at 80%). Additionally, the interface includes a Data Management section providing granular control over data lifecycle policies, such as setting historical data retention limits to 90 days, alongside comprehensive data export capabilities. 

222 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.5.3.2.33 Web Settings Page: Appearance Option_ 

Figure 3.5.3.2.32 shows the web mockup for the visual personalization interface, featuring an Appearance configuration module designed to customize the overall dashboard experience. The interface provides users with a selection of distinct color themes, including the currently active "Pink Fusion" default, alongside alternative palettes such as "Ocean Breeze," "Sunset Glow," and "Minimal Gray", allowing for aesthetic tailoring of the application, positioned just above a dedicated panel for accessing System Information. 

ns) fow} 223 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## _Figure 3.5.3.2.33 Web Settings Page: System Information_ 

Figure 3.5.3.2.33 shows the web mockup for the technical overview interface, featuring a System Information module designed to display core application details and operational health metrics. The interface provides administrators with immediate visibility into critical system specifications, including the active software version, the currently deployed AI model, near real-time database connectivity status alongside latency tracking, and the precise timestamp of the most recent data synchronization. 

Additional interface components include modules for viewing detailed transaction records, analyzing customer behavior patterns, and interacting with an AI assistant. The AI assistant enables users to query the system and receive simplified explanations of analytical outputs, improving accessibility and understanding. These visual representations ensure alignment between system functionality and user expectations while supporting iterative design and development. 

## **3.5.4 System Generated Forms and/or Reports** 

The WOOF system generates various forms and reports to support operational monitoring and strategic decision-making. These include periodic sales reports, such as daily, 

224 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

weekly, and monthly summaries, which provide insights into revenue performance across different business sectors. Demand forecasting reports are also generated to project future sales trends, customer foot traffic, and inventory requirements based on predictive analytics. 

Inventory reports highlight current stock levels, potential shortages, and spoilage risks, enabling proactive inventory management. In addition, recommendation reports present suggested promotional campaigns, product bundles, and operational adjustments derived from prescriptive analytics. Sentiment analysis reports summarize customer feedback trends by categorizing reviews into positive, negative, and neutral sentiments. All reports are accessible through the dashboard and can be exported into a standard CSV format for further analysis and documentation. 

## **3.6 Data Gathering (With ETL)** 

**==> picture [343 x 82] intentionally omitted <==**

**----- Start of picture text -----**<br>
—— _ Integrated Data Saas :<br>Soles et — ste, svenae Collections campe eeatate‘andardize Merge POS [+][ Shopee][ +]<br>Inventory en ee ee +—<br>Cantina: GalGAAGTMart Mant F peereee oe DuplicatesHandle RemoveOutliers Align Timestamps,Product<br>Holidays, Customers)<br>< == J Feedback & Model Outputs<br>(Logs, Outcomes, Metrics)<br>Data Warehouse Layer<br>Figure 3.6.1 WOOF Data Gathering and ETL Pipeline<br>**----- End of picture text -----**<br>


Figure 3.6.1 illustrates the WOOF Data Gathering and ETL Pipeline, showing how operational data from multiple sources will be collected, validated, processed, and stored for 

225 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

analytics. The Source Layer includes e-commerce data from PetHub, TikTok Shop, and Shopee; unstructured customer review data from TikTok Shop, Shopee, and PetHub; internal records such as POS transactions, inventory records, and service records; and external API data from OpenWeatherMap and public holiday services. These data sources will enter the Extract Layer through three methods: NestJS webhook receivers for event-based extraction, NestJS API services for API-based extraction, and CSV or Excel uploads for batch historical data. Incoming records will first pass through Redis for streaming and queue management, then undergo validation checks such as schema validation, range checks, completeness checks, null checks, and drift checks. After validation, raw and semi-structured payloads will be stored in the MongoDB staging layer as raw POS, e-commerce, PetHub, API, campaign, and review data. 

After staging, the data will proceed to the Transform and Process Layer, where it will be cleaned, standardized, deduplicated, and integrated across POS, Shopee, TikTok Shop, and PetHub records. Related records will be aligned using timestamps, SKUs, product IDs, order IDs, booking IDs, customer reference IDs, and channel identifiers. The pipeline will also enrich the processed data through feature engineering, including time-based features, product combination patterns, sales trends, booking patterns, weather indicators, holiday indicators, and seasonality-related variables. The cleaned and validated outputs will then be loaded into the Supabase PostgreSQL analytical warehouse using structured fact tables, dimension tables, data marts, feedback logs, campaign activation records, and model output tables. Finally, these organized datasets will support the Sales Mart, Inventory Mart, Customer Behavior Mart, Forecasting Mart, Sentiment Mart, and Campaign Recommendation Mart, enabling WOOF to perform reliable reporting, forecasting, cross-selling analysis, sentiment monitoring, recommendation generation, and feedback-based model evaluation. 

226 

# **UNIVERSITY OF SANTO TOMAS** 9° =<azSw%, fe kL 2 &=ite) **COLLEGE OF INFORMATION AND COMPUTING SCIENCES** ¢ | J =Yo)©7 3 No, 1611 yws® **Information Systems Department** 

227 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## _Figure 3.6.2 WOOF Specific Model Pipeline_ 

Figure 3.6.2 illustrates the WOOF Specific Model Pipeline, showing how the system’s analytics components are organized into descriptive, predictive, and prescriptive layers. The descriptive analytics layer focuses on transforming integrated operational data into structured business summaries, including cross-channel sales and traffic monitoring, sales behavior and customer segmentation, inventory movement tracking, customer review monitoring, customer sentiment scoring, KPI evaluation, and automated report generation. These descriptive outputs provide the baseline information needed to understand current business performance, monitor inventory and service activity, and summarize customer feedback across channels. 

The predictive analytics layer uses the processed historical and near real-time data to estimate future operational conditions. This includes demand and foot traffic forecasting using Prophet and SARIMAX, service demand and queue modeling using Queueing Theory, spoilage risk prediction through inventory and sales-velocity indicators, customer segmentation and pattern recognition through clustering and behavior analysis, sentiment and topic extraction using VADER and LDA, and campaign impact prediction based on prior performance and business context. These predictive models allow WOOF to anticipate demand shifts, identify 

228 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

possible operational risks, and detect customer behavior patterns before they affect business performance. 

The prescriptive analytics layer translates descriptive and predictive outputs into owner-reviewable recommendations. It includes promotion and discount recommendations, cross-selling and bundle generation, inventory reorder and markdown suggestions, staffing and service allocation recommendations, customer retention recommendations, chatbot-assisted decision support, and automated report summarization. These recommendations are not treated as fully autonomous decisions; instead, they are presented to the business owner for review, modification, approval, or rejection before execution. Once approved, selected promotional or bundle outputs may be prepared for PetHub activation, while operational actions such as restocking, staffing, or in-store execution remain under owner and staff control. This pipeline ensures that WOOF supports human-governed, data-driven decision-making across sales, inventory, service, customer engagement, and cross-channel campaign planning. 

229 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Figure 3.6.3 WOOF Cross-Channel Pipeline_ 

230 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Figure 3.6.2 illustrates the WOOF Specific Model Pipeline, showing how the system’s analytics components are organized into descriptive, predictive, and prescriptive layers. The descriptive analytics layer focuses on transforming integrated operational data into structured business summaries, including cross-channel sales and traffic monitoring, sales behavior and customer segmentation, inventory movement tracking, customer review monitoring, customer sentiment scoring, KPI evaluation, and automated report generation. These descriptive outputs provide the baseline information needed to understand current business performance, monitor inventory and service activity, and summarize customer feedback across channels. 

The predictive analytics layer uses the processed historical and near real-time data to estimate future operational conditions. This includes demand and foot traffic forecasting using Prophet and SARIMAX, service demand and queue modeling using Queueing Theory, spoilage risk prediction through inventory and sales-velocity indicators, customer segmentation and pattern recognition through clustering and behavior analysis, sentiment and topic extraction using VADER and LDA, and campaign impact prediction based on prior performance and business context. These predictive models allow WOOF to anticipate demand shifts, identify possible operational risks, and detect customer behavior patterns before they affect business performance. 

231 

## 5 Bae a<. **UNIVERSITY OF SANTO TOMAS** N4 |3kv") OP. z[one S& **COLLEGE OF INFORMATION AND COMPUTING SCIENCES** Wl De **y** ! 2% kL a , fe} No7 weNy **Information Systems Department** . 

The prescriptive analytics layer translates descriptive and predictive outputs into owner-reviewable recommendations. It includes promotion and discount recommendations, cross-selling and bundle generation, inventory reorder and markdown suggestions, staffing and service allocation recommendations, customer retention recommendations, chatbot-assisted decision support, and automated report summarization. These recommendations are not treated as fully autonomous decisions; instead, they are presented to the business owner for review, modification, approval, or rejection before execution. Once approved, selected promotional or bundle outputs may be prepared for PetHub activation, while operational actions such as restocking, staffing, or in-store execution remain under owner and staff control. This pipeline ensures that WOOF supports human-governed, data-driven decision-making across sales, inventory, service, customer engagement, and cross-channel campaign planning. 

## **3.6.1 Data Extraction (Gathering)** 

_Figure 3.6.1.1 WOOF ETL Transformation and Feature Engineering Process_ 

Figure 3.6.1.1 illustrates the ETL transformation and feature engineering process 

of the WOOF system. After data is extracted from the POS system, Shopee, TikTok 

232 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Shop, PetHub, customer reviews, and external APIs, the records undergo a structured transformation process to ensure that they are accurate, consistent, and analytics-ready. The first stage is data cleaning, where the system standardizes data formats, handles duplicate records, and removes outliers that may affect the accuracy of reporting and model outputs. 

After cleaning, the data proceeds to the integration stage. In this stage, POS, Shopee, TikTok Shop, and PetHub records are merged into a unified cross-channel dataset. Related records are aligned using common identifiers such as timestamps, SKUs, product IDs, order IDs, booking IDs, and channel information. This allows the system to connect physical store transactions, e-commerce orders, PetHub activity, and customer interaction records into one structured analytics environment. 

The final stage is feature engineering, where the transformed data is converted into useful variables for the analytics models. These features include time-based indicators, product combination patterns, sales trends, and weather or seasonality-related indicators. These engineered features support WOOF’s descriptive analytics, demand and foot traffic forecasting, FP-Growth cross-selling analysis, sentiment monitoring, inventory alerts, staffing recommendations, and owner-reviewable campaign suggestions. Through this ETL process, raw and fragmented operational data are converted into clean, integrated, and model-ready datasets for the WOOF analytics pipeline. 

233 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **3.6.2 External Environmental Context APIs** 

To enable context-aware demand forecasting as outlined in the IPO model (Figure 1.5.1), the WOOF system integrates two critical external data sources that provide exogenous variables for the SARIMAX and Prophet forecasting models. These environmental context layers allow the system to account for factors beyond historical sales patterns, specifically weather conditions and calendar events that demonstrably impact retail foot traffic and purchasing behavior (Mansur et al., 2025). 

## **OpenWeather API Integration** 

The system will utilize the OpenWeather Current Weather Data API and 5-Day/3-Hour Forecast API to retrieve meteorological variables for Lucena City, Quezon Province. Current weather data is fetched every 3 hours via a NestJS Task Scheduler cron job, while the 5-day forecast is retrieved daily at 6:00 AM Philippine Time to pre-load upcoming context for demand planning. 

## **Temperature** 

The temperature variable is retrieved in Celsius and integrated as a continuous variable to detect temperature-dependent demand shifts across product categories. The system will analyze correlations between thermal conditions and sales patterns for beverages (hot versus cold). This variable is passed as a continuous exogenous regressor to SARIMAX for sales forecasting **.** 

## **Precipitation** 

234 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Rainfall volume is captured in millimeters through the rain.1h and rain.3h parameters. Research demonstrates that adverse weather conditions, particularly rainfall, significantly reduce physical retail foot traffic (Mansur et al., 2025). The system integrates precipitation data to dynamically adjust promotional strategies between physical storefront and e-commerce channels during weather disruptions. Both binary transformation (rainy day: 1, dry day: 0) and continuous rainfall volume are fed into Prophet and SARIMAX. 

## **Abstract Public Holidays API Integration** 

The WOOF system will integrate the Abstract Holidays API to retrieve official Philippine national holidays and region-specific observances relevant to Quezon Province. Holiday data is fetched once per month and cached in MongoDB, with the system maintaining a rolling 90-day holiday calendar. 

## **National Holidays** 

National holiday data includes observances such as New Year's Day, Independence Day, Christmas, and Eid al-Fitr. The system will analyze historical transaction data aligned with national holidays to identify demand patterns and consumption spikes. Holiday indicators enable the forecasting models to account for non-standard demand cycles that differ from regular weekday and weekend patterns. 

## **Regional Observances** 

Regional observances such as local fiestas and Quezon Province foundation day are integrated to capture localized demand variations specific to the Lucena City market. 

235 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

The WOOF system will evaluate whether these events correlate with increased service bookings or product sales. 

## **Holiday Proximity Indicators** 

The system programmatically derives three binary flags from the Abstract Holidays API response: dayBeforeHoliday (1 if date equals holiday date minus one day, else 0), isHoliday (1 if date matches a retrieved holiday, else 0), and dayAfterHoliday (1 if date equals holiday date plus one day, else 0). These temporal proximity indicators are passed to the SARIMAX and Prophet models as exogenous regressors. During model training, the algorithms automatically learn the strength and direction of demand variations associated with each temporal position relative to holidays. When the system detects an upcoming holiday in the calendar feed, these flags enable the forecasting models to adjust predictions based on learned pre-holiday, holiday, and post-holiday purchasing patterns. 

## **3.6.3 Data Transformation (Cleaning and Preprocessing)** 

Given that the gathered data comes from highly disparate sources, the raw data will undergo rigorous cleaning and standardization within the NestJS backend before analysis. The transformation phase will include: 

## **Data Cleaning and Deduplication** 

236 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

The system will identify and resolve inconsistent, missing, or anomalous values resulting from human error in manual recording frameworks. Duplicate records from overlapping physical and digital sales will be filtered out. 

## **Format Standardization** 

Variables such as timestamps, product SKUs, and currency formats will be standardized to establish a cohesive "Behavioral Bridge" across the cafe, retail, and service sectors. 

## **Data Normalization** 

To optimize the performance of the machine learning algorithms (such as FP-Growth and time-series forecasting), the data will undergo normalization. Exponential Moving Average (EMA) normalization will be applied to emphasize recent observations, ensuring that the predictive models account for the most current business trends. 

## **3.6.4 Data Loading and Near Real-Time Integration** 

## **Database Architecture** 

The cleaned and validated datasets will be loaded into the PostgreSQL analytical warehouse, while raw and semi-structured source records will remain preserved in MongoDB staging collections for audit, traceability, and possible reprocessing. This two-layer database architecture allows WOOF to use PostgreSQL for structured analytical processing, relational joins, fact and dimension tables, KPI computation, and 

237 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

model-ready datasets, while MongoDB supports flexible staging and efficient handling of document-oriented, unstructured, and JSON-based records from multiple APIs. 

## **Near Real-Time Distribution** 

To ensure that the generated business intelligence is actionable, the system will utilize WebSockets. This will push near real-time data updates, inventory alerts, and predictive recommendations from the MongoDB database directly to the frontend interfaces. The insights will be simultaneously accessible via the Next.js Web Dashboard and the Expo React Native (with Expo Router) mobile app for executive monitoring, with the mobile application serving as a responsive on-the-go access portal for the Cafe Owner. 

## **3.7 Hybrid Database Architecture** 

The WOOF database architecture will use MongoDB as the staging layer and PostgreSQL as the final analytical warehouse. MongoDB will store raw source records collected from POS exports, Shopee, TikTok Shop, PetHub, customer reviews, and external context sources. These records may contain nested line items, platform-specific metadata, and unstructured review text. After ingestion, the ETL process will clean, validate, deduplicate, and transform the records into standardized analytical fields. 

PostgreSQL will serve as the final data warehouse because WOOF’s analytical reporting requires a structured star schema. The central fact table, FactCrossChannelTransactions, will store measurable business events such as quantity sold, gross sales, discount amount, net 

238 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

sales, and order status. The surrounding dimension tables, including DateDim, ProductDim, CustomerDim, ChannelDim, ServiceDim, CampaignDim, and BusinessSegmentDim, will provide descriptive context for filtering, aggregation, forecasting, cross-selling, inventory monitoring, and campaign evaluation. 

_Figure 3.7.1 MongoDB Staging Collection_ 

239 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## _Figure 3.7.2 PostgreSQL Star Schema_ 

## **3.8 Business Analytics Tools, Techniques, and Specific Applications** 

This section outlines the core analytical framework of the proposed WOOF system, detailing the specific tools, mathematical models, and algorithms used to transform raw cross-channel data into structured business intelligence and owner-reviewable recommendations. Before the analytics techniques are applied, WOOF first processes incoming POS, Shopee, TikTok Shop, PetHub, customer review, inventory, weather, and holiday data 

240 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

through the system’s ingestion and ETL pipeline. MongoDB serves as the raw data lake and staging layer for webhook payloads, API responses, review data, and CSV uploads, while Supabase PostgreSQL stores the cleaned and validated fact tables, dimension tables, data marts, feedback logs, and model outputs used by the analytics engines. 

The analytical pipeline is divided into descriptive, predictive, and prescriptive analytics. The descriptive layer summarizes historical sales, inventory movement, service activity, customer reviews, campaign records, and cross-channel performance. The predictive layer focuses on forecasting future operational conditions, such as demand, service booking volume, foot traffic, inventory risk, customer sentiment patterns, and campaign opportunities. The prescriptive layer then uses these outputs to generate data-driven recommendations for restocking, staffing, promotional timing, cross-selling bundles, and PetHub-ready campaign preparation. By integrating these methodologies, WOOF supports Happy Tails Pet Cafe in shifting from manual, intuition-based management toward a structured, data-driven, and owner-governed decision-support workflow. 

## **3.8.1 Predictive Analytics Techniques** 

Predictive analytics techniques will be used to analyze historical and near-real-time cross-channel data in order to identify patterns, estimate future demand, and anticipate operational trends. Before these techniques are applied, raw data from the POS system, Shopee, TikTok Shop, PetHub, customer reviews, inventory records, and external APIs will first pass through the ingestion and ETL pipeline. MongoDB will serve as the raw data lake and staging layer for webhook payloads, API responses, customer reviews, and CSV uploads, while 

241 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Supabase PostgreSQL will store the cleaned fact tables, dimension tables, data marts, feedback logs, and model outputs used by the analytics engines. These structured datasets will support forecasting, customer behavior analysis, sentiment monitoring, foot traffic prediction, and campaign performance evaluation. 

## **3.8.1.1 Demand Forecasting** 

To predict future cross-channel sales and demand patterns, WOOF will employ time-series forecasting techniques using Meta’s Prophet and SARIMAX. Prophet will be used because it can handle seasonal patterns, irregular trends, missing values, and non-linear retail demand behavior. SARIMAX will be used to incorporate exogenous variables such as weather conditions, holidays, seasonality, and other contextual factors that may affect demand. These models will process cleaned historical and operational data from the physical POS system, Shopee, TikTok Shop, and PetHub. The generated forecasts will support owner-reviewable recommendations for inventory planning, staffing visibility, promotional timing, and campaign preparation. 

## **3.8.1.2 Market Basket Analysis** 

Market Basket Analysis will be implemented using association rule mining, specifically the FP-Growth algorithm. This technique will identify frequent item sets and uncover relationships among products and services based on transaction and booking data from the POS system, Shopee, TikTok Shop, and PetHub. The analysis will generate association rules using support, confidence, and lift to determine meaningful 

242 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

product or service combinations. These results will help WOOF identify possible cross-selling opportunities, bundle candidates, and PetHub-ready campaign ideas for owner review. 

## **3.8.1.3 Sentiment Analysis** 

Natural Language Processing techniques will be applied to analyze customer reviews and feedback collected from Shopee, TikTok Shop, and PetHub. The system will use VADER for sentiment classification because it is suitable for short, informal, and platform-based review text, allowing feedback to be categorized as positive, negative, or neutral. TF-IDF will be used to extract important review keywords by identifying terms that frequently appear in customer feedback but are not common across all reviews. Latent Dirichlet Allocation (LDA) will then be applied for topic modeling to identify recurring themes related to product quality, service experience, delivery concerns, grooming feedback, or customer satisfaction. These outputs will help WOOF detect customer satisfaction trends, recurring complaints, and possible product or service concerns that can support inventory quality control, service improvement, and owner-reviewable recommendations. 

## **3.8.1.4 Foot Traffic Prediction** 

Foot traffic prediction will be used to estimate customer volume and peak activity periods based on historical POS transactions, PetHub service booking records, timestamps, day-of-week patterns, holidays, weather indicators, and other temporal variables. The system will use Prophet and SARIMAX to forecast expected customer 

243 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

activity and demand fluctuations across different time periods. Prophet will help capture recurring seasonal patterns such as weekday, weekend, and monthly demand changes, while SARIMAX will allow the inclusion of exogenous variables such as weather conditions and holidays. For service-related waiting time and capacity estimation, the system will also apply Queueing Theory using the M/M/c model to estimate service congestion, average waiting time, and required service capacity. These predictions will support staffing recommendations, service scheduling visibility, inventory readiness, and promotional timing. The output will not automatically assign staff or execute schedules; instead, it will provide the owner with decision-support insights for review and implementation. 

## **3.8.2 Prescriptive Analytics Techniques** 

Prescriptive analytics techniques will be used to convert descriptive and predictive outputs into actionable, owner-reviewable recommendations. These techniques will use results from demand forecasting, Market Basket Analysis, sentiment analysis, inventory monitoring, and foot traffic prediction to generate context-aware recommendations. The system will suggest possible actions related to promotions, product bundling, inventory planning, and staff scheduling, but final approval, modification, rejection, or execution will remain under the control of the business owner. 

244 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **3.8.2.1 Promotion Recommendation** 

Promotion recommendations will be generated using rule-based logic that combines demand forecasts, product performance, inventory movement, customer purchasing patterns, sentiment results, and campaign history. Products with declining demand, low sales velocity, excess stock, or spoilage risk are not merely flagged for passive observation; the engine actively funnels them into liquidation workflows. The recommendation engine automatically converts these operational stock alerts into prescriptive promotional actions, such as direct price markdowns or bundle pairing opportunities. High-demand items or frequently associated products will be recommended for standard high-affinity bundles, seasonal campaigns, or limited-time offers. For under-purchased items, the system suggests specific clearance discount ranges, high-velocity product anchors for low-association pairing, optimized campaign timing, and target channels to accelerate capital recovery, with all outputs remaining subject to owner review and approval before publication or execution through PetHub. 

## **3.8.2.2 Product Bundling** 

Product bundling recommendations will be derived from association rules generated through Market Basket Analysis, employing a two-pronged operational logic. Itemsets with high support, confidence, and lift values will be selected as standard high-affinity bundle candidates. The system will prioritize combinations that frequently occur in cross-channel transactions and demonstrate strong co-purchase relationships. Parallel to this frequency-based approach, the system executes an inventory-driven 

245 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

bundling strategy specifically targeting slow-moving or under-purchased items. When an inventory asset falls below its target turnover velocity, the bundling engine intentionally relaxes standard market basket filters to construct low-association promotional pairings. This mechanism attaches the stagnant item to a high-turnover anchor product within related business lines, creating package deals, combo offers, or PetHub-ready campaign drafts designed to clear cafe shelves. Final bundle approval, pricing adjustments, promotional wording, and distribution channels remain strictly under owner governance. 

## **3.8.2.3 Inventory Optimization** 

Inventory optimization will be performed using forecast-driven decision rules combined with current stock level monitoring. Demand forecasts will be compared with available inventory levels to identify possible stock shortages, overstocking, slow-moving items, spoilage risks, and reorder needs. When predicted demand exceeds available stock, the system may generate restocking recommendations. When inventory movement is low, the system may recommend markdowns, promotional campaigns, or bundle inclusion. These outputs will support better inventory planning but will not automatically purchase stock, change prices, or modify listings without owner approval. 

## **3.8.2.4 Staff Scheduling** 

Staff scheduling recommendations will be based on predicted foot traffic, service booking volume, transaction patterns, and predefined staffing thresholds. The system will identify peak and off-peak periods and suggest possible staff allocation adjustments to maintain service quality during high-demand periods while reducing unnecessary staffing during low-demand periods. These recommendations will support the owner in 

246 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

planning shifts and assigning tasks, but actual scheduling decisions and staff deployment will remain under owner or management control. 

## **3.9 Business Analytics Model and Testing** 

The proponents of the capstone study will employ a comprehensive data analytics pipeline categorized into Descriptive, Predictive, and Prescriptive phases. Under the hybrid database architecture, the analytics models will use cleaned and structured records from the PostgreSQL star schema warehouse as their primary analytical input. Raw source records from POS, Shopee, TikTok Shop, PetHub, customer reviews, weather, and holiday sources will remain preserved in MongoDB staging collections for audit, traceability, and possible reprocessing. This separation ensures that the analytics modules operate on validated and standardized data while still retaining the original raw records for verification when needed. 

To ensure empirical validity and algorithmic soundness, each predictive model, prescriptive heuristic, and analytics assistant component will undergo evaluation using standard data science testing metrics and system-level performance indicators. The following framework details the models applied and how they will be systematically tested. In addition to model-level evaluation, the framework also evaluates how selected recommendations are transformed into owner-approved campaign outputs through the PetHub Recommendation Activation Layer and Generative Campaign Copilot. 

247 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **3.9.1 WOOF Demand & Foot Traffic Forecaster** 

Will be evaluated using Time-Series Cross-Validation (Backtesting). The primary evaluation metrics will be the Root Mean Square Error (RMSE) and Mean Absolute Percentage Error (MAPE). The EOQ outputs will be validated through historical simulation. 

The performance of the demand forecasting models will be evaluated using RMSE and MAPE. MAPE measures the average percentage deviation between predicted and actual values. 

The baseline forecasting performance was established through initial model testing using historical data, where the models achieved a Mean Absolute Percentage Error (MAPE) of  20% or lower. This baseline falls within the acceptable threshold for retail forecasting, where MAPE values of 20% or below are considered satisfactory due to demand variability and external influencing factors (Saeed et al., 2023). 

This baseline value will serve as the reference point for evaluating forecasting effectiveness, and any further improvements in model performance will be assessed relative to this initial result. RMSE will be used alongside MAPE to measure the magnitude of prediction errors. 

## **Key Performance Indicators** 

## **Forecast Accuracy** _**(Target: ≤ 20%)**_ 

Measures how closely predicted demand matches actual demand. The baseline MAPE of approximately ≤ 20% serves as the reference point for acceptable forecasting performance (Saeed et al., 2023). 

248 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **Stockout Rate** _**(Target: reduce by at least 10–15% from baseline)**_ 

Stockout Rate = (Number of Stockout Events / Total Demand Occasions) × 100 

## **Inventory Turnover Ratio** _**(Target: improve by at least 10%)**_ 

Inventory Turnover = Cost of Goods Sold / Average Inventory 

## **Descriptive Analytics** 

## **Time Series Aggregation** 

Time Series Aggregation (TSA) is the statistical process of collecting and summarizing historical data points over specific time intervals. Following Wogrin's (2022) output-error-based paradigm, TSA is utilized not merely to compress data, but to temporally align raw cross- channel data (e.g., by hour or day) specifically to preserve intricate fluctuations required for accurate demand and promotional forecasting. 

## **Moving Averages** 

A calculation used to analyze data points by creating a series of averages of different subsets of the full dataset. As validated by Alharbi and Csala (2022), Weighted Moving Averages remain robust at smoothing out chaotic temporal data and providing reliable, short-term predictive benchmarks, making it the ideal first layer of defense against fast-moving inventory stockouts. 

## **Predictive Analytics** 

## **Prophet by META** 

249 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Prophet is an additive regression model for forecasting time-series data. According to Saeed et al. (2023), Prophet is highly resilient to missing data, outliers, and extreme seasonal shifts, making it superior for business forecasting where data is sparse and heavily influenced by external events like weekend spikes. 

## **SARIMAX (Seasonal Auto-Regressive Integrated Moving Average with eXogenous factors)** 

SARIMAX extends traditional ARIMA models by incorporating both seasonality and external variables. As demonstrated by (2024), SARIMAX effectively aggregates daily sales data and captures the influence of external factors, such as climate variability and holidays, to optimize predictions. This satisfies the need for context-aware forecasting supported by Mansur et al. (2025). 

## **Prescriptive Analytics** 

## **Economic Order Quantity Algorithm** 

EOQ is a mathematical operations formula that determines the ideal order quantity to minimize total inventory costs. As noted by Zanabazar et al. (2025), implementing the EOQ method systematically reduces inventory holding costs by strictly calculating optimal order sizes and reorder points, providing a data-driven prescription rather than relying on guesswork. 

250 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **3.9.2 Smart Bundle & Cross-Selling Engine** 

The module will be evaluated using rule interestingness metrics, specifically Support, Confidence, and Lift. The model will undergo historical hold-out validation to check if generated rules successfully recur in a separated 20% test set of historical receipts. 

The effectiveness of the cross-selling engine will be evaluated using Support, Confidence, and Lift metrics. Only rules meeting thresholds of Support ≥ 0.05, Confidence ≥ 0.60, and Lift ≥ 1.20 will be considered significant. These thresholds ensure that generated association rules are both statistically relevant and actionable for business decision-making. 

## **Key Performance Indicators** 

## **Cross-Sell Rate** _**(Target: increase by at least 10% from baseline)**_ 

Cross-Sell Rate = (Transactions with Bundled Items / Total Transactions) × 100 

## **Average Basket Size** _**(Target: increase by at least 5–10% from baseline)**_ 

Avg Basket Size = Total Items Sold / Total Transactions 

## **Revenue per Transaction** _**(Target: increase by at least 5–10% from baseline)**_ 

Revenue per Transaction = Total Revenue / Total Transactions 

## **Descriptive Analytics** 

## **Master Data Management (MDM) via Transaction Frequency Matrix** 

MDM is a data governance method that maps disparate data sources into a single matrix. According to Sharma (2024), implementing a robust MDM 

251 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

framework enables enterprises to consolidate disparate data silos, creating a unified "golden record" that acts as a critical prerequisite for ensuring predictive algorithms process reliable, standardized information. 

## **Predictive Analytics** 

## **FP-Growth Algorithm** 

FP-Growth is an association rule mining algorithm that finds frequent itemsets without candidate generation. As highlighted by Yu (2024) and supported by Hunyadi et al. (2025), this algorithm is superior for large-scale e-commerce environments as it mines patterns using a compressed FP-tree structure, making it computationally faster and highly scalable compared to traditional Apriori models. 

FP-Growth was selected instead of Apriori because it is more efficient for mining frequent itemsets from transactional data. Unlike Apriori, which repeatedly generates candidate itemsets and scans the database multiple times, FP-Growth uses an FP-tree structure to compress transactions and extract frequent patterns without repeated candidate generation. This makes it more suitable for analyzing POS and e-commerce transactions in the WOOF system. 

A hybrid approach was not used because the study focuses on interpretable and SME-appropriate analytics. Hybrid recommendation models require more complex customer-level data and validation, while FP-Growth 

252 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

directly supports the objective of identifying explainable product and service associations for cross-selling and bundle recommendations. 

## **Prescriptive Analytics** 

## **Automated Threshold Triggering** 

A rule-based logic gate that executes a command only when predefined statistical values are met. Aligning with Samineni's (2020) framework, predefined thresholds (such as minimum Confidence and Lift values) are necessary to prevent illogical system interventions, ensuring that cross-selling promotions are backed by hard statistical data. 

## **3.9.3 "Happy Hour" Dynamic Promo Engine** 

Evaluated using K-Fold Cross-Validation. Performance will be measured using a Confusion Matrix, specifically tracking Precision, Recall, and the F1-Score to minimize false positives. 

The performance of the promotional classification model will be evaluated using Precision, Recall, and F1-Score. Precision ensures that recommended promotions are relevant, while Recall ensures that potential opportunities are not missed. The F1-Score balances both metrics. 

## **Key Performance Indicators** 

## **Sales Uplift** _**(Target: maintain or improve by at least 5–10% during promoted periods)**_ 

Sales Uplift = ((Sales_after - Sales_before) / Sales_before) × 100 

253 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **Promotion Conversion Rate** _**(Target: increase by at least 10% from baseline)**_ 

Conversion Rate = (Promo Transactions / Total Transactions) × 100 

## **Inventory Reduction Rate** _**(Target: reduce slow-moving inventory by at least 10–15%)**_ 

Inventory Reduction = ((Old Stock - New Stock) / Old Stock) × 100 

## **Descriptive Analytics** 

## **Historical Discount Tracking** 

This metric logs past promotional events to calculate their exact Return on Investment (ROI). According to Biswas (2024), evaluating past campaigns is a critical prerequisite because measuring the true incrementality of customized future promotions heavily relies on the quantitative tracking of historical performance. Establishing this precise historical baseline ensures that WOOF's predictive algorithms can reliably forecast future demand elasticity, guaranteeing that the system's automated promotional triggers are mathematically optimized to maximize revenue rather than executing blind, unprofitable price cuts. 

## **Predictive Analytics** 

## **Random Forest Classifier** 

An ensemble machine learning algorithm that builds multiple decision trees to classify data. As outlined by Palczewska (2024), Random Forest effectively mitigates overfitting and is highly adept at processing complex, non-linear operational datasets (such as shifting weather combined with time of day) to output accurate probability scores. 

254 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **Prescriptive Analytics** 

## **Prescriptive Rule-Based Heuristics** 

Hard-coded conditional logic that prescribes specific operational actions based on incoming predictive scores. Applying the framework emphasized by Nadurak (2022), this method accelerates decision-making by establishing pre-defined guidelines that securely translate complex predictive probabilities into concrete, actionable steps without requiring continuous human oversight. 

## **3.9.4 Service Maximizer** 

The models will be tested using Monte Carlo Simulation and Sensitivity Analysis to verify if the prescribed staffing levels successfully maintain waiting times below target thresholds under varying arrival rates. 

The effectiveness of the service optimization model will be evaluated based on Average Waiting Time and Service Utilization Rate. The model is considered effective if waiting times remain below predefined operational thresholds (≤ 15 minutes) while maintaining high staff utilization efficiency. Sensitivity analysis will validate system robustness under varying demand conditions. 

## **Key Performance Indicators** 

## **Customer Throughput** _**(Target: increase by at least 10% from baseline)**_ 

Throughput = Customers Served / Time Period 

255 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **Descriptive Analytics** 

## **Service Occupancy Mapping** 

A descriptive metric calculating the ratio of a groomer's active working time against their shift duration. According to Rizki and Dhewanto (2025), strategic capacity planning must begin with evaluating initial resource utilization conditions to clarify operational constraints before deploying advanced scheduling models. This is supported by Owczarek (2025), who states that tracking unit utilization enables agile management. 

## **Predictive Analytics** 

## **Queueing Theory (M/M/c Model)** 

A mathematical model where arrivals follow a Poisson process, service times are exponential, and there are $c$ servers. As analyzed by D'Auria et al. (2022), the $M/M/c$ model specifically addresses operational scenarios with unpredictable, stochastic arrival rates and variable service durations, accurately mimicking the unpredictable nature of walk-in pet grooming services. 

## **Prescriptive Analytics** 

## **Linear Programming (LP)** 

A mathematical optimization technique used to achieve the best possible outcome within given constraints. As illustrated by Lee et al. (2024) regarding Mixed-Integer Linear Programming, it is an elite framework capable of assigning precise time schedules while strictly adhering to finite resource limitations, 

256 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

guaranteeing the optimal minimum number of active grooming staff. 

## **3.9.5 Customer Sentiment Radar** 

VADER will be tested via Human-in-the-Loop validation for its Sentiment Accuracy Rate. The LDA topic model will be evaluated using the Topic Coherence Score. 

Sentiment analysis performance will be evaluated using Sentiment Accuracy Rate, defined as the proportion of correctly classified sentiment labels. In cases where labeled data is limited, trend analysis of sentiment distribution will be used. The LDA model will be evaluated using Topic Coherence Score, ensuring that extracted topics are semantically meaningful and interpretable. 

For potential fake reviews, the system will utilize TF-IDF to detect repeated textual patterns, unusually similar review structures, and frequently repeated phrases across multiple reviews. Since fake or low-quality reviews often follow similar wording, templates, or repetitive formats, TF-IDF will help identify duplicated or highly similar review content that may distort sentiment results. Reviews flagged as suspicious will not be automatically deleted but will be marked for management review to avoid incorrectly removing valid customer feedback. 

For Taglish reviews, the system will apply text normalization before VADER sentiment scoring. Common Filipino and Taglish terms will be mapped to their English sentiment equivalents using a custom sentiment dictionary. For example, positive terms such as “maganda,” “mabango,” “sulit,” and “okay naman” may be mapped to positive sentiment, while negative terms such as “pangit,” “sira,” “late,” “tagal,” and “kulang” may be mapped to negative 

257 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

sentiment. Informal spellings, repeated characters, emojis, and slang expressions will also be normalized during preprocessing. 

Since VADER is primarily designed for English-language sentiment analysis, Taglish reviews may not always be classified accurately using VADER alone. To address this limitation, the system will combine preprocessing, keyword mapping, and manual validation for ambiguous reviews. Reviews with low confidence scores or mixed sentiment expressions will be flagged for human verification to ensure that customer feedback is interpreted more accurately. 

## **Key Performance Indicators** 

## **Customer Sentiment Score** _**(Target: maintain positive score above 0 and improve over**_ 

## _**time)**_ 

Sentiment Score = (Positive Reviews - Negative Reviews) / Total Reviews 

## **Negative Feedback Rate** _**(Target: maintain at ≤ 20% or reduce over time)**_ 

Negative Rate = (Negative Reviews / Total Reviews) × 100 

## **Descriptive Analytics** 

## **VADER (Valence Aware Dictionary and sEntiment Reasoner)** 

VADER is a lexicon-based sentiment analysis tool, supported by the Term Frequency-Inverse Document Frequency (TF-IDF) feature extraction algorithm. As noted by Youvan (2024), VADER accurately decodes modern syntactic cues like slang and emojis in digital communication. Furthermore, Alqurafi and Alsanoosy (2024) along with Aydoğan and Okay (2024) demonstrate that 

258 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

integrating TF-IDF effectively filters informal language and isolates sentiment-heavy keywords from unstructured e-commerce reviews, improving overall model accuracy. 

## **Predictive Analytics** 

## **Latent Dirichlet Allocation (LDA) Topic Modeling** 

LDA is an unsupervised generative statistical model that automatically categorizes unobserved themes within text. As detailed by Chidi et al. (2024), LDA allows analytical systems to autonomously cluster large volumes of digital feedback and extract core consumer concerns with high accuracy, eliminating the labor-intensive requirement of manual data pre-labeling. 

## **Prescriptive Analytics** 

## **Automated Alert Routing** 

A near real-time notification engine that dispatches targeted alerts based on identified semantic tags. Applying strategies emphasized by Verma (2026), this targeted automation categorizes issues by severity and relevance, preventing alert fatigue and ensuring that critical operational anomalies (like product defects) are immediately addressed by the correct personnel. 

## **3.9.6 WOOF AI Chatbot** 

The chatbot will be evaluated using Execution Accuracy, Query Match Rate, Query Resolution Rate, Average Response Time, Unsafe Query Block Rate, and User Acceptance Testing (UAT). Execution Accuracy refers to the percentage of validated SQL queries that 

259 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

execute without errors. Query Match Rate measures how well the generated or selected query aligns with the user’s intended business question. Final output relevance, clarity, and usability will undergo User Acceptance Testing (UAT). 

The WOOF AI Chatbot will use Claude integration to interpret natural-language questions and map them to approved SQL query templates, saved analytical queries, and PostgreSQL warehouse views. Under the hybrid database architecture, the chatbot will use cleaned and structured records from the PostgreSQL star schema warehouse as its primary analytical input, while raw source records will remain preserved in MongoDB staging collections for audit, traceability, and possible reprocessing. The chatbot will not directly query raw MongoDB staging collections. 

To ensure safety and correctness, the chatbot will follow a controlled NL2SQL approach. Claude may assist in interpreting the user’s intent and generating or selecting the appropriate SQL-based analytical query, but the generated query will pass through backend validation before execution. The backend will check approved warehouse views, allowed tables, allowed fields, and read-only query rules. Only SELECT-based analytical queries will be permitted, while unsafe commands such as INSERT, UPDATE, DELETE, DROP, ALTER, and TRUNCATE will be blocked. 

## **Key Performance Indicators** 

## **Query Resolution Rate** _**(Target: ≥ 85% successful query resolution)**_ 

Resolution Rate = (Successfully Answered Queries / Total Queries) × 100 

260 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **Execution Accuracy** _**(Target: ≥ 90% error-free validated SQL executions)**_ 

Execution Accuracy = (Error-Free Validated SQL Executions / Total Validated SQL Executions) × 100 

## **Query Match Rate** _**(Target: ≥ 85% correctly matched queries)**_ 

Query Match Rate = (Correctly Matched Queries / Total Test Queries) × 100 

## **Unsafe Query Block Rate** _**(Target: 100% unsafe query blocking)**_ 

Unsafe Query Block Rate = (Unsafe Queries Blocked / Total Unsafe Test Queries) × 100 

## **User Satisfaction Score** _**(Target: ≥ 4.0/5.0)**_ 

Based on user rating using a 1–5 scale. 

## **Average Response Time** _**(Target: ≤ 5 seconds)**_ 

Response Time = Total Response Time / Number of Queries 

## **Descriptive Analytics** 

## **Controlled Natural Language to SQL (Controlled NL2SQL)** 

A controlled analytics query framework that uses Claude integration to interpret natural-language business questions and map them to approved SQL query templates, saved analytical queries, or PostgreSQL warehouse views. Unlike unrestricted NL2SQL, this approach does not allow the chatbot to directly execute any generated SQL statement. The query must first pass backend validation to ensure that it uses only approved tables, fields, views, and read-only SELECT operations. This allows non-technical users to retrieve descriptive 

261 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

insights such as sales summaries, product performance, sales by channel, low-demand periods, slow-moving items, inventory movement, recurring customer feedback topics, and campaign performance results from the cleaned PostgreSQL warehouse. 

## **Predictive Analytics** 

## **Few-Shot Intent Classification** 

An NLP technique that predicts the user’s core business intent using minimal training examples. This approach leverages Claude’s pre-trained semantic understanding and a documented schema context to classify user requests into supported analytics intents such as sales inquiry, inventory inquiry, forecasting inquiry, cross-selling inquiry, sentiment inquiry, campaign performance inquiry, and general dashboard assistance. The classified intent will then be routed to the appropriate approved SQL query, saved query, warehouse view, or analytics module. This reduces the need for complete model retraining while helping the chatbot respond to different forms of owner questions. 

## **Prescriptive Analytics** 

## **System-Prompted Business Heuristics and Backend Query Validation** 

A controlled decision-support approach that uses strict system prompts, approved business rules, and backend query validation to keep chatbot responses within WOOF’s supported analytics scope. The system prompts instruct the chatbot to avoid unsupported claims, explain results in 

262 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

business-oriented language, and recommend only owner-governed actions based on validated analytics outputs. Backend validation ensures that the chatbot can only execute approved, read-only analytical queries against the PostgreSQL warehouse. 

The chatbot may suggest possible actions such as reviewing slow-moving items, checking inventory risks, preparing owner-approved campaign drafts, examining recurring negative feedback topics, or viewing sales trends. However, it will not autonomously modify records, publish campaigns, change prices, update listings, or execute operational decisions. All recommendations will remain advisory and subject to owner review and approval. 

## **3.9.7 Feedback Loop** 

Will be tested via Simulated Drift Injection. Proponents will introduce synthetic data anomalies to verify the engine's True Positive Rate in detecting drift without excessive false alarms. 

The feedback loop will be evaluated using True Positive Rate (TPR) and False Positive Rate (FPR) in detecting concept drift. The system is considered effective if it accurately detects drift events while minimizing false alarms. Model performance improvement over time will also be monitored using historical error trends. 

The feedback loop will only use ETL-validated operational data for model evaluation and retraining. Before new data is used by the feedback loop, it must pass preprocessing procedures such as schema validation, duplicate detection, SKU and service mapping, 

263 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

timestamp standardization, missing-value handling, source-channel verification, and anomaly flagging. Records that are incomplete, duplicated, unmapped, suspicious, or inconsistent will be stored in error logs or quarantine records instead of being directly used for retraining. This ensures that the system learns from reliable business feedback rather than from raw, erroneous, duplicated, or incomplete data. 

In addition to predictive model errors, the feedback loop will also monitor prescriptive recommendation outcomes, including owner approval or rejection of generated bundles, bundle redemption rate, campaign performance, sales uplift, and recommendation usefulness feedback. These outcomes will help determine whether the system’s recommendation rules, bundle rankings, association thresholds, or strategic bundling heuristics require adjustment in future batch cycles. 

## **Key Performance Indicators** 

## **Model Drift Detection Rate** _**(Target: ≥ 80% detection of simulated drift events)**_ 

Detection Rate = (Detected Drift Events / Actual Drift Events) × 100 

**Model Accuracy Improvement** _**(Target: improve model accuracy by at least 5% after retraining)**_ 

Improvement = (New Accuracy - Old Accuracy) / Old Accuracy × 100 

## **Descriptive Analytics** 

**Model Evaluation Tracking** 

264 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

An automated system logging predictive error rates over time. Applying the principles outlined by Song et al. (2022), continuously monitoring algorithm performance against historical baselines using standardized metrics allows organizations to rapidly detect concept drift and algorithmic anomalies before they negatively impact business decision-making. 

Model evaluation tracking in WOOF will automatically compare actual outcomes against the system’s previous forecasts and recommendations. These actual outcomes may include sales results, service booking volume, inventory movement, campaign outcomes, and recommendation acceptance or rejection. The logged performance errors will serve as the basis for determining whether the current model remains reliable or whether the system should trigger batch retraining. 

## **Predictive Analytics** 

## **Concept Drift Detection (ADWIN)** 

Adaptive Windowing (ADWIN) detects changes in a data stream's statistical properties. As detailed by Assis and Souza (2025), ADWIN continuously monitors live data streams and automatically resizes its tracking window when distribution shifts occur, ensuring the system remains responsive to emerging trends without manual recalibration. 

265 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

ADWIN will automatically detect possible concept drift by monitoring changes in incoming operational data streams. When significant distribution shifts are detected, the system will flag the affected forecasting model, recommendation rule set, or bundling logic for scheduled or trigger-based batch retraining, rule refresh, or recommendation recalibration. The retrained output or updated rule set will be evaluated before it is accepted as the active model or active recommendation logic. 

## **Prescriptive Analytics** 

## **Automated Batch Retraining** 

A scheduled pipeline that retrains machine learning models on fresh data partitions. Utilizing the strategies highlighted by Wong and Perumal (2025), batch retraining optimizes resource allocation by processing recent data in consolidated cycles, efficiently mitigating model degradation without causing disruptive computational latency during busy hours. 

WOOF uses automated batch retraining rather than continuous per-transaction learning. This means that the model will not update after every individual sale, booking, review, or campaign interaction. Instead, retraining will occur through scheduled or trigger-based batch cycles using accumulated ETL-validated data. This approach prevents unstable model updates, reduces computational load, and ensures that retraining is based on meaningful patterns rather than isolated transactions. 

266 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

After retraining, the retrained model will be treated as a candidate model and must outperform the currently active model before replacement. The candidate model will be evaluated using predefined performance metrics such as forecast error trends, MAPE, RMSE, or other applicable validation indicators. If the candidate model does not show improved or more stable performance, the existing model will remain active. 

The feedback loop improves WOOF’s analytical outputs, including forecasts, alerts, recommendations, and campaign preparation support. However, retraining does not mean that WOOF autonomously executes business actions. The system will not automatically publish promotions, change prices, update product listings, alter booking schedules, approve bundles, or deploy PetHub campaign materials. These business-facing actions will remain subject to owner review and approval, consistent with WOOF’s role as an owner-governed decision-support system. 

For prescriptive analytics, updated transaction data, owner feedback, bundle acceptance or rejection, bundle redemption, campaign outcomes, and sales uplift will be used to reassess association rules, cross-selling recommendations, strategic low-association bundle candidates, and promotion ranking. This ensures that WOOF does not only improve its forecasts, but also refines the quality of its bundle and campaign recommendations over time. 

267 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **3.9.8 Automated Smart Reports** 

Will be evaluated through Data Completeness and Integrity checks within the ETL pipeline. Final narrative outputs will undergo Expert Review and UAT for factual alignment. 

The reporting system will be evaluated using Data Completeness Rate and Data Integrity Checks to ensure accuracy of processed data. Additionally, generated reports will undergo Expert Review and User Acceptance Testing to verify factual correctness and usability. 

## **Key Performance Indicators** 

## **Report Accuracy Rate** _**(Target: ≥ 95% factual correctness)**_ 

Accuracy = (Correct Reports / Total Reports) × 100 

**Decision Support Usage Rate** _**(Target: ≥ 70% of generated reports reviewed or used by**_ 

_**management)**_ 

Usage Rate = (Reports Used for Decisions / Total Reports) × 100 

## **Data Completeness** _**(Target: maintain ≥ 95% completeness)**_ 

Completeness = (Complete Records / Total Records) × 100 

## **Descriptive Analytics** 

## **ETL Data Aggregation** 

A process that extracts, cleans, and standardizes data from multiple sources. According to Sarker (2021), this transformation phase is an obligatory 

268 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

prerequisite to resolve anomalies and encode unstructured data, ensuring that only high-quality, structured information reaches the machine learning environment, preventing biased outputs. 

## **Predictive Analytics** 

## **Trend Extrapolation** 

A forecasting technique identifying directional patterns to predict continuous variables. Based on the methodologies analyzed by Tsai et al. (2023), advanced extrapolation algorithms filter out random, day-to-day statistical noise to isolate genuine longitudinal shifts, empowering decision-makers to anticipate long-term market trajectories. 

## **Prescriptive Analytics** 

## **Parameterized Natural Language Generation (NLG)** 

A secure method integrating computed variables into text templates. Employing the techniques highlighted by Jayawardena and Yapa (2024), parameterized NLG autonomously translates complex, multi-variable analytical findings into digestible, context-aware summaries, ensuring the generated reports are accurate and easily comprehensible for non-technical management. 

## **3.9.9 Cross-Channel Activation and Generative Campaign Copilot** 

The PetHub Recommendation Activation and Generative Campaign Copilot module will be evaluated using Recommendation Acceptance Rate, Campaign Preparation Time Reduction, Campaign Engagement Rate, Promo Conversion Rate, Bundle Redemption Rate, and Sales 

269 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

Uplift. The generated campaign outputs will also undergo owner review and User Acceptance Testing (UAT) to assess clarity, relevance, business alignment, and usefulness before being approved for PetHub announcement preparation or publication. 

The performance of this module will be evaluated by measuring how effectively WOOF-generated recommendations are converted into PetHub-ready customer-facing campaign materials. The Generative Campaign Copilot receives validated recommendations from the analytics engine, such as bundle suggestions, low-demand period promotions, or slow-moving inventory alerts, and transforms them into editable outputs such as PetHub announcement drafts, promotional content, product bundle descriptions, promo mechanics, and campaign materials. Since the module supports decision execution but does not replace managerial judgment, all generated outputs will pass through a Human Approval Gate where the owner may approve, edit, or reject the campaign before PetHub publication or activation. 

The module will also be evaluated through activation-related operational metrics. Recommendation Acceptance Rate will determine how often WOOF-generated recommendations are approved by the owner. Campaign Preparation Time Reduction will measure how much faster campaign materials are prepared compared to manual drafting. Campaign Engagement Rate, Promo Conversion Rate, Bundle Redemption Rate, and Sales Uplift will measure the business impact of approved campaigns after they are published through PetHub, when platform data is available. 

WOOF’s AI-assisted campaign functions are limited to decision-support, explanation, draft preparation, and recommendation ranking. The system does not independently execute business actions such as publishing promotions, applying discounts, changing prices, modifying 

270 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

product listings, changing booking schedules, ordering inventory, or launching campaigns. All campaign outputs generated by the Generative Campaign Copilot remain in draft or recommendation status until the business owner reviews, edits, approves, or rejects them. Therefore, WOOF functions as a human-governed decision-support layer rather than an autonomous business executor. 

## **Key Performance Indicators** 

## **Recommendation Acceptance Rate (Target: ≥ 70% of valid system-generated** 

## **recommendations approved or edited for use)** 

Acceptance Rate = (Approved or Edited Recommendations / Total Generated Recommendations) × 100 

## **Campaign Preparation Time Reduction (Target: reduce manual campaign preparation** 

## **time by at least 30%)** 

Preparation Time Reduction = ((Manual Preparation Time - System-Assisted Preparation Time) / Manual Preparation Time) × 100 

## **Campaign Engagement Rate (Target: increase engagement by at least 10% from baseline,** 

## **if platform data is available)** 

Engagement Rate = (Total Interactions / Total Campaign Views) × 100 

## **Promo Conversion Rate (Target: increase by at least 10% from baseline)** 

Promo Conversion Rate = (Promo-Driven Transactions or Bookings / Total Campaign Interactions) × 100 

271 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **Bundle Redemption Rate (Target: increase bundle usage by at least 10% from baseline)** 

Bundle Redemption Rate = (Redeemed Bundle Transactions / Total Bundle Campaign Views or Offers) × 100 

## **Sales Uplift (Target: maintain or improve sales by at least 5–10% during activated** 

## **campaign periods)** 

Sales Uplift = ((Sales_after - Sales_before) / Sales_before) × 100 

## **Manual Campaign Preparation Time** 

Manual Campaign Preparation Time = Total Time Spent Preparing Campaign Materials Manually 

## **Descriptive Analytics** 

## **Campaign Draft and Activation Logging** 

Campaign Draft and Activation Logging refers to the systematic recording of generated PetHub campaign materials, approval decisions, and activation statuses. In the context of WOOF, this includes storing PetHub announcement drafts, promotional content, bundle descriptions, approval timestamps, and campaign status logs. This descriptive layer allows the owner and developers to track how many recommendations were generated, how many were approved, and how long it took to prepare PetHub-ready campaign materials. These logs also establish a measurable baseline for comparing manual campaign preparation against system-assisted campaign preparation. 

## **Predictive Analytics** 

272 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **Campaign Relevance and Performance Estimation** 

Campaign Relevance and Performance Estimation refers to the use of analytics outputs to determine whether a campaign recommendation is likely to support a business objective. In WOOF, this predictive component depends on existing outputs from demand forecasting, Market Basket Analysis, promotional logic, and inventory monitoring. For example, low forecasted demand may signal the need for a service promotion, while high-confidence and high-lift association rules may support product bundle recommendations. The system does not independently guarantee campaign success; rather, it uses validated analytics outputs to estimate whether a proposed campaign is relevant enough to be converted into a customer-facing draft. 

## **Prescriptive Analytics** 

## **PetHub Recommendation Activation Layer with Human Approval Gate** 

The PetHub Recommendation Activation Layer converts validated recommendations into actionable campaign outputs for PetHub. In this study, PetHub serves as the prototype-supported activation endpoint where approved WOOF recommendations may be transformed into announcement drafts, promotional content, bundle descriptions, or published promotional materials depending on system readiness. To avoid autonomous and uncontrolled execution, all campaign outputs pass through a Human Approval Gate, ensuring that the owner reviews, edits, approves, or rejects the generated content before PetHub publication or activation. This preserves WOOF’s role as a 

273 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

decision-support system while allowing approved recommendations to move closer to actual business execution through PetHub. 

## **3.10 Software Quality Assurance Plans** 

Given the complexity of the proposed WOOF system’s cross-channel data warehouse and its heavy reliance on machine learning algorithms, a rigorous Software Quality Assurance (SQA) plan is imperative. This section outlines the comprehensive, multi-tiered testing framework broken down into three distinct operational definitions: Test Criteria (the binary standard for pass/fail), Test Scenarios (the specific user journey or system condition being validated), and Test Cases (the precise, repeatable execution steps). 

## **3.10.1 Unit Test** 

Unit testing serves as the foundational phase of the system's quality assurance protocol. Before complex modules are fused into the centralized cross-channel architecture, their individual components must be evaluated in strict isolation. This phase focuses on granular validation, ensuring that underlying backend scripts function with absolute logic and code correctness. 

## **3.10.1.1 Unit Test Criteria** 

The primary unit test criteria are binary thresholds ensuring that atomic system components function correctly: 

## **Data Ingestion Validation** 

274 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

The CSV module must process the 5-year POS dataset with a 0% data loss rate for valid rows, and the webhook must filter 100% of specified PII fields (Name, Address) before MongoDB insertion. 

## **Algorithm Execution** 

Individual machine learning models like SARIMAX, Prophet and the FP-Growth module must independently process mock datasets and return appropriate values (forecasts or association rules) within < 5 seconds without triggering runtime errors or memory exceptions. 

## **External API Integration** 

The system must successfully execute GET requests to public weather, holidays, and seasonal APIs, a 200 OK HTTP status code and 0 schema mismatch errors. 

## **NLP Classification** 

The VADER/NLP module must achieve a ≥90% accuracy rate when matching negative sentiment scores to their specific product SKUs against a standardized test batch. 

## **3.10.1.2 Unit Test Scenario** 

The unit testing phase evaluates the foundational components of the WOOF system in strict isolation. Testing individual logic modules like the NestJS extraction pipelines, predictive algorithms, and natural language processing scripts ensures every unit executes its function 

275 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

with absolute code correctness and logical accuracy . This approach guarantees that structural bugs are resolved before fusing components into the centralized cross-channel architecture. 

- **Scenario 1** : Verify that the NestJS webhook endpoint successfully strips all PII from incoming e-commerce JSON payloads. 

- **Scenario 2** : Verify that the system normalizes inconsistent data and handles nulls during the historical POS CSV ingestion. 

- **Scenario 3** : Verify that Prophet and SARIMAX modules successfully output numerical demand forecasts with error metrics for a specified 30-day range. 

- **Scenario 4** : Verify that the FP-Growth module calculates accurate Support, Confidence, and Lift for a mock transactional dataset. 

- **Scenario 5** :Verify that external API context (Seasons, Weather, Holiday) is successfully fetched and parsed into the database. 

- **Scenario 6** : Verify that the NLP module accurately flags negative sentiment polarity from customer review text. 

- **Scenario 7** : Verify that the system can generate a campaign draft from an approved WOOF recommendation. 

- **Scenario 8** : Verify that the owner can edit and approve a generated campaign draft. 

- **Scenario 9** : Verify that an owner-approved campaign can be pushed to the PetHub prototype announcements module. 

- **Scenario 10** : Verify that the owner can reject a generated campaign and log the reason for rejection. 

276 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

- **Scenario 11** : Verify that the system can generate PetHub announcement materials from campaign details. 

- **Scenario 12** : Verify that the system prevents automatic publication unless owner approval has been recorded. 

## **3.10.1.3 Unit Test Cases** 

|**Test Case ID**|**Scenario Ref**|**Input / Action**|**Expected Result**|
|---|---|---|---|
|TC-U-01|Scenario 1|1. Trigger the webhook<br>endpoint via an API<br>client (e.g., Postman).<br>2. Send a mock<br>Shopee JSON payload<br>containing<br>"Customer_Name" and<br>"Address".<br>3. Query the MongoDB<br>staging collection for<br>the new record.|The ETL layer returns a<br>200 OK status. The<br>MongoDB record contains<br>SKU, quantity, and<br>timestamps, but the PII<br>fields are completely<br>stripped/null.|
|TC-U-02|Scenario 2|1. Navigate to the<br>backend data upload<br>portal.<br>2. Upload a test 5-year<br>POS CSV file<br>containing deliberate<br>nulls and inconsistent<br>formats.<br>3. Execute the<br>ingestion script and<br>query the unified|The system normalizes the<br>data without crashing.<br>Nulls are handled<br>according to predefined<br>rules, and there is a 0%<br>data loss rate for valid<br>transaction rows.|



277 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

|||database.||
|---|---|---|---|
|TC-U-03|Scenario 3|**1.**Access the<br>Predictive Analytics<br>backend.<br>**2.**Input a specific<br>30-day date range and<br>select the "Cafe"<br>sector.<br>**3.**Execute the Prophet<br>and SARIMAX<br>modules.|Both modules execute<br>within < 5 seconds without<br>runtime errors, outputting a<br>numerical demand<br>forecast alongside valid<br>MAPE and RMSE error<br>metrics.|
|TC-U-04|Scenario 4|**1.**Load into the<br>FP-Growth module.<br>**2.**Set minimum<br>support and confidence<br>thresholds.<br>**3.**Execute the<br>association rule mining<br>script.|The module successfully<br>generates a list of<br>association rules,<br>accurately calculating the<br>mathematical Support,<br>Confidence, and Lift for the<br>product pairings.|
|TC-U-05|Scenario 5|1. Manually trigger the<br>scheduled automated<br>polling script.<br>2. Verify GET requests<br>to OpenWeather and<br>Holiday API endpoints.<br>3. Query the<br>environmental_context<br>table in the database.|The system logs a 200 OK<br>HTTP status for the APIs.<br>The JSON response is<br>correctly parsed into the<br>database with 0 schema<br>mismatch errors.|
|TC-U-06|Scenario 6|1. Feed a controlled<br>text string with known<br>negative keywords into<br>the NLP module.|The module accurately<br>assigns a negative<br>sentiment polarity score,<br>maps it to the relevant|



278 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

|||2. Execute sentiment<br>classification.<br>3. Check the<br>dashboard's alert log.|product SKU, and triggers<br>a quality control alert<br>without false positives.|
|---|---|---|---|
|TC-U-07|Scenario 7|1. Select an approved<br>WOOF<br>recommendation from<br>the dashboard.<br>2. Choose “Generate<br>Campaign Draft.”<br>3. Input the target<br>channel, promotion<br>type, and business<br>objective.|The system generates an<br>editable campaign draft<br>containing a PetHub-ready<br>announcement,<br>promotional caption, and<br>bundle description based<br>on the selected<br>recommendation.|
|TC-U-08|Scenario 8|1. Open a generated<br>campaign draft as the<br>Owner.<br>2. Edit the campaign<br>wording.<br>3. Click “Approve<br>Campaign.”|The system saves the<br>edited campaign, records<br>the owner approval status,<br>and marks the campaign<br>as approved without<br>automatically publishing it.|
|TC-U-09|Scenario 9|1. Select an<br>owner-approved<br>campaign.<br>2. Click “Push to<br>PetHub Prototype.”<br>3. Open the PetHub<br>announcements<br>module.|The approved campaign<br>appears in the PetHub<br>prototype announcements<br>module with the correct<br>title, content, and<br>campaign details.|
|TC-U-10|Scenario 10|1. Open a generated<br>campaign draft as the<br>Owner.<br>2. Click “Reject|The system marks the<br>campaign as rejected,<br>stores the rejection<br>reason, and prevents the<br>campaign from being|



279 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

|||Campaign.”<br>3. Enter a rejection<br>reason.|pushed to PetHub or any<br>external channel.|
|---|---|---|---|
|TC-U-11|Scenario 11|1. Open an approved<br>campaign draft.<br>2. Select “Generate<br>Pubmat Prompt.”<br>3. Provide campaign<br>details such as theme,<br>target product,<br>promotion type, and<br>target audience.|The system generates an<br>editable PetHub<br>announcement materials<br>aligned with the campaign<br>details and does not create<br>or publish external content<br>automatically.|
|TC-U-12|Scenario 12|1. Generate a<br>campaign draft from a<br>WOOF<br>recommendation.<br>2. Attempt to publish or<br>push the campaign<br>without owner<br>approval.|The system prevents<br>automatic publication and<br>keeps the campaign in<br>draft status until owner<br>approval is recorded.|



## **3.10.2 Stress Test** 

The stress test phase evaluates the structural resilience of the WOOF system under extreme computational loads that exceed normal daily operations. This testing phase verifies that the containerized architecture can dynamically scale and withstand sudden influxes of data without experiencing bottlenecks, latency spikes, or catastrophic failure. 

280 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **3.10.2.1 Stress Test Criteria** 

Stress test success criteria require the entire WOOF cross-channel architecture to maintain full operational stability under maximum load. The criteria are strictly defined by the following binary performance thresholds: 

## **Ingestion Load Capacity** 

The system must process a surge of ≥500 concurrent webhook payloads per minute with 0% data loss and 0 HTTP 503 (Service Unavailable) errors. 

## **Concurrent User Sessions** 

The Executive Dashboard and Mobile application must maintain an API response latency of < 3 seconds while under simulated concurrent user load. 

## **Resource Scalability** 

The backend must successfully complete a Prophet and SARIMAX model retraining task using a 5-year (100,000+ row) historical dataset within a strict < 15-minute time window, while keeping backend CPU utilization below 85%, maintaining 0 database lockouts, and ensuring the frontend API continues to serve concurrent user queries with < 3 seconds latency. 

## **3.10.2.2 Stress Test Scenario** 

These scenarios simulate the most demanding operational events faced by the Lucena branch. The simulations replicate high-velocity data surges alongside concurrent 

281 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

internal dashboard usage by the staff. The objective is to push the ETL pipelines and machine learning engines to their capacity limits to observe how the system manages data queues, concurrent requests, and resource allocation. 

- **Scenario 1** : Verify that the Redis broker and NestJS ETL pipeline can successfully queue and synchronize 500+ simultaneous e-commerce webhooks within a 60-second window. 

- **Scenario 2** : Verify that the Executive Dashboard and AI Assistant maintain sub-3-second responsiveness for multiple concurrent users while the backend simultaneously executes resource-heavy Prophet and SARIMAX model retraining tasks. 

## **3.10.2.3 Stress Test Cases** 

|**Test Case ID**|**Scenario Ref**|**Input / Action**|**Expected Result**|
|---|---|---|---|
|TC-S-01|Scenario 1|1. Configure a<br>load-testing tool from<br>Apache JMeter<br>2. Execute a script to<br>fire 500 concurrent<br>POST requests<br>containing mock<br>Shopee/TikTok JSON<br>payloads at the<br>webhook endpoint<br>within 60 seconds.<br>3. Query the<br>MongoDB warehouse<br>to verify row counts.|The Redis broker queues all<br>incoming payloads. 100% of<br>the 500 records successfully<br>synchronize to the database<br>without returning a single<br>503 Service Unavailable<br>error to the client.|
|TC-S-02|Scenario 2|1. Manually trigger<br>the Prophet and|The backend orchestrates<br>resources seamlessly to|



282 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

|SARIMAX retraining|SARIMAX retraining|finish the retraining task.|
|---|---|---|
|script on the|script on the|The frontend dashboard|
|backend.||remains perfectly stable,|
|||maintaining a query|
|2. While the models||response latency of < 3|
|are training, execute||seconds throughout the|
|an automated script||event.|
|to simulate 5|||
|concurrent user|||
|sessions|||
|continuously querying|||
|the AI Assistant on|||
|the frontend.|||
|3. Monitor the|||
|network response|||
|times.|||



## **3.10.3 User-Acceptance Test** 

User-Acceptance Testing (UAT) serves as the final validation phase by shifting the focus from backend functionality to practical business application. This phase confirms whether the WOOF system successfully transitions the Happy Tails Pet Cafe from a manual workflow into an efficient, data-driven enterprise. It ensures the final solution directly resolves the operational pain points of the end-users. 

## **3.10.3.1 User–Acceptance Test Criteria** 

UAT criteria are based on strategic alignment, operational usability, and insight interpretability. The system must prove its generated recommendations are contextually relevant to the actual needs of the business. The unified dashboard must demonstrate a measurable reduction in the time required for manual data reconciliation compared to 

283 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

legacy paper logs . The insights provided by the AI Assistant must be easily understood and immediately actionable by non-technical staff. 

## **Strategic Alignment** 

The AI-generated prescriptive logic (e.g., "Happy Hour" triggers) must align with historical low-traffic periods with 100% accuracy, requiring 0 manual overrides by the owner during the testing period. 

## **Operational Efficiency** 

The system must reduce the time required for a manager to generate an end-of-day cross-channel inventory reconciliation report to under 2 minutes (compared to the legacy multi-hour manual process). 

## **Insight Interpretability** 

The AI Assistant’s generated explanations must score a >= 4 out of 5 on a standardized User Comprehension Likert scale administered to non-technical staff. 

## **Campaign Draft Usability** 

The generated PetHub announcement draft or promotional campaign content must score at least 4 out of 5 in terms of clarity, relevance, and usefulness based on owner or intended user evaluation. This criterion will verify whether the generated campaign material can support decision activation without replacing the owner’s final judgment. 

284 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **3.10.3.2 User-Acceptance Test Scenario** 

UAT scenarios mirror the daily operational decision-making processes of the Happy Tails Pet Cafe. These scenarios test the system by walking through real-world business cases, such as reviewing and approving promotional recommendations, monitoring near real-time cross-channel synchronization, generating PetHub-ready announcement drafts, and utilizing automated alerts to safeguard inventory quality. The scenarios also evaluate whether the owner can edit, approve, or reject generated campaign materials before any customer-facing activation occurs. Executing these scenarios ensures that the digital tools provide immediate and tangible value to the workflow of the cafe while maintaining human oversight over promotional and publishing decisions. 

- **Scenario 1:** Verify that the system proactively generates strategic promotion recommendations during predicted low-traffic periods. 

- **Scenario 2:** Verify that the unified dashboard provides near real-time cross-channel inventory and revenue synchronization following a physical POS transaction. 

- **Scenario 3:** Verify that the system automatically alerts management to quality control issues based on ingested negative e-commerce reviews. 

- **Scenario 4:** Verify that the Generative AI Assistant can synthesize external API context to explain complex demand shifts to a non-technical user. 

285 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

● **Scenario 5** : Verify that the owner can review a WOOF-generated promotional recommendation, generate a PetHub announcement draft, edit the campaign content, and approve or reject the activation. 

## **3.10.3.3 User Acceptance Test Cases** 

|**Test Case ID**|**Scenario Ref**|**Input / Action**|**Expected Result**|
|---|---|---|---|
|TC-UAT-01|Scenario 1|1. Log in to the<br>management<br>dashboard as an<br>Owner.<br>2. Navigate to the “AI<br>Simulation” tab.<br>3. Review the<br>"Suggested Bundles"<br>section.|The dashboard displays a<br>bundled promotion (e.g.,<br>specific dog food paired with<br>a specific shampoo) backed<br>by data, ready for one-click<br>owner approval.|
|TC-UAT-02|Scenario 2|1. Record the current<br>total stock for<br>"Premium Dog<br>Shampoo" on the<br>dashboard.<br>2. Process a physical<br>sale for that item via<br>the cafe's POS<br>terminal.<br>3. Refresh the WOOF<br>Executive<br>Dashboard.|The dashboard immediately<br>reflects the updated<br>inventory and revenue totals<br>without requiring the user to<br>manually cross-reference<br>the physical POS database.|
|TC-UAT-03|Scenario 3|1. Inject a mock<br>1-star review via the<br>Shopee webhook<br>containing the phrase<br>"arrived expired" for a<br>specific product.|The specific SKU is<br>automatically flagged on the<br>dashboard as a high-priority<br>"Stock Check" alert for the<br>owner to investigate.|



286 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

|||2. Log in to the<br>dashboard.<br>3. Check the<br>"Operational Alerts"<br>module.||
|---|---|---|---|
|TC-UAT-04|Scenario 4|1. Open the<br>Generative AI<br>Assistant chat<br>interface.<br>2. Submit the prompt:<br>"Explain the sudden<br>spike in grooming<br>appointments last<br>Tuesday."<br>3. Read the<br>generated response.|The AI provides a clear,<br>natural-language<br>explanation citing specific<br>integrated external factors<br>(e.g., heavy rain from the<br>Weather API) rather than<br>outputting raw code or<br>statistical models.|
|TC-UAT-05|Scenario 5|1. Log in to the<br>management<br>dashboard as the<br>Owner.<br>2. Open a<br>WOOF-generated<br>promotional<br>recommendation.<br>3. Click “Generate<br>PetHub<br>Announcement<br>Draft.”<br>4. Edit the generated<br>campaign content.<br>5. Choose either<br>“Approve Activation”<br>or “Reject Activation.”<br>6. Rate the generated<br>draft in terms of<br>clarity, relevance, and|The system generates an<br>editable PetHub-ready<br>announcement draft from<br>the selected<br>recommendation. The owner<br>can modify the content and<br>either approve or reject the<br>activation. The campaign<br>will remain unpublished<br>unless approval is recorded,<br>and the generated draft<br>must receive an evaluation<br>rating of at least 4 out of 5<br>for clarity, relevance, and<br>usefulness.|



287 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

usefulness. 

## **3.11 Operational Performance Evaluation** 

To evaluate the overall effectiveness of the WOOF system, the study will employ a comparative performance analysis between the current manual workflow and the proposed system-assisted workflow. The evaluation focuses on key operational performance indicators such as reconciliation time, inventory accuracy, campaign preparation time, and recommendation activation efficiency. These metrics are selected because they directly reflect improvements in operational efficiency, data reliability, decision-support usage, and the ability of the system to convert analytics-based recommendations into owner-approved business actions. 

Baseline values will be established using the current manual processes of Happy Tails Pet Cafe. Reconciliation time will be measured by recording the average time required by staff to manually match sales and inventory records across physical and e-commerce channels. Inventory accuracy will be assessed by comparing recorded inventory levels against actual stock counts. Campaign preparation time will be measured by recording the time needed to manually create promotional materials such as announcement text, captions, bundle descriptions, and campaign mechanics. These baseline values will serve as the pre-implementation reference for evaluating system improvement. 

After system deployment, the same metrics will be collected under the WOOF-assisted workflow using equivalent evaluation periods. The system is expected to automate data synchronization, reduce manual intervention, improve inventory visibility, and shorten the time required to prepare campaign materials through the PetHub Recommendation Activation Layer 

288 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

and Generative Campaign Copilot. However, all customer-facing campaign outputs will remain subject to owner approval before publication or activation through PetHub or other supported channels. 

## **Key Performance Indicators** 

## **Reconciliation Time Reduction (Target: At least 20% reduction in reconciliation time)** 

Time Reduction = ((time_before - time_after) / time_before) × 100 

## **Inventory Accuracy (Target: At least 95% inventory accuracy)** 

Inventory Accuracy = (Correct Inventory / Total Inventory) × 100 

## **Campaign Preparation Time Reduction (Target: At least 30% reduction in campaign preparation time)** 

Campaign Preparation Time Reduction = ((manual_preparation_time system_assisted_preparation_time) / manual_preparation_time) × 100 

## **Recommendation Acceptance Rate (Target: At least 70% of valid recommendations approved or edited for use)** 

Recommendation Acceptance Rate = (Approved or Edited Recommendations / Total Generated Recommendations) × 100 

## **Activation Completion Rate (Target: At least 90% of approved campaigns successfully prepared or logged for activation)** 

Activation Completion Rate = (Successfully Prepared or Activated Campaigns / Total Approved Campaigns) × 100 

289 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

## **Promo Conversion Rate (Target: At least 10% improvement from baseline, if campaign data is available)** 

Promo Conversion Rate = (Promo-Driven Transactions or Bookings / Total Campaign Interactions) × 100 

The evaluation will use a pre-implementation and post-implementation comparison approach. The manual workflow will serve as the baseline condition, while the WOOF-assisted workflow will serve as the post-implementation condition. Both workflows will be evaluated using the same metrics and equivalent operational periods to ensure a fair comparison. 

For reconciliation time, staff or researchers will record the duration required to complete sales and inventory reconciliation before and after WOOF implementation. For inventory accuracy, recorded stock counts will be compared against actual physical stock counts during inventory checking. For campaign preparation time, the study will compare the time required to manually prepare promotional materials against the time required when WOOF generates editable campaign drafts, PetHub announcement text, bundle descriptions, and PetHub promotional content. For recommendation acceptance and activation completion, the system will record owner approval actions, edited recommendations, rejected recommendations, and successfully prepared or activated campaigns through the activation logs. 

The WOOF system will be considered operationally effective if reconciliation time decreases by at least 20%, inventory accuracy reaches at least 95%, campaign preparation time decreases by at least 30%, and approved recommendations are successfully prepared or logged for activation. These results will indicate that the system improves operational efficiency, reduces manual workload, supports more reliable inventory monitoring, and strengthens the 

290 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

business owner’s ability to convert analytics-based recommendations into approved customer-facing actions for Happy Tails Pet Cafe. 

## **3.12 Deployment Plans** 

The deployment plan of the WOOF system will follow a phased implementation approach to ensure that the system is properly configured, tested, and adopted by the intended users of Happy Tails Pet Cafe. Since the system handles cross-channel sales, inventory, forecasting, customer feedback, and decision-support functions, deployment will be conducted gradually to minimize operational disruption and ensure data accuracy. The deployment will also follow the hybrid database architecture, where MongoDB will serve as the staging layer for raw and semi-structured source records, while PostgreSQL will serve as the primary analytical warehouse for cleaned and structured business data. 

## **3.12.1 Deployment Environment** 

The WOOF system will be deployed as a web-based and mobile-supported decision-support platform. The web dashboard will be used by the owner for monitoring sales, inventory, forecasting results, customer sentiment, and system-generated recommendations. The mobile interface will be used by branch staff for viewing operational prompts, inventory alerts, and service-related updates. 

The backend system will be hosted on a cloud-based server or development server environment, depending on the final implementation capacity of the project. The system will use 

291 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

a hybrid database setup composed of MongoDB staging collections and a PostgreSQL star schema warehouse. MongoDB will store raw and semi-structured records from POS, Shopee, TikTok Shop, PetHub, customer reviews, weather, holiday sources, campaign logs, and source-level metadata. PostgreSQL will store cleaned and structured fact and dimension tables used for analytics processing, KPI computation, dashboard filtering, forecasting, cross-selling analysis, sentiment summaries, inventory monitoring, campaign evaluation, and controlled NL2SQL chatbot queries 

## **3.12.2 Deployment Phases** 

The deployment will be conducted in four phases: data preparation, system configuration, pilot testing, and full system turnover. 

During the data preparation phase, historical POS, Shopee, TikTok Shop, PetHub, customer review, weather, and holiday datasets will be cleaned, standardized, and prepared for ingestion. Raw and semi-structured records will first be loaded into MongoDB staging collections to preserve the original source structure, including nested order items, platform-specific metadata, review text, campaign records, and contextual indicators. This includes SKU normalization, transaction date formatting, duplicate checking, missing value handling, and validation of critical fields such as transaction ID, product name, quantity, sales amount, category, channel, and order status. 

During the system configuration phase, the system modules will be connected to the hybrid database environment and configured according to the operational requirements of Happy Tails Pet Cafe. This includes setting up MongoDB staging collections, PostgreSQL 

292 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

warehouse tables, ETL workflows, dashboard access, user roles, forecasting settings, KPI thresholds, inventory alert rules, promotion recommendation rules, chatbot query access, and report generation settings. 

During the pilot testing phase, the system will be tested using a limited operational period before full adoption. The purpose of this phase is to check whether the dashboard, analytics modules, inventory alerts, forecasting outputs, chatbot responses, smart reports, and recommendation outputs function correctly using actual business data. The pilot test will also verify whether raw records are properly preserved in MongoDB staging and correctly transformed into PostgreSQL fact and dimension tables. Feedback from the owner and selected staff will be collected to identify usability issues, incorrect outputs, data mapping concerns, or workflow problems. 

During the full system turnover phase, the finalized system will be presented to the client with documentation, user instructions, and maintenance guidelines. The proponents will provide basic orientation on how to use the dashboard, interpret system-generated insights, review recommendations, validate reports, and understand the distinction between MongoDB staging records and PostgreSQL analytical warehouse outputs. 

## **3.12.3 Owner Access and Administrative Control** 

The WOOF system will primarily be accessed by the business owner of Happy Tails Pet Cafe Lucena branch. The owner will have access to the main dashboard, analytics results, forecasting outputs, KPI monitoring, inventory alerts, customer sentiment summaries, chatbot-supported analytics queries, smart reports, and recommendation logs. Since WOOF functions as a decision-support and recommendation activation system, all final business 

293 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

actions such as approving PetHub announcements, posting promotional content, changing product prices, updating listings, or acting on staffing and inventory recommendations will remain under owner review and approval. 

Administrative access will be limited to authorized developers or system administrators responsible for technical maintenance, database configuration, ETL monitoring, backup management, user account management, and system troubleshooting. This administrative access will not be intended for daily business decision-making, but only for maintaining the system’s technical operation. 

To protect business and customer-related data, the system will apply access restrictions between the owner-facing dashboard and the underlying databases. The owner-facing dashboard and chatbot will retrieve information only from approved PostgreSQL warehouse views, saved queries, and dashboard modules. Raw MongoDB staging collections will not be directly exposed to the owner interface. This access structure ensures that the owner can use validated analytics outputs while raw source records remain protected for audit, traceability, and reprocessing purposes. 

## **3.12.4 Data Migration and Integration** 

Historical data migration will be performed using cleaned CSV and spreadsheet files from the POS system, e-commerce platforms, PetHub, and customer review sources. The datasets will first be imported into MongoDB staging collections after undergoing initial Extract, Transform, and Load procedures. MongoDB will preserve raw and semi-structured source 

294 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

records, including nested order items, platform-specific fields, review text, campaign logs, and contextual metadata. 

After staging, the ETL process will clean, validate, standardize, and map the records into the PostgreSQL star schema warehouse. This process will standardize field names, convert data types, normalize product names and SKUs, remove duplicate records, map source channels, assign warehouse keys, and prepare fact and dimension tables for analytics processing. PostgreSQL will serve as the primary source for dashboard reporting, forecasting, cross-selling, sentiment summaries, inventory monitoring, campaign evaluation, and controlled NL2SQL chatbot queries. 

For live or near-real-time integration, the system will be designed to support webhook-based or API-based data ingestion from e-commerce platforms and PetHub where technically available. If direct API access is unavailable during deployment, the system may use periodic CSV or spreadsheet uploads as an alternative data ingestion method. This ensures that the system remains usable even if full live integration is not immediately available. 

## **3.12.5 Security and Data Privacy Measures** 

To operationalize compliance with the Data Privacy Act of 2012 (RA 10173) and NPC Advisory No. 2024-04 on AI systems processing personal data, WOOF will implement a Data Privacy Impact Assessment by data category. This assessment identifies the source, purpose, privacy risks, applicable privacy principles, and safeguards for each type of data processed by the system. Since WOOF uses AI-assisted analytics and recommendation generation, the system will apply privacy-by-design, data minimization, access control, transparency, accountability, and human review before any recommendation is activated or published. 

295 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

|Data Category|Source|Purpose of<br>Processing|Privacy Risk|RA 10173 /<br>NPC 2024-04<br>Principle<br>Applied|Safeguards and<br>Controls|
|---|---|---|---|---|---|
|POS Transaction<br>Data|POS / CSV<br>uploads|Sales trends,<br>demand<br>forecasting,<br>inventory<br>monitoring,<br>revenue reports|Indirect customer<br>or transaction<br>references|Lawful<br>purpose,<br>proportionality,<br>minimization,<br>accuracy,<br>security|Remove customer<br>identifiers; retain<br>transaction ID, SKU,<br>date, quantity,<br>channel, and sales<br>values; apply access<br>control, encryption,<br>audit logs, and<br>validation|
|E-Commerce<br>Order Data|Shopee,<br>TikTok Shop,<br>PetHub|Cross-channel<br>sales, inventory<br>movement,<br>channel<br>performance|Buyer names,<br>addresses, contact<br>details, or platform<br>IDs may appear in<br>raw payloads|Data<br>minimization,<br>transparency,<br>accountability,<br>privacy by<br>design|Exclude names,<br>addresses, contact<br>numbers, and delivery<br>details; store only<br>order ID, SKU,<br>quantity, timestamp,<br>channel, and status|
|Customer<br>Reviews|Shopee,<br>TikTok Shop,<br>PetHub|Sentiment<br>analysis, topic<br>modeling,<br>feedback<br>monitoring|Reviews may<br>contain usernames<br>or personal details|Transparency,<br>fairness,<br>minimization,<br>accuracy|Remove<br>usernames/profile<br>references; mask<br>personal details;<br>aggregate sentiment<br>results|
|PetHub Booking<br>Data|PetHub|Service<br>demand,<br>booking trends,<br>campaign<br>performance|Customer identity,<br>appointment<br>history, pet details|Lawful basis,<br>proportionality,<br>minimization,<br>security|Store booking<br>reference, service<br>type, date/time,<br>status, and<br>anonymized customer<br>ID; restrict access by<br>role|



296 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

|Inventory and<br>Service Records|Internal<br>records|Stock<br>monitoring,<br>spoilage alerts,<br>restocking,<br>staffing support|Low privacy risk;<br>may expose<br>business-sensitive<br>data|Confidentiality,<br>accountability,<br>security|Limit access; validate<br>records; maintain<br>audit trails|
|---|---|---|---|---|---|
|External Context<br>Data|Weather API,<br>Holiday API|Forecasting<br>support and<br>holidays context|Minimal privacy<br>risk|Purpose<br>limitation,<br>proportionality|Use only branch-level<br>weather and holiday<br>indicators|
|AI<br>Recommendation<br>s|WOOF<br>Analytics<br>Engine|Promo, bundle,<br>restocking,<br>staffing, and<br>campaign<br>suggestions|Inaccurate or<br>unfair<br>recommendations<br>if treated as final|Accountability,<br>fairness,<br>accuracy,<br>human review|Show<br>recommendation<br>basis; require owner<br>approval; log approval<br>status and outcomes|
|Campaign Drafts /<br>PetHub Outputs|Campaign<br>Copilot,<br>Activation<br>Layer|PetHub<br>announcements<br>, captions,<br>pubmat<br>prompts, promo<br>campaigns|Incorrect claims,<br>unauthorized<br>discounts,<br>unintended<br>personal<br>references|Transparency,<br>accountability,<br>privacy by<br>design, human<br>intervention|Human Approval Gate<br>before posting; log<br>content, approval,<br>user, date, and<br>channel|
|Feedback and<br>Model Logs|Owner<br>feedback,<br>staff reports,<br>system logs|Model<br>evaluation, drift<br>monitoring,<br>retraining<br>support|May reveal<br>business decisions<br>or staff actions|Accountability,<br>accuracy,<br>security,<br>monitoring|Store in<br>feedback/model<br>outputs collection;<br>restrict access; retain<br>only operational fields|
|Authentication and<br>Audit Logs|WOOF<br>Dashboard /<br>Mobile App|Access control,<br>activity tracking,<br>accountability|User activity<br>history may be<br>sensitive|Security,<br>accountability,<br>data subject<br>rights|RBAC, secure<br>authentication,<br>hashed credentials,<br>audit logs, limited<br>retention|



Through this assessment, WOOF limits the collection and storage of personally 

identifiable information while preserving the operational data needed for analytics. The system prioritizes anonymized and aggregated business records, applies validation and masking during ingestion, restricts access through role-based controls, and maintains audit and feedback logs 

for accountability. AI-generated outputs will remain subject to owner review before execution, 

297 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

ensuring that the system supports human-governed decision-making rather than fully autonomous actions. 

## 3 **.12.6 Backup and Recovery Plan** 

To reduce the risk of data loss, regular database backups will be performed for both MongoDB staging collections and the PostgreSQL analytical warehouse. MongoDB backups will preserve raw source records, nested order structures, platform-specific metadata, customer review text, campaign logs, and ingestion records. PostgreSQL backups will preserve cleaned fact and dimension tables, KPI outputs, analytics results, chatbot query logs, model outputs, and system configuration records. 

Backup files may be stored in secure cloud storage or a local backup location, depending on the final deployment setup. In case of system errors, accidental deletion, ETL failure, or database failure, the most recent backup can be restored to recover important source records, transformed warehouse tables, analytics outputs, and system configurations. 

The system will also maintain ingestion and ETL logs to track uploaded files, imported records, failed data entries, validation errors, transformation results, and warehouse loading status. These logs will help the developers or administrators identify and correct problems during deployment and maintenance. 

## **3.12.7 Maintenance and Monitoring** 

After deployment, the system will require periodic maintenance to ensure that the data pipeline, analytics modules, and dashboard features continue to function properly. Maintenance activities will include checking data uploads, validating MongoDB staging records, verifying 

298 

**UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

PostgreSQL warehouse tables, monitoring ETL processes, reviewing forecasting accuracy, checking KPI thresholds, updating product mappings, and correcting system errors. 

For the model and recommendation maintenance, forecasting models may undergo scheduled or drift-triggered batch retraining using accumulated ETL-validated data, while prescriptive recommendation logic such as bundle rules, cross-selling rankings, and campaign heuristics may be refreshed based on updated transaction patterns and recommendation outcomes. Any retrained model or updated rule set will first be evaluated before replacing the active model or active recommendation logic. 

## **3.12.8 User Training and Turnover** 

Before final turnover, the proponents will provide basic user training for the intended users of the system. The training will cover dashboard navigation, data upload procedures, interpretation of forecasts and KPIs, review of inventory and promotion recommendations, chatbot usage, smart report generation, and owner approval procedures for recommendation activation. 

A user guide or system manual will be provided to help the client operate the system after deployment. This guide will include login instructions, feature descriptions, troubleshooting steps, basic maintenance reminders, and guidance on how raw source data from MongoDB staging is transformed into PostgreSQL warehouse outputs used by the dashboard and analytics modules. 

## **3.12.9 Deployment Limitation** 

299 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

The deployment of WOOF will be limited to the Happy Tails Pet Cafe Lucena branch and its available POS, Shopee, TikTok Shop, PetHub, customer review, weather, and holiday datasets. The system will generate analytics-based recommendations, but final business actions such as changing product prices, updating e-commerce listings, posting promotions, approving PetHub announcements, or adjusting staffing schedules will still require human review and approval from management. Therefore, the deployed system will function as a decision-support and activation-support tool rather than a fully autonomous business execution system. 

PetHub integration will be treated as an owner-governed activation endpoint. Approved WOOF recommendations may be converted into PetHub announcement drafts, promotional captions, bundle descriptions, and campaign materials, but no customer-facing content will be published or executed without owner approval. 

To prevent unauthorized publishing, WOOF will include an owner approval gate before any customer-facing activation. Generated, edited, approved, rejected, or exported campaign materials will be recorded through audit logs for traceability. If direct platform integration is unavailable, the system will provide a fallback export or copy-paste mode, allowing the owner to manually transfer approved campaign content to PetHub, Shopee, and TikTok Shop. 

## **Glossary** 

|**Term**|**Definition**|**Computation / Logic**|**Appears In**|
|---|---|---|---|
|FP-Growth|A frequent pattern mining<br>algorithm used to identify<br>products or services that<br>are commonly purchased|Builds an FP-tree from<br>transaction baskets and<br>extracts frequent itemsets<br>without generating repeated|Smart Bundle and<br>Cross-Selling<br>Engine / Behavioral<br>Bridges|



300 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

||together.|candidate itemsets.||
|---|---|---|---|
|Association<br>Rule|A rule that shows the<br>relationship between two or<br>more items based on<br>customer purchase<br>behavior.|Expressed as A → B,<br>meaning customers who<br>purchase item A are likely to<br>purchase item B.|Market Basket<br>Analysis /<br>Cross-Selling<br>Module|
|Support|Measures how often an<br>item or item combination<br>appears in the total<br>transaction dataset.|Support(A,B) = Transactions<br>containing A and B / Total<br>Transactions|FP-Growth / Bundle<br>Recommendation|
|Confidence|Measures the likelihood that<br>item B is purchased when<br>item A is purchased.|Measures the likelihood that<br>Confidence(A → B) =<br>Transactions containing A<br>and B / Transactions<br>containing A|FP-Growth /<br>Cross-Selling<br>Engine|
|Lift|Measures whether the<br>relationship between two<br>items is stronger than<br>random chance.|Lift(A → B) = Confidence(A<br>→ B) / Support(B)|Bundle<br>Recommendation /<br>Behavioral Bridges|
|Behavioral<br>Bridge|A discovered relationship<br>between customer<br>purchases across cafe,<br>retail, grooming, or online<br>channels.|Identified through frequent<br>itemsets and association<br>rules across business<br>segments.|Smart Bundle and<br>Cross-Selling<br>Engine|
|Time-Series<br>Forecasting|A forecasting method that<br>uses historical data<br>arranged over time to<br>predict future demand,<br>sales, or service activity.|Aggregates historical<br>records by date, then applies<br>forecasting models to<br>estimate future values.|records by date, then applies<br>Demand and Foot<br>Traffic Forecaster|
|Prophet|A time-series forecasting<br>model used to handle<br>seasonality, missing data,<br>outliers, and irregular<br>business patterns.|Decomposes time-series<br>data into trend, seasonality,<br>holiday, and error<br>components.|Demand<br>Forecasting Module|
|SARIMAX|A time-series forecasting<br>model that uses past<br>values, seasonality, and<br>external variables to predict|Uses autoregressive,<br>differencing, moving<br>average, seasonal, and<br>exogenous-variable|Context-Aware<br>Forecasting /<br>Demand Forecaster|



301 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

||future demand.|components.||
|---|---|---|---|
|Exogenous<br>Variable|An external factor that may<br>influence demand but does<br>not come directly from<br>historical sales data.|Examples include weather,<br>holidays, seasonality, and<br>other contextual indicators.|SARIMAX /<br>Context-Aware<br>Forecasting|
|Forecast<br>Horizon|The future time period<br>covered by a forecast.|Defined by the user or<br>system, such as 7 days, 14<br>days, or 30 days.|Cafe, Services, and<br>Retail Forecast<br>Pages|
|MAPE|A forecasting accuracy<br>metric that shows the<br>average percentage error<br>between predicted and<br>actual values.|MAPE = Average |Actual -<br>Forecast| / Actual × 100|Forecast Evaluation|
|RMSE|A forecasting accuracy<br>metric that measures the<br>size of prediction errors and<br>gives heavier penalty to<br>larger errors.|size of prediction errors and<br>RMSE = Square root of the<br>average squared difference<br>between actual and<br>forecasted values.|Forecast Evaluation|
|Moving<br>Average<br>Forecasting|A forecasting method that<br>smooths short-term<br>fluctuations by averaging<br>recent historical values.|Forecast = Average of<br>recent observations, with<br>optional weighting for newer<br>data.|Short-Term<br>Inventory<br>Forecasting|
|Economic<br>Order<br>Quantity<br>(EOQ)|An inventory model used to<br>estimate the ideal order<br>quantity that minimizes<br>ordering and holding costs.|EOQ = √((2DS) / H), where<br>D = demand, S = ordering<br>cost, and H = holding cost.|Inventory<br>Recommendation /<br>Restocking Alerts|
|Reorder Point|The inventory level at which<br>the system recommends<br>restocking.|The inventory level at which<br>Reorder Point = Demand<br>During Lead Time + Safety<br>Stock, when parameters are<br>available.|Inventory Monitoring<br>/ EOQ Module|
|Stockout Flag|An indicator showing<br>whether an item or order<br>was affected by insufficient<br>stock.|True/False value based on<br>inventory records,<br>cancellation reason, or<br>stockout status.|Inventory Monitoring<br>/ Data Warehouse|
|Sentiment<br>Score|A numeric or categorical<br>value that represents the<br>emotional polarity of|Classified as positive,<br>neutral, or negative through<br>sentiment analysis.|Customer Sentiment<br>Radar|



302 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

||customer feedback.|||
|---|---|---|---|
|VADER|A lexicon and rule-based<br>sentiment analysis tool<br>used to evaluate informal<br>customer reviews.|Calculates positive,<br>negative, neutral, and<br>compound sentiment scores<br>from text.|Sentiment Analysis<br>Module|
|TF-IDF|A text-processing method<br>used to identify important<br>words in customer reviews.|TF-IDF = Term Frequency ×<br>Inverse Document<br>Frequency|Review<br>Preprocessing /<br>Sentiment Analysis|
|LDA Topic<br>Modeling|An unsupervised text<br>analysis method used to<br>identify recurring themes or<br>issues in reviews.|Groups words into topics<br>based on their probability of<br>appearing together across<br>documents.|Customer Sentiment<br>Radar / Review<br>Issue Detection|
|Topic Label|A descriptive label assigned<br>to a recurring review theme<br>or issue.|A descriptive label assigned<br>Generated from topic<br>modeling results or keyword<br>groupings.|Review Quality<br>Monitoring|
|Queueing<br>Theory /<br>M/M/c Model|A mathematical model used<br>to estimate waiting time and<br>service utilization when<br>multiple service counters or<br>staff are available.|A mathematical model used<br>to estimate waiting time and<br>Uses arrival rate, service<br>rate, and number of servers<br>to estimate queue length,<br>waiting time, and utilization.|Service Maximizer /<br>Grooming<br>Operations|
|Linear<br>Programming|An optimization method<br>used to allocate limited<br>resources while satisfying<br>operational constraints.|Maximizes or minimizes an<br>objective function subject to<br>constraints.|Staff Scheduling /<br>Service Optimization|
|Random<br>Forest<br>Classifier|An ensemble machine<br>learning method that uses<br>multiple decision trees to<br>classify or predict an<br>outcome.|Combines predictions from<br>multiple decision trees and<br>selects the majority or<br>averaged result.|Dynamic Promo<br>Engine / Promotion<br>Success Prediction|
|Rule-Based<br>Trigger|A conditional logic rule that<br>generates alerts or<br>recommendations when<br>predefined thresholds are<br>met.|Example: if confidence ≥<br>threshold and lift > 1,<br>generate a bundle<br>recommendation.|Prescriptive<br>Recommendation<br>Layer|
|Automated<br>Threshold<br>Triggering|A rule-based alerting<br>method that checks<br>whether system metrics|Compares KPI values<br>against predefined<br>thresholds before triggering|Dashboard Alerts /<br>Recommendation<br>Engine|



303 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

||exceed or fall below defined<br>limits.|exceed or fall below defined<br>alerts or recommendations.||
|---|---|---|---|
|Prescriptive<br>Rule-Based<br>Heuristics|Simple decision rules that<br>translate analytics outputs<br>into actionable<br>recommendations.|Uses if-then conditions<br>based on forecast results,<br>inventory status, sentiment<br>score, or association-rule<br>metrics.|Prescriptive<br>Analytics Layer|
|Generative<br>Campaign<br>Copilot|An AI-assisted module that<br>converts approved analytics<br>recommendations into<br>editable campaign<br>materials.|converts approved analytics<br>Uses validated<br>recommendation inputs to<br>generate captions,<br>announcement drafts,<br>bundle descriptions, and<br>pubmat prompts.|Cross-Channel<br>Activation Layer|
|Campaign<br>Draft|A system-generated but<br>editable promotional output<br>prepared for owner review.|Generated from<br>recommendation details,<br>target channel,<br>product/service, and<br>campaign objective.|Generative<br>Campaign Copilot /<br>PetHub Activation|
|Human<br>Approval Gate|Approval Gate<br>A control step where the<br>owner reviews, edits,<br>approves, or rejects<br>generated<br>recommendations or<br>campaign drafts.|Approval status may be<br>marked as pending,<br>approved, edited, rejected,<br>or activated.|Cross-Channel<br>Activation Workflow|
|Recommenda<br>tion<br>Acceptance<br>Rate|Measures how often<br>system-generated<br>recommendations are<br>approved or edited for use<br>by the owner.|Recommendation<br>Acceptance Rate =<br>Approved or Edited<br>Recommendations / Total<br>Generated<br>Recommendations × 100|Operational<br>Performance<br>Evaluation /<br>Activation Layer|
|Campaign<br>Preparation<br>Time<br>Reduction|Measures the decrease in<br>time needed to prepare<br>campaign materials using<br>WOOF compared to<br>manual preparation.|((Manual Preparation Time -<br>System-Assisted Preparation<br>Time) / Manual Preparation<br>Time) × 100|System-Assisted Preparation<br>Generative<br>Campaign Copilot /<br>3.11 Evaluation|



304 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

|Activation<br>Completion<br>Rate|Measures whether<br>approved recommendations<br>were successfully prepared,<br>published, or logged for<br>activation.|approved recommendations<br>were successfully prepared,<br>Activation Completion Rate<br>= Successfully Prepared or<br>Activated Campaigns / Total<br>Approved Campaigns × 100|Activation Logs /<br>PetHub<br>Announcements|
|---|---|---|---|
|Promo<br>Conversion<br>Rate|Measures how many<br>campaign interactions result<br>in transactions, bookings, or<br>purchases.|campaign interactions result<br>in transactions, bookings, or<br>Promo Conversion Rate =<br>Promo-Driven Transactions<br>or Bookings / Total<br>Campaign Interactions × 100|Campaign<br>Performance<br>Evaluation|
|Bundle<br>Redemption<br>Rate|Measures how often<br>promoted bundles are<br>actually used or purchased.|Bundle Redemption Rate =<br>Redeemed Bundle<br>Transactions / Total Bundle<br>Offers or Campaign<br>Transactions × 100|Cross-Selling<br>Activation /<br>Campaign<br>Performance|
|Sales Uplift|Measures the increase or<br>decrease in sales after a<br>campaign or<br>recommendation is<br>activated.|Sales Uplift = ((Sales After -<br>Sales Before) / Sales<br>Before) × 100|Campaign<br>Performance<br>Feedback|
|Model<br>Evaluation<br>Tracking|A monitoring process that<br>compares model<br>predictions or<br>recommendations against<br>actual outcomes.|Logs actual results, forecast<br>errors, recommendation<br>outcomes, and campaign<br>performance.|Feedback Loop /<br>Model Monitoring<br>Layer|
|Model Drift|A change in data patterns<br>that may reduce the<br>accuracy of a predictive<br>model over time.|Detected when actual<br>outcomes consistently differ<br>from expected model<br>behavior.|Concept Drift<br>Detection /<br>Feedback Loop|
|ADWIN|A drift detection method<br>that monitors data streams<br>and detects significant<br>changes in distribution.|Adjusts its monitoring<br>window when statistically<br>significant changes are<br>detected.|Concept Drift<br>Detection /<br>Feedback Loop|
|Retraining<br>Trigger|A condition that signals<br>when a model should be<br>reviewed, updated, or<br>retrained.|Triggered when model error<br>exceeds a defined threshold<br>or drift is detected.|Automated Batch<br>Retraining /<br>Feedback Loop|



305 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

|Trend<br>Extrapolation|A forecasting method that<br>extends historical trends<br>into the future to estimate<br>long-term direction.|Uses historical growth or<br>decline patterns to project<br>future values.|Automated Report<br>Engine|
|---|---|---|---|
|Parameterize<br>d Natural<br>Language<br>Generation<br>(NLG)|A method that converts<br>structured analytics outputs<br>into readable narrative<br>summaries.|Uses data parameters such<br>as sales changes, forecast<br>values, and KPI results to<br>generate report text.|Automated Reports /<br>AI Assistant|
|Activation Log|A record that tracks<br>recommendation approval,<br>campaign preparation,<br>publishing status, and<br>performance feedback.|Stores campaign status,<br>owner action, timestamp,<br>target channel, and result.|Cross-Channel<br>Activation Layer /<br>MongoDB Schema|
|Business<br>Segment|A classification that<br>separates records into cafe,<br>retail, services, or unknown<br>categories.|separates records into cafe,<br>Assigned during ETL based<br>on product name, service<br>type, category, or source<br>channel.|ETL Pipeline /<br>Forecasting /<br>Dashboard Filtering|



## **Bibliography** 

1. Ain, Q. U., Ali, M., Riaz, A., Noureen, A., Kamran, M., Hayat, B., & Rehman, A. (2022). Sentiment analysis using deep learning techniques: A review. _Expert Systems with Applications, 193_ , 116382. https://doi.org/10.1016/j.eswa.2021.116382 

306 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

2. Alahmadi, K., Alharbi, S., Chen, J., & Wang, X. (2025). Generalizing sentiment analysis: A review of progress, challenges, and emerging directions. _Social Network Analysis and Mining, 15_ , 45. https://doi.org/10.1007/s13278-025-01461-8 

3. Alharbi, F. R., & Csala, D. (2022). A Seasonal Autoregressive Integrated Moving Average with Exogenous Factors (SARIMAX) Forecasting Model-Based Time Series Approach. _Inventions_ , _7_ (4), 94. https://doi.org/10.3390/inventions7040094 

4. Alqurafi, A., & Alsanoosy, T. (2024). Measuring customers’ satisfaction using sentiment Analysis: Model and tool. Journal of Computer Science, 20(4), 419–430. https://doi.org/10.3844/jcssp.2024.419.430 

5. Al-Sharafi, M. A., Iranmanesh, M., Al-Emran, M., Alzahrani, A. I., Herzallah, F., & Jamil, N. (2023). Determinants of cloud computing integration and its impact on sustainable performance in SMEs: An empirical investigation using the SEM-ANN approach. _Heliyon, 9_ (5), Article e16085. https://doi.org/10.1016/j.heliyon.2023.e16085 

6. Alsulami, A. A., Hamid, S., & Ghani, N. A. (2024). Organizational Factors Influencing Data Analytics Adoption in SMEs: A Systematic Review. _Journal of Cases on Information Technology, 26_ (1), 1–17. https://doi.org/10.4018/jcit.356673 

7. Assis, D. N., & Souza, V. M. A. (2025). ADWIN-U: adaptive windowing for unsupervised drift detection on data streams. _Knowledge and Information Systems_ , _67_ (11), 10005–10034. https://doi.org/10.1007/s10115-025-02523-1 

8. Bacasmas, J. A. V., Carlos, J. C. T., & Katigbak, J. J. P. (2022). E-commerce adoption and its impact on the performance of women-led MSMEs in Metro Manila: An ex-ante study for RCEP (PIDS Discussion Paper Series No. 2022-03). Philippine Institute for Development Studies. https://doi.org/10.62986/dp2022.03 

307 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

9. Bandara, K., Bergmeir, C., & Smyl, S. (2021). Forecasting across time series databases using recurrent neural networks on groups of similar series. _Expert Systems with Applications_ , 140, 112896. https://doi.org/10.1016/j.eswa.2019.112896 

10. Cai, Y.-J., & Choi, T.-M. (2023). Omni-channel marketing strategy in the digital platform era. Journal of Business Research, 168, 114197. https://doi.org/10.1016/j.jbusres.2023.114197 

11. Carvalho, I., Sá, F., & Bernardino, J. (2023). Performance Evaluation of NoSQL Document Databases: Couchbase, CouchDB, and MongoDB. Algorithms, 16(2), 78. https://doi.org/10.3390/a16020078 

12. Chen, A. H. L., & Gunawan, S. (2023). Enhancing Retail Transactions: A Data-Driven Recommendation Using Modified RFM Analysis and Association Rules Mining. _Applied Sciences, 13_ (18), 10057. https://doi.org/10.3390/app131810057 

13. Chidi, U. C., Onyesolu, M. O., Asogwa, D. C., & Egwu, C. V. (2024). Exploring Latent Dirichlet Allocation (LDA) in topic Modeling: Theory, applications, and future Directions. _NEWPORT INTERNATIONAL JOURNAL OF ENGINEERING AND PHYSICAL SCIENCES_ , _4_ (1), 9–16. https://doi.org/10.59298/nijep/2024/41916.1.1100 

14. D’Auria, B., Adan, I. J., Bekker, R., & Kulkarni, V. (2021). An M/M/c queue with queueing-time dependent service rates. _European Journal of Operational Research_ , _299_ (2), 566–579. https://doi.org/10.1016/j.ejor.2021.12.023 

15. Department of Trade and Industry. (2022). e-Commerce Philippines 2022 roadmap. https://ecommerce.dti.gov.ph/madali/images/eCommerce_Philippines_Roadmap_2022.p df 

16. Döring, L. (2024). _Optimizing Sales Forecasts through Automated Integration of Market Indicators_ . https://arxiv.org/html/2406.07564v1 

308 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

17. Febriani, A., Sopha, B. M., & Wibisono, M. A. (2025). Dynamic capabilities for omnichannel transformation in MSMEs: A comparative case study of fashion and furniture sectors. _Journal of Open Innovation Technology Market and Complexity_ , _11_ (1), 100498. https://doi.org/10.1016/j.joitmc.2025.100498 

18. Fildes, R., Ma, S., & Kolassa, S. (2022). Retail forecasting: Research and practice. _International Journal of Forecasting_ , 38(4), 1283–1318. https://doi.org/10.1016/j.ijforecast.2019.06.004 

19. Gopinathan, V. R. (2025). Context-Aware demand forecasting in grocery retail using generative AI: a multivariate approach incorporating weather, local events, and consumer behaviour. _International Journal of Innovative Research in Science Engineering and Technology_ , _14_ (01). https://doi.org/10.15680/ijirset.2025.1401105 

20. Groenendael, P. V. (2023, October 31). _Analytics maturity model: how to get the most out of your data strategy_ . https://supermetrics.com/blog/analytics-maturity-model 

21. Hunyadi, I. D., Constantinescu, N., & Țicleanu, O. A. (2025). Efficient discovery of association rules in e-commerce: Comparing candidate generation and pattern growth techniques. _Applied Sciences, 15_ (10), 5498. https://doi.org/10.3390/app15105498 

22. Hutri, H. (2023). _Comparison of React Native and Expo_ [Master's thesis, Lappeenranta-Lahti University of Technology LUT]. LUTPub Database. https://lutpub.lut.fi/handle/10024/165256 

23. Iglesias-Pradas, S., & Acquila-Natale, E. (2023). The future of e-commerce: Overview and prospects of multichannel and omnichannel retail. Journal of Theoretical and Applied Electronic Commerce Research, 18(1), 656–667. https://doi.org/10.3390/jtaer18010033 

309 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

24. Ikeh, C. O. (2025). Integrating AI with omnichannel marketing: Targeting high-value customers through cross-platform data fusion and intent recognition. _International Journal of Computer Applications Technology and Research, 14_ (5), 5-19. https://doi.org/10.7753/IJCATR1405.1002 

25. Israeli, A., Anderson, E. T., & Lax, S. T. (2022). The Value of Descriptive Analytics: Evidence from Online Retailers. _Marketing Science, 41_ (4), 1074–1096. https://www.researchgate.net/publication/359274469_The_Value_of_Descriptive_Analyti cs_Evidence_from_Online_Retailers 

26. Jayawardena, L., & Yapa, P. (2024). Parameter Efficient Diverse Paraphrase Generation Using Sequence-Level Knowledge Distillation. _arXiv (Cornell University)_ . https://doi.org/10.48550/arxiv.2404.12596 

27. Khan, S., et al. (2021). Sentiment analysis: A comprehensive survey. _Artificial Intelligence Review, 54_ , 323–368. https://www.researchgate.net/publication/375146575_A_Comprehensive_Survey_on_Se ntiment_Analysis_Techniques 

28. Kshetri, N., Dwivedi, Y. K., Davenport, T. H., & Panteli, N. (2024). Generative artificial intelligence in marketing: Applications, opportunities, challenges, and research agenda. International Journal of Information Management, 75, 102716. https://doi.org/10.1016/j.ijinfomgt.2023.102716 

29. Lee, M., Yu, S., Kwon, K., Lee, M., Lee, J., & Kim, H. (2024). Mixed-Integer linear programming model for scheduling missions and communications of multiple satellites. _Aerospace_ , _11_ (1), 83. https://doi.org/10.3390/aerospace11010083 

30. Mansur, S., Sattar, K., Hosseini, S. E., Pervez, S., Ahmad, I., Saleem, K., & Elhendi, A. 

   - Z. (2025). Sales forecasting for retail stores using hybrid neural networks and 

310 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

sales-affecting variables. _PeerJ Computer Science, 11_ , e3058. https://doi.org/10.7717/peerj-cs.3058 

31. Ma, X., Li, Y., & Asif, M. (2024). E-commerce review sentiment analysis and purchase intention prediction based on deep learning technology. _Journal of Organizational and End User Computing (JOEUC), 36_ (1), 1–29. https://doi.org/10.4018/JOEUC.335122 

32. Murley, P., Ma, Z., Mason, J., & Bailey, M. (2021). WebSocket adoption and the landscape of the real-time web. In _Proceedings of the Web Conference 2021_ . Association for Computing Machinery. https://doi.org/10.1145/3442381.3450063 

33. Nadurak, V. (2022). Prescriptive model of moral heuristics usage. _Filosofija Sociologija_ , _33_ (1). https://doi.org/10.6001/fil-soc.v33i1.4669 

34. National Privacy Commission. (2024). Advisory No. 2024-04: Guidelines on the application of Republic Act No. 10173 or the Data Privacy Act of 2012 to artificial intelligence systems processing personal data. https://privacy.gov.ph/wp-content/uploads/2025/02/Advisory-2024.12.19-Guidelines-on-A rtificial-Intelligence-w-SGD.pdf 

35. Omisola, J. O., Etukudoh, E. A., Onukwulu, E. C., & Osho, G. O. (2025). Real-Time Predictive Analytics and Business Intelligence for Accurate Demand Forecasting and Inventory Management in Modern Supply Chains. _International Journal of Academic and Applied Research (IJAAR)_ , _9_ (4). 

http://ijeais.org/wp-content/uploads/2025/4/IJAAR250426.pdf 

36. Owczarek, P. (2025). Application of operational data analysis in the optimization and enhancement of logistics process safety. EUROPEAN RESEARCH STUDIES JOURNAL, XXVIII(Issue 4), 627–643. https://doi.org/10.35808/ersj/4134 

311 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

37. Palczewska, A., Palczewski, J., Robinson, R. M., & Neagu, D. (2024). Interpreting random forest classification models using a feature contribution method. In _Advances in intelligent systems and computing_ (pp. 193–218). https://doi.org/10.1007/978-3-319-04717-1_9 

38. Ramadhani, I., Nindyasari, R., & Murti, A. C. (2025). Design and development of a Web-Based Point of sale System for Small-Scale Retail Management. _bit-Tech_ , _8_ (1), 181–189. https://doi.org/10.32877/bt.v8i1.2487 

39. Rizki, R. F., & Dhewanto, W. (2025). Scenario-Based Strategic capacity planning for powder mixing plant using discrete event modelling. European Journal of Business Management and Research, 10(4), 96–104. https://doi.org/10.24018/ejbmr.2025.10.4.2701 

40. Saeed, N., Nguyen, S., Cullinane, K., Gekara, V., & Chhetri, P. (2023). Forecasting container freight rates using the Prophet forecasting method. _Transport Policy_ , _133_ , 86–107. https://doi.org/10.1016/j.tranpol.2023.01.012 

41. Saeedi, P., Goodarzi, M., & Canbaz, M. A. (2025, April 7). _Heuristics and Biases in AI Decision-Making: Implications for Responsible AGI_ . https://arxiv.org/html/2410.02820v3 

42. Samineni, N. C. (2020). THRESHOLD-BASED ANOMALY DETECTION FOR OPERATIONAL RETAIL DASHBOARDS. _Zenodo (CERN European Organization for Nuclear Research)_ . https://doi.org/10.5281/zenodo.17802253 

43. Sarker, I.H. Data Science and Analytics: An Overview from Data-Driven Smart Computing, Decision-Making and Applications Perspective. _SN COMPUT. SCI._ 2, 377 (2021). https://doi.org/10.1007/s42979-021-00765-8 

312 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

44. Sharma, A. (2024). Master Data Management: a must for every organization. _International Journal of Computer Trends and Technology_ , _72_ (9), 51–56. https://doi.org/10.14445/22312803/ijctt-v72i9p109 

45. Shim, S., Ko, D., Lee, H., Lee, S., Song, D., Hwang, S., Kim, S., & Kim, S. (2024). O2ARC 3.0: A Platform for Solving and Creating ARC Tasks. Proceedings of the Thirty-ThirdInternational Joint Conference on Artificial Intelligence, 8793–8796. https://doi.org/10.24963/ijcai.2024/1034 

46. Smyth, C., Dennehy, D., Fosso Wamba, S., Scott, M., & Harfouche, A. (2024). Artificial intelligence and prescriptive analytics for supply chain resilience: A systematic literature review and research agenda. International Journal of Production Research, 62(23), 8537–8561. https://doi.org/10.1080/00207543.2024.2341415 

47. Song, Y., Hu, Z., Li, T., & Fan, H. (2022). Performance Evaluation Metrics and Approaches for Target Tracking: a survey. _Sensors_ , _22_ (3), 793. https://doi.org/10.3390/s22030793 

48. Tabassi, E. (2023). Artificial intelligence risk management framework (AI RMF 1.0) (NIST AI 100-1). National Institute of Standards and Technology. https://doi.org/10.6028/NIST.AI.100-1 

49. Tsai, P., Berleant, D., Segall, R. S., Aboudja, H., Batthula, V. J. R., Duggirala, S., & Howell, M. (2023). Quantitative Technology Forecasting: A review of trend Extrapolation methods. _International Journal of Innovation and Technology Management_ , _20_ (04). https://doi.org/10.1142/s0219877023300021 

50. Udeze, C. G., & Ngwu, C. L. (2025). Omnichannel Operations Management and Business Performance in the Retail Industry: An Empirical Study. _Journal of Emerging_ 

313 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

_Trends in Management Sciences and Entrepreneurship_ , _7_ (2), 378–398. https://www.jetmase.com/index.php/jetmase/article/view/151 

51. Vallamsetla, K. (2024). The Impact of Server-Side Rendering on UI Performance and SEO. International Journal of Scientific Research in Computer Science, Engineering and Information Technology, 10(5), 795–804. 

52. Verma, A. (2026). Automation of alerts based on operational maturity levels. _Journal of Information Systems Engineering & Management_ , _11_ (1s), 118–126. https://doi.org/10.52783/jisem.v11i1s.14053 

53. Wang, X., Feng, M., Qiu, J., Gu, J., & Zhao, J. (2024). From news to forecast: Integrating event analysis in LLM-based time series forecasting with reflection. _arXiv_ . https://doi.org/10.48550/arxiv.2409.17515 

54. Wissuchek, C., & Zschech, P. (2024). Prescriptive analytics systems revised: A systematic literature review from an information systems perspective. _Information Systems and e-Business Management, 23_ , 279–353. https://doi.org/10.1007/s10257-024-00688-w 

55. Wogrin, S. (2022, June 7). Time series aggregation for optimization: One-size-fits-all? arXiv.org. https://arxiv.org/abs/2206.03186 

56. Wong, H., & Perumal, S. (2025). Model Retraining Strategies: A Literature Review and 

   - Identification of Research Gaps. _ResearchGate_ . https://doi.org/10.13140/rg.2.2.24176.32001 

57. Youvan, D. C. (2024). Understanding Sentiment Analysis with VADER: A Comprehensive Overview and Application. _ResearchGate_ https://doi.org/10.13140/rg.2.2.33567.98726 

314 

## **UNIVERSITY OF SANTO TOMAS COLLEGE OF INFORMATION AND COMPUTING SCIENCES Information Systems Department** 

58. Yu, H. (2024). Research on the Application of Association Rule Algorithm Based on FP-Growth in College English Information Teaching. _dl.acm.org_ , 23–27. https://doi.org/10.1145/3677779.3677783 

59. Zamani, E. D., Griva, A., & Conboy, K. (2022). Using Business Analytics for SME Business Model Transformation under Pandemic Time Pressure. _Information Systems Frontiers, 24_ (4), 1145–1166. https://doi.org/10.1007/s10796-022-10255-8 

60. Zanabazar, A., Ganzorig, B., & Otgonsuren, B. (2025b). Optimizing inventory level by using the VBEOQ model. _European Journal of Business Management and Research_ , _10_ (2), 42–48. https://doi.org/10.24018/ejbmr.2025.10.2.2606 

61. Zhang, Q., Chen, M., & Li, L. (2021). Real-time data processing architecture for high-concurrency systems. _Journal of Systems Architecture_ , 115, 101977. https://doi.org/10.1016/j.sysarc.2021.101977 

315 

