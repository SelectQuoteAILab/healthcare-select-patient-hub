const router = require('express').Router();
const axios = require('axios');
const { getDb, decrypt, encrypt } = require('../db/database');
const logger = require('../utils/logger');

const BB_BASE = process.env.BB_ENV === 'production' ? 'https://api.bluebutton.cms.gov' : 'https://sandbox.bluebutton.cms.gov';

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

async function getBBClient(userId) {
  const db = getDb();
  const token = db.prepare('SELECT * FROM bb_tokens WHERE user_id = ?').get(userId);
  if (!token) throw new Error('No Blue Button token found');
  const accessToken = decrypt(token.access_token_enc);
  if (new Date(token.expires_at) < new Date()) {
    if (!token.refresh_token_enc) throw new Error('Token expired and no refresh token');
    const refreshToken = decrypt(token.refresh_token_enc);
    const res = await axios.post(`${BB_BASE}/v2/o/token/`, new URLSearchParams({
      grant_type: 'refresh_token', refresh_token: refreshToken,
      client_id: process.env.BB_CLIENT_ID, client_secret: process.env.BB_CLIENT_SECRET
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    const expiresAt = new Date(Date.now() + res.data.expires_in * 1000).toISOString();
    db.prepare('UPDATE bb_tokens SET access_token_enc = ?, refresh_token_enc = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
      .run(encrypt(res.data.access_token), res.data.refresh_token ? encrypt(res.data.refresh_token) : token.refresh_token_enc, expiresAt, userId);
    return res.data.access_token;
  }
  return accessToken;
}

router.get('/patient', requireAuth, async (req, res) => {
  try {
    const token = await getBBClient(req.session.userId);
    const response = await axios.get(`${BB_BASE}/v2/fhir/Patient/${req.session.fhirPatientId}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/fhir+json' }
    });
    res.json(response.data);
  } catch (err) {
    logger.error('BB Patient fetch error', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch patient data' });
  }
});

router.get('/eob', requireAuth, async (req, res) => {
  try {
    const token = await getBBClient(req.session.userId);
    const response = await axios.get(`${BB_BASE}/v2/fhir/ExplanationOfBenefit/?patient=${req.session.fhirPatientId}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/fhir+json' }
    });
    res.json(response.data);
  } catch (err) {
    logger.error('BB EOB fetch error', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch claims data' });
  }
});

router.get('/coverage', requireAuth, async (req, res) => {
  try {
    const token = await getBBClient(req.session.userId);
    const response = await axios.get(`${BB_BASE}/v2/fhir/Coverage/?beneficiary=${req.session.fhirPatientId}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/fhir+json' }
    });
    res.json(response.data);
  } catch (err) {
    logger.error('BB Coverage fetch error', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch coverage data' });
  }
});

router.post('/sync', requireAuth, async (req, res) => {
  try {
    const token = await getBBClient(req.session.userId);
    const eobRes = await axios.get(`${BB_BASE}/v2/fhir/ExplanationOfBenefit/?patient=${req.session.fhirPatientId}&_count=50`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/fhir+json' }
    });
    const db = getDb();
    let synced = 0;
    if (eobRes.data.entry) {
      for (const entry of eobRes.data.entry) {
        const eob = entry.resource;
        db.prepare('INSERT OR REPLACE INTO claims_cache (user_id, resource_type, fhir_id, data_enc, fetched_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)')
          .run(req.session.userId, 'ExplanationOfBenefit', eob.id, encrypt(JSON.stringify(eob)));
        synced++;
      }
    }
    logger.info('BB sync complete', { userId: req.session.userId, synced });
    res.json({ success: true, synced });
  } catch (err) {
    logger.error('BB sync error', { error: err.message });
    res.status(500).json({ error: 'Sync failed' });
  }
});

module.exports = router;
