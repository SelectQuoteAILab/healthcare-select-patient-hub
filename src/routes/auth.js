const router = require('express').Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { getDb, encrypt } = require('../db/database');
const logger = require('../utils/logger');

const BB_BASE = process.env.BB_ENV === 'production'
  ? 'https://api.bluebutton.cms.gov'
  : 'https://sandbox.bluebutton.cms.gov';

router.get('/connect-medicare', (req, res) => {
  const state = uuidv4();
  req.session.oauthState = state;
  const authUrl = `${BB_BASE}/v2/o/authorize/?client_id=${process.env.BB_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.BB_REDIRECT_URI)}&response_type=code&state=${state}`;
  res.redirect(authUrl);
});

router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (state !== req.session.oauthState) {
      logger.warn('OAuth state mismatch', { expected: req.session.oauthState, received: state });
      return res.status(403).render('error', { message: 'Authentication failed: state mismatch', error: {} });
    }
    delete req.session.oauthState;
    const tokenRes = await axios.post(`${BB_BASE}/v2/o/token/`, new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.BB_REDIRECT_URI,
      client_id: process.env.BB_CLIENT_ID,
      client_secret: process.env.BB_CLIENT_SECRET
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    const { access_token, refresh_token, expires_in, patient: fhirPatientId, scope } = tokenRes.data;
    const db = getDb();
    let user = db.prepare('SELECT * FROM users WHERE medicare_bene_id = ?').get(fhirPatientId);
    if (!user) {
      const userId = uuidv4();
      db.prepare('INSERT INTO users (id, medicare_bene_id, created_at, last_login) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)').run(userId, fhirPatientId);
      user = { id: userId, medicare_bene_id: fhirPatientId };
    } else {
      db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    }
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
    db.prepare(`INSERT OR REPLACE INTO bb_tokens (user_id, access_token_enc, refresh_token_enc, expires_at, scope, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`)
      .run(user.id, encrypt(access_token), refresh_token ? encrypt(refresh_token) : null, expiresAt, scope);
    req.session.userId = user.id;
    req.session.fhirPatientId = fhirPatientId;
    logger.info('User authenticated via Blue Button', { userId: user.id });
    res.redirect('/dashboard');
  } catch (err) {
    logger.error('OAuth callback error', { error: err.message });
    res.status(500).render('error', { message: 'Failed to connect to Medicare', error: {} });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

router.get('/consent', (req, res) => {
  res.render('consent', { title: 'Data Use Consent' });
});

router.post('/consent', (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  const db = getDb();
  db.prepare('UPDATE users SET consent_given = 1, consent_date = CURRENT_TIMESTAMP WHERE id = ?').run(req.session.userId);
  res.redirect('/dashboard');
});

module.exports = router;
