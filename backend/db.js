// backend/db.js
const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'postgres',
  port: 5432,
});

client.connect()
  .then(() => console.log('Connected to database'))
  .catch(err => console.error('Database connection error', err));

module.exports = client;
