const Database = require('better-sqlite3');
const path = require('path');
const logger = require('../utils/logger');
const crypto = require('crypto');

let db;

function getDb() {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/patient_hub.db');
    const fs = require('fs');
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDatabase() {
  return new Promise((resolve, reject) => {
    try {
      const d = getDb();
      d.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          medicare_bene_id TEXT UNIQUE,
          display_name TEXT,
          email TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME,
          consent_given INTEGER DEFAULT 0,
          consent_date DATETIME
        );
        CREATE TABLE IF NOT EXISTS bb_tokens (
          user_id TEXT PRIMARY KEY REFERENCES users(id),
          access_token_enc TEXT NOT NULL,
          refresh_token_enc TEXT,
          token_type TEXT DEFAULT 'Bearer',
          expires_at DATETIME,
          scope TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS claims_cache (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT REFERENCES users(id),
          resource_type TEXT NOT NULL,
          fhir_id TEXT,
          data_enc TEXT NOT NULL,
          fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, resource_type, fhir_id)
        );
        CREATE TABLE IF NOT EXISTS medications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT REFERENCES users(id),
          ndc TEXT,
          rxnorm_code TEXT,
          drug_name TEXT,
          prescriber TEXT,
          fill_date TEXT,
          days_supply INTEGER,
          quantity REAL,
          cost REAL,
          source TEXT DEFAULT 'bluebutton',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS care_gaps (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT REFERENCES users(id),
          gap_type TEXT NOT NULL,
          description TEXT,
          priority TEXT DEFAULT 'medium',
          status TEXT DEFAULT 'open',
          due_date TEXT,
          resolved_date TEXT,
          source TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS survey_responses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT REFERENCES users(id),
          survey_type TEXT NOT NULL,
          question_key TEXT NOT NULL,
          answer TEXT,
          answered_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS care_plans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT REFERENCES users(id),
          title TEXT,
          description TEXT,
          goals TEXT,
          actions TEXT,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS audit_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          action TEXT NOT NULL,
          resource TEXT,
          detail TEXT,
          ip_address TEXT,
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_claims_user ON claims_cache(user_id);
        CREATE INDEX IF NOT EXISTS idx_meds_user ON medications(user_id);
        CREATE INDEX IF NOT EXISTS idx_gaps_user ON care_gaps(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_log(created_at);
      `);
      logger.info('Database initialized successfully');
      resolve();
    } catch (err) {
      logger.error('Database initialization failed', { error: err.message });
      reject(err);
    }
  });
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = parts.join(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { getDb, initDatabase, encrypt, decrypt };
