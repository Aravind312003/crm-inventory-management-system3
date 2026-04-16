import Database from 'better-sqlite3';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), 'crm_inventory.db');
const db = new Database(dbPath);

export const initDb = () => {
  console.log('initDb started');
  try {
    console.log('Creating users table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating suppliers table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_name TEXT NOT NULL,
        phone_number TEXT,
        email TEXT,
        address TEXT,
        gst_number TEXT
      )
    `);
    
    console.log('Creating products table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        serial_no TEXT UNIQUE NOT NULL,
        product_group TEXT NOT NULL,
        product_name TEXT NOT NULL
      )
    `);

    // Migrations for products
    try {
      db.exec('ALTER TABLE products RENAME COLUMN name TO product_group');
    } catch (e) {}
    try {
      db.exec('ALTER TABLE products RENAME COLUMN variant TO product_name');
    } catch (e) {}

    console.log('Creating stock table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS stock (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        serial_no TEXT UNIQUE NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        stock_quantity INTEGER NOT NULL,
        order_date TEXT NOT NULL,
        volume REAL NOT NULL,
        base_price REAL DEFAULT 0,
        has_gst INTEGER DEFAULT 0,
        total_price REAL NOT NULL,
        price_per_litre REAL NOT NULL,
        bill_type TEXT CHECK(bill_type IN ('Paid', 'Not Paid')),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Migrations for stock
    try {
      db.exec('ALTER TABLE stock ADD COLUMN base_price REAL DEFAULT 0');
    } catch (e) {}
    try {
      db.exec('ALTER TABLE stock ADD COLUMN has_gst INTEGER DEFAULT 0');
    } catch (e) {}
    try {
      db.exec('ALTER TABLE stock RENAME COLUMN variant TO product_name');
    } catch (e) {}

    console.log('Creating sales table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        vendor TEXT NOT NULL,
        product_name TEXT,
        bill_type TEXT CHECK(bill_type IN ('Paid', 'Not Paid')),
        quantity INTEGER,
        delivery_notes TEXT,
        amount_status TEXT,
        payment_received_date TEXT,
        amount REAL,
        volume REAL,
        other_price REAL DEFAULT 0,
        total_price REAL DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Migrations for sales
    try {
      db.exec('ALTER TABLE sales RENAME COLUMN variant TO product_name');
    } catch (e) {}

    try {
      db.exec('ALTER TABLE sales RENAME COLUMN deliver_to TO delivery_notes');
    } catch (e) {}

    try {
      db.exec('ALTER TABLE sales ADD COLUMN other_price REAL DEFAULT 0');
    } catch (e) {}

    try {
      db.exec('ALTER TABLE sales ADD COLUMN total_price REAL DEFAULT 0');
    } catch (e) {}

    try {
      db.exec('ALTER TABLE sales ADD COLUMN volume REAL');
    } catch (e) {}

    // Ensure product_id column exists for existing databases
    try {
      db.exec('ALTER TABLE sales ADD COLUMN product_id INTEGER');
    } catch (e) {
      // Column might already exist
    }
    console.log('initDb completed successfully');
  } catch (err) {
    console.error('initDb failed:', err);
    throw err;
  }
  return Promise.resolve();
};

export default db;
