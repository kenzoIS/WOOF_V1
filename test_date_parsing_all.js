const fs = require('fs');

const csvPath = '/Users/rico/Downloads/HappyTailsPC.csv';
const lines = fs.readFileSync(csvPath, 'utf8').split('\n').slice(1);

let count = 0;
for (const line of lines) {
  if (!line.trim()) continue;
  const t = { date: line.split(',')[0] };
  const orderDate = new Date(t.date);
  
  if (isNaN(orderDate.getTime())) {
    console.log("BAD DATE FOUND:", line);
    count++;
    if (count > 5) break;
  } else {
    const year = orderDate.getFullYear();
    const month = String(orderDate.getMonth() + 1).padStart(2, '0');
    const day = String(orderDate.getDate()).padStart(2, '0');
    const dateId = Number(`${year}${month}${day}`);
    
    // Check if the formatting causes weird string concatenation
    if (String(dateId) !== `${year}${month}${day}`) {
        console.log("MISMATCH DATE ID:", dateId, `${year}${month}${day}`);
    }
  }
}
console.log("Test all done. Bad dates:", count);
