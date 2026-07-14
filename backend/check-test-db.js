const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  const trRes = await db.collection('transactions').countDocuments();
  const csvRes = await db.collection('csvuploads').countDocuments();
  console.log(`test database has ${trRes} transactions and ${csvRes} csvuploads.`);
  await mongoose.disconnect();
}

run().catch(console.error);
