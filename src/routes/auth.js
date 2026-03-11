const router = require('express').Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { query, validationResult } = require('express-validator');
const { getDb, encrypt } = require('../db/database');
const logger = require('../utils/logger');

const BB_BASE = process.env.BB_ENV === 'production'
  ? 'https://api.bluebutton.cms.gov'
  : 'https://sandbox.bluebutton.cms.gov';

// ── Validation rules ──────────────────────────────────────────────────────────
// These run before the route handler and validate untrusted OAuth callback
// params before they touch any business logic.
const callbackValidationRules = [
  // 'code' is an opaque OAuth authorization code from CMS.
  // We don't know its exact format, but we can cap length and strip whitespace
  // to prevent log injection and oversized payloads being forwarded to the
  // token endpoint.
  query('code')
    .exists({ checkFalsy: true }).withMessage('Missing authorization code')
    .isString()
    .trim()
    .isLength({ min: 1, max: 512 }).withMessage('Authorization code has invalid length'),

  // 'state' is the UUID we generated in /connect-medicare; validate the shape
  // before we even attempt the session comparison.
  query('state')
    .exists({ checkFalsy: true }).withMessage('Missing state parameter')
    .isUUID(4).withMessage('State parameter is not a valid UUID')
];

// ── Connect Medicare (OAuth initiation) ───────────────────────────────────────
router.get('/connect-medicare', (req, res) => {
  const state = uuidv4();
  req.session.oauthState = state;
  const authUrl =
    `${BB_BASE}/v2/o/authorize/` +
    `?client_id=${encodeURIComponent(process.env.BB_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(process.env.BB_REDIRECT_URI)}` +
    `&response_type=code` +
    `&state=${encodeURIComponent(state)}`;
  res.redirect(authUrl);
});

// ── OAuth Callback ────────────────────────────────────────────────────────────
router.get(
  '/callback',
  // 1. Validate & sanitize query params before any other logic.
  callbackValidationRules,
  async (req, res) => {
    // 2. Reject immediately if validation failed.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('OAuth callback validation failed', {
        errors: errors.array(),
        ip: req.ip
      });
      return res.status(400).render('error', {
        message: 'Invalid callback parameters.',
        error: {}
      });
    }

    try {
      // req.query values are trimmed by express-validator at this point.
      const { code, state } = req.query;

      // 3. State / CSRF check – must match what we stored at initiation.
      if (!req.session.oauthState || state !== req.session.oauthState) {
        logger.warn('OAuth state mismatch', {
          expected: req.session.oauthState,
          received: state,
          ip: req.ip
        });
        return res.status(403).render('error', {
          message: 'Authentication failed: invalid state parameter.',
          error: {}
        });
      }
      // Consume the state immediately to prevent replay.
      delete req.session.oauthState;

      // 4. Exchange authorization code for tokens.
      const tokenRes = await axios.post(
        `${BB_BASE}/v2/o/token/`,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: process.env.BB_REDIRECT_URI,
          client_id: process.env.BB_CLIENT_ID,
          client_secret: process.env.BB_CLIENT_SECRET
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const {
        access_token,
        refresh_token,
        expires_in,
        patient: fhirPatientId,
        scope
      } = tokenRes.data;

      // 5. Upsert user record.
      const db = getDb();
      let user = db.prepare('SELECT * FROM users WHERE medicare_bene_id = ?').get(fhirPatientId);
      if (!user) {
        const userId = uuidv4();
        db.prepare(
          'INSERT INTO users (id, medicare_bene_id, created_at, last_login) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
        ).run(userId, fhirPatientId);
        user = { id: userId, medicare_bene_id: fhirPatientId };
      } else {
        db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
      }

      // 6. Store tokens encrypted at rest (AES-256-GCM via encrypt()).
      const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
      db.prepare(
        `INSERT OR REPLACE INTO bb_tokens
          (user_id, access_token_enc, refresh_token_enc, expires_at, scope, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      ).run(
        user.id,
        encrypt(access_token),
        refresh_token ? encrypt(refresh_token) : null,
        expiresAt,
        scope
      );

      req.session.userId = user.id;
      req.session.fhirPatientId = fhirPatientId;
      logger.info('User authenticated via Blue Button', { userId: user.id });
      res.redirect('/dashboard');
    } catch (err) {
      logger.error('OAuth callback error', { error: err.message });
      res.status(500).render('error', {
        message: 'Failed to connect to Medicare.',
        error: {}
      });
    }
  }
);

// ── Logout ────────────────────────────────────────────────────────────────────
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// ── Consent form (GET) ────────────────────────────────────────────────────────
// generateCsrfToken() is set on res.locals by server.js middleware.
// The token is passed to the view so the form can include it as a hidden field.
router.get('/consent', (req, res) => {
  const csrfToken = res.locals.generateCsrfToken();
  res.render('consent', {
    title: 'Data Use Consent',
    csrfToken
  });
});

// ── Consent form (POST) ───────────────────────────────────────────────────────
// doubleCsrfProtection in server.js validates the CSRF token automatically
// before this handler is reached. No additional CSRF check needed here.
router.post('/consent', (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  const db = getDb();
  db.prepare(
    'UPDATE users SET consent_given = 1, consent_date = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(req.session.userId);
  res.redirect('/dashboard');
});

module.exports = router;
