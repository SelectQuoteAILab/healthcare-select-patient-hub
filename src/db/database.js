const Database = require('better-sqlite3');
const path = require('path');
const logger = require('../utils/logger');
const crypto = require('crypto');

// ── Encryption key bootstrap ──────────────────────────────────────────────────
// HARD FAIL: a random fallback would silently re-key on every restart, making
// all previously encrypted PHI (tokens, claims) permanently unreadable.
if (!process.env.ENCRYPTION_KEY) {
  throw new Error(
    'FATAL: ENCRYPTION_KEY environment variable is not set. ' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}

// Key must be exactly 32 bytes (64 hex chars) for AES-256.
const RAW_KEY = process.env.ENCRYPTION_KEY;
if (!/^[0-9a-fA-F]{64}$/.test(RAW_KEY)) {
  throw new Error(
    'FATAL: ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). ' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}
const ENCRYPTION_KEY_BUF = Buffer.from(RAW_KEY, 'hex');

// ── Database singleton ────────────────────────────────────────────────────────

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

// ── Schema ────────────────────────────────────────────────────────────────────

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

// ── AES-256-GCM Encryption Helpers ───────────────────────────────────────────
//
// Wire format (all hex, colon-delimited):  iv:authTag:ciphertext
//
//  • iv       – 12 bytes (96 bits) random nonce. GCM security depends on IV
//               uniqueness per key; a fresh random IV is generated for EVERY
//               encrypt() call, never reused.
//  • authTag  – 16 bytes (128 bits) GCM authentication tag. Decryption will
//               throw if the ciphertext or tag has been tampered with, giving
//               both confidentiality AND integrity for stored PHI/tokens.
//  • ciphertext – AES-256-GCM encrypted UTF-8 plaintext, hex-encoded.
//
// Why GCM over CBC:
//  • CBC provides confidentiality only; an attacker who can flip ciphertext
//    bytes can produce predictable plaintext changes (padding-oracle attacks).
//  • GCM is an authenticated encryption mode: any bit-flip in storage causes
//    decrypt() to throw, preventing silent data corruption or attack.

/**
 * Encrypts a UTF-8 plaintext string using AES-256-GCM.
 * Returns a colon-delimited hex string: "iv:authTag:ciphertext"
 *
 * @param {string} text - plaintext to encrypt
 * @returns {string} encrypted payload
 */
function encrypt(text) {
  // 12-byte IV is the NIST-recommended size for GCM; never reuse with same key.
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY_BUF, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // authTag must be retrieved AFTER cipher.final()
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a payload produced by encrypt().
 * Throws if the authTag does not match (tampered or corrupted ciphertext).
 *
 * @param {string} payload - "iv:authTag:ciphertext" hex string
 * @returns {string} decrypted UTF-8 plaintext
 */
function decrypt(payload) {
  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format; expected iv:authTag:ciphertext');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY_BUF, iv);
  // setAuthTag must be called before decipher.final() – GCM verifies on final()
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  // final() throws crypto.ERR_CRYPTO_GCM_AUTH_TAG_MISMATCH if tag is invalid
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = { getDb, initDatabase, encrypt, decrypt };
