const fs = require('fs');
const csvPath = '/Users/rico/Downloads/HappyTailsPC.csv';
const lines = fs.readFileSync(csvPath, 'utf8').split('\n').slice(1);

let count = 0;
for (const line of lines) {
  if (!line.trim()) continue;
  const t = { date: line.split(',')[0] };
  const orderDate = new Date(t.date);
  
  const year = orderDate.getFullYear();
  const month = String(orderDate.getMonth() + 1).padStart(2, '0');
  const day = String(orderDate.getDate()).padStart(2, '0');
  const dateId = Number(`${year}${month}${day}`);
  const fullDate = `${year}-${month}-${day}`;
  
  // Try to simulate DB conversion
  const dbDateId = Number(fullDate.replace(/-/g, ''));
  if (dateId !== dbDateId) {
    console.log("MISMATCH IN NODE:", { lineDate: t.date, dateId, fullDate });
    count++;
  }
}
console.log("Test mismatch done. Mismatches:", count);
