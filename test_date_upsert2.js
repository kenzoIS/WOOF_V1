const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: '/Users/rico/Downloads/WOOF/WOOF_V1/backend/.env' });
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDateId(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return Number(`${year}${month}${day}`);
}

function getIsoDayOfWeek(date) {
    const day = date.getDay();
    return day === 0 ? 7 : day;
}

function getWeekOfYear(date) {
    const tempDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = tempDate.getUTCDay() || 7;
    tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
    return Math.ceil((((tempDate - yearStart) / 86400000) + 1) / 7);
}

async function run() {
    const csvPath = '/Users/rico/Downloads/HappyTailsPC.csv';
    const lines = fs.readFileSync(csvPath, 'utf8').split('\n').slice(1);
    const datesMap = new Map();

    for (const line of lines) {
      if (!line.trim()) continue;
      const t = { date: line.split(',')[0] };
      const orderDate = new Date(t.date);
      const dateId = getDateId(orderDate);
      
      if (!datesMap.has(dateId)) {
        const dateString = getLocalDateString(orderDate);
        const dayOfWeek = getIsoDayOfWeek(orderDate);
        const month = orderDate.getMonth() + 1;
        datesMap.set(dateId, {
            date_id: dateId,
            full_date: dateString,
            day_of_week: dayOfWeek,
            day_name: orderDate.toLocaleDateString('en-US', { weekday: 'long' }),
            week_of_year: getWeekOfYear(orderDate),
            month,
            month_name: orderDate.toLocaleDateString('en-US', { month: 'long' }),
            quarter: Math.ceil(month / 3),
            year: orderDate.getFullYear(),
            is_weekend: dayOfWeek === 6 || dayOfWeek === 7,
            is_holiday: false,
            day_before_holiday: false,
            day_after_holiday: false
        });
      }
    }

    console.log(`Found ${datesMap.size} unique dates.`);
    for (const [id, payload] of datesMap.entries()) {
        const res = await fetch(url + '/rest/v1/date_dim', { 
          method: 'POST',
          headers: { 
            'apikey': key, 
            'Authorization': 'Bearer ' + key,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.code && data.code !== '23505') { // Ignore duplicate keys
            console.log("FAILED ON:", payload, data);
            break;
        }
    }
    console.log("Test finished.");
}
run();
