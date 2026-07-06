require("dotenv").config();

const { MongoClient } = require("mongodb");
const { createClient } = require("@supabase/supabase-js");

const requiredEnv = [
    "MONGODB_URI",
    "MONGODB_DB",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
];

for (const key of requiredEnv) {
    if (!process.env[key]) {
        throw new Error(`Missing environment variable: ${key}`);
    }
}

const mongoClient = new MongoClient(process.env.MONGODB_URI);

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// -----------------------------
// Helpers
// -----------------------------
function getDateId(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return Number(`${year}${month}${day}`);
}

function getIsoDayOfWeek(date) {
    const day = date.getDay();
    return day === 0 ? 7 : day;
}

function getWeekOfYear(date) {
    const tempDate = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );

    const dayNum = tempDate.getUTCDay() || 7;
    tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);

    const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));

    return Math.ceil(((tempDate - yearStart) / 86400000 + 1) / 7);
}

function getSeason(month) {
    if ([12, 1, 2, 3, 4, 5].includes(month)) return "Dry Season";
    return "Wet Season";
}

function normalizeChannel(sourcePlatform) {
    const platform = String(sourcePlatform || "").toLowerCase();

    if (platform.includes("shopee")) {
        return {
            channel_id: "CH_SHOPEE",
            channel_name: "Shopee",
            channel_type: "E-Commerce",
        };
    }

    if (platform.includes("tiktok")) {
        return {
            channel_id: "CH_TIKTOK",
            channel_name: "TikTok Shop",
            channel_type: "E-Commerce",
        };
    }

    if (platform.includes("pethub")) {
        return {
            channel_id: "CH_PETHUB",
            channel_name: "PetHub",
            channel_type: "Internal Digital Platform",
        };
    }

    if (platform.includes("pos") || platform.includes("physical")) {
        return {
            channel_id: "CH_POS",
            channel_name: "POS",
            channel_type: "Physical Store",
        };
    }

    return {
        channel_id: "CH_UNKNOWN",
        channel_name: "Unknown Channel",
        channel_type: "Unknown",
    };
}

function normalizeSegment(segmentName) {
    const name = String(segmentName || "Retail").toLowerCase();

    if (name.includes("service") || name.includes("grooming")) {
        return {
            segment_id: "SEG_SERVICE",
            segment_name: "Service",
            segment_type: "Service",
        };
    }

    if (name.includes("cafe") || name.includes("food")) {
        return {
            segment_id: "SEG_CAFE",
            segment_name: "Cafe",
            segment_type: "Food and Beverage",
        };
    }

    return {
        segment_id: "SEG_RETAIL",
        segment_name: "Retail",
        segment_type: "Product",
    };
}

// -----------------------------
// Validation
// -----------------------------
function validateOrder(order) {
    const errors = [];

    if (!order.transaction_id) errors.push("Missing transaction_id");
    if (!order.source_platform) errors.push("Missing source_platform");
    if (!order.order_date) errors.push("Missing order_date");
    if (!order.business_segment) errors.push("Missing business_segment");

    if (!Array.isArray(order.items) || order.items.length === 0) {
        errors.push("Missing items array");
    }

    for (const item of order.items || []) {
        if (!item.product_id) errors.push("Missing product_id");
        if (!item.product_name) errors.push("Missing product_name");
        if (!item.category) errors.push("Missing category");

        if (item.quantity == null || Number(item.quantity) < 0) {
            errors.push("Invalid quantity");
        }

        if (item.unit_price == null || Number(item.unit_price) < 0) {
            errors.push("Invalid unit_price");
        }
    }

    return errors;
}

// -----------------------------
// Dimension Upserts
// -----------------------------
async function upsertDateDim(orderDate) {
    const date = new Date(orderDate);
    const dateId = getDateId(orderDate);
    const dayOfWeek = getIsoDayOfWeek(date);
    const month = date.getMonth() + 1;

    const row = {
        date_id: dateId,
        full_date: orderDate,
        day_of_week: dayOfWeek,
        day_name: date.toLocaleDateString("en-US", { weekday: "long" }),
        week_of_year: getWeekOfYear(date),
        month,
        month_name: date.toLocaleDateString("en-US", { month: "long" }),
        quarter: Math.ceil(month / 3),
        year: date.getFullYear(),
        is_weekend: dayOfWeek === 6 || dayOfWeek === 7,
        is_holiday: false,
        day_before_holiday: false,
        day_after_holiday: false,
        holiday_name: null,
        season: getSeason(month),
    };

    const { error } = await supabase
        .from("date_dim")
        .upsert(row, { onConflict: "date_id" });

    if (error) throw new Error(`date_dim upsert failed: ${error.message}`);

    return dateId;
}

async function upsertChannelDim(channel) {
    const { error } = await supabase
        .from("channel_dim")
        .upsert(channel, { onConflict: "channel_id" });

    if (error) throw new Error(`channel_dim upsert failed: ${error.message}`);

    return channel.channel_id;
}

async function upsertSegmentDim(segment) {
    const { error } = await supabase
        .from("business_segment_dim")
        .upsert(segment, { onConflict: "segment_id" });

    if (error) throw new Error(`business_segment_dim upsert failed: ${error.message}`);

    return segment.segment_id;
}

async function upsertCustomerDim(customer) {
    if (!customer?.customer_id) return null;

    const row = {
        customer_id: customer.customer_id,
        customer_type: customer.customer_type || null,
        loyalty_status: customer.loyalty_status || null,
        customer_segment: customer.customer_segment || null,
        anonymized_profile: {
            location: customer.location || null,
        },
    };

    const { error } = await supabase
        .from("customer_dim")
        .upsert(row, { onConflict: "customer_id" });

    if (error) throw new Error(`customer_dim upsert failed: ${error.message}`);

    return row.customer_id;
}

async function upsertProductDim(item) {
    const row = {
        product_id: item.product_id,
        sku: item.sku || null,
        product_name: item.product_name,
        category: item.category,
        brand: item.brand || null,
        unit_cost: Number(item.unit_cost || 0),
        selling_price: Number(item.unit_price || 0),
    };

    const { error } = await supabase
        .from("product_dim")
        .upsert(row, { onConflict: "product_id" });

    if (error) throw new Error(`product_dim upsert failed: ${error.message}`);

    return row.product_id;
}

async function upsertCampaignDim(campaign, channelId) {
    if (!campaign?.campaign_id) return null;

    const row = {
        campaign_id: campaign.campaign_id,
        campaign_name:
            campaign.campaign_name || campaign.promo_type || "Unnamed Campaign",
        promo_type: campaign.promo_type || null,
        target_channel_id: channelId,
        start_date: campaign.start_date || null,
        end_date: campaign.end_date || null,
    };

    const { error } = await supabase
        .from("campaign_dim")
        .upsert(row, { onConflict: "campaign_id" });

    if (error) throw new Error(`campaign_dim upsert failed: ${error.message}`);

    return row.campaign_id;
}

// -----------------------------
// Fact Insert / Update
// -----------------------------
async function upsertFactTransaction(rawOrder, ids, item, itemIndex) {
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unit_price || 0);
    const lineGrossSales = quantity * unitPrice;

    const orderGrossSales = Number(rawOrder.payment?.gross_sales || lineGrossSales);
    const orderDiscount = Number(rawOrder.payment?.discount_amount || 0);

    const totalItemGross = rawOrder.items.reduce((sum, currentItem) => {
        return sum + Number(currentItem.quantity || 0) * Number(currentItem.unit_price || 0);
    }, 0);

    const discountShare =
        totalItemGross > 0 ? (lineGrossSales / totalItemGross) * orderDiscount : 0;

    const lineNetSales = lineGrossSales - discountShare;

    const transactionLineId = `${rawOrder.transaction_id}-${item.product_id}-${itemIndex + 1}`;

    const factRow = {
        transaction_line_id: transactionLineId,
        transaction_id: rawOrder.transaction_id,
        source_order_id: rawOrder.source_order_id || null,
        transaction_timestamp: new Date(rawOrder.order_date).toISOString(),
        date_id: ids.dateId,
        product_id: item.product_id,
        customer_id: ids.customerId || null,
        channel_id: ids.channelId,
        service_id: null,
        campaign_id: ids.campaignId || null,
        segment_id: ids.segmentId,
        quantity_sold: quantity,
        gross_sales: lineGrossSales,
        discount_amount: discountShare,
        net_sales: lineNetSales,
        order_status: rawOrder.order_status || "completed",
        source_system: rawOrder.source_platform || null,
    };

    console.log("Upserting fact row:");
    console.log(factRow);

    const { data, error } = await supabase
        .from("fact_cross_channel_transactions")
        .upsert(factRow, { onConflict: "transaction_line_id" })
        .select("*");

    if (error) {
        console.error("Supabase fact upsert error:", error);
        throw new Error(`fact upsert failed: ${error.message}`);
    }

    console.log("Fact row loaded:");
    console.log(data);

    return data;
}

// -----------------------------
// Main ETL
// -----------------------------
async function runEtlTest() {
    await mongoClient.connect();

    const db = mongoClient.db(process.env.MONGODB_DB || "woof_staging");
    const rawOrders = db.collection("raw_orders");

    console.log("Connected to MongoDB database:", db.databaseName);
    console.log("Checking for pending raw orders...");

    const rawOrder = await rawOrders.findOne({
        staging_status: { $regex: "^pending\\s*$", $options: "i" },
    });

    if (!rawOrder) {
        console.log("No pending raw orders found.");
        return;
    }

    console.log("Found raw MongoDB order:", rawOrder._id.toString());

    const validationErrors = validateOrder(rawOrder);

    if (validationErrors.length > 0) {
        await rawOrders.updateOne(
            { _id: rawOrder._id },
            {
                $set: {
                    staging_status: "rejected",
                    validation_errors: validationErrors,
                    validated_at: new Date(),
                },
            }
        );

        console.log("Order rejected:");
        console.log(validationErrors);
        return;
    }

    try {
        const channel = normalizeChannel(rawOrder.source_platform);
        const segment = normalizeSegment(rawOrder.business_segment);

        const dateId = await upsertDateDim(rawOrder.order_date);
        const channelId = await upsertChannelDim(channel);
        const segmentId = await upsertSegmentDim(segment);
        const customerId = await upsertCustomerDim(rawOrder.customer);
        const campaignId = await upsertCampaignDim(rawOrder.campaign, channelId);

        for (let i = 0; i < rawOrder.items.length; i++) {
            const item = rawOrder.items[i];

            const productId = await upsertProductDim(item);

            await upsertFactTransaction(
                rawOrder,
                {
                    dateId,
                    channelId,
                    segmentId,
                    customerId,
                    productId,
                    campaignId,
                },
                item,
                i
            );
        }

        await rawOrders.updateOne(
            { _id: rawOrder._id },
            {
                $set: {
                    staging_status: "processed",
                    processed_at: new Date(),
                    validation_errors: [],
                    etl_error: null,
                },
            }
        );

        console.log("ETL test successful.");
        console.log(
            "MongoDB raw order was staged, validated, transformed, and loaded into Supabase."
        );
    } catch (error) {
        await rawOrders.updateOne(
            { _id: rawOrder._id },
            {
                $set: {
                    staging_status: "failed",
                    etl_error: error.message,
                    failed_at: new Date(),
                },
            }
        );

        console.error("ETL failed:", error.message);
    }
}

runEtlTest()
    .catch((error) => {
        console.error("Unexpected ETL error:", error);
    })
    .finally(async () => {
        await mongoClient.close();
    });