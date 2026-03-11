require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const logger = require('./utils/logger');
const auditLog = require('./middleware/auditLog');
const { initDatabase } = require('./db/database');

// ── Hard-fail on missing secrets ─────────────────────────────────────────────
// A random fallback for SESSION_SECRET means every restart invalidates all
// active sessions AND produces a different CSRF signing secret, breaking
// in-flight requests. Never acceptable in production.
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error(
    'FATAL: SESSION_SECRET environment variable is not set. ' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
  );
}

const app = express();
const PORT = process.env.PORT || 3000;

// ── Nonce middleware (must run BEFORE helmet so res.locals.cspNonce is set) ──
// A per-request nonce replaces 'unsafe-inline' for script-src. Each HTML
// response includes <script nonce="..."> tags. Any injected inline script
// without the matching nonce is blocked by the browser.
app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

// ── HIPAA-compliant security headers ─────────────────────────────────────────
app.use((req, res, next) => {
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // 'unsafe-inline' REMOVED – use per-request nonce instead.
        // In EJS views, render inline scripts as:
        //   <script nonce="<%= cspNonce %>"> ... </script>
        scriptSrc: [
          "'self'",
          (req, res) => `'nonce-${res.locals.cspNonce}'`,
          'https://cdn.jsdelivr.net'
        ],
        styleSrc: [
          "'self'",
          // Inline styles are still allowed; tighten further by moving all
          // inline styles to external stylesheets if compliance requires it.
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
          'https://fonts.googleapis.com'
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: [
          "'self'",
          'https://sandbox.bluebutton.cms.gov',
          'https://api.bluebutton.cms.gov'
        ],
        // Explicitly block object/embed/frame to reduce attack surface on PHI views.
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"]
      }
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
  })(req, res, next);
});

app.use(cors({ origin: process.env.APP_URL || 'http://localhost:3000', credentials: true }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Global limiter: 100 req / 15 min
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.'
});
app.use(globalLimiter);

// Strict limiter for all /auth/* routes: 10 req / 15 min
// This covers the OAuth initiation, callback, and consent endpoints.
// Prevents enumeration of Medicare beneficiary IDs and token-exchange abuse.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts, please try again later.',
  // Skip rate limit on successful responses so legitimate retries after
  // genuine errors don't exhaust the window prematurely.
  skipSuccessfulRequests: false
});
app.use('/auth', authLimiter);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// cookie-parser is required by csrf-csrf for its cookie-based double-submit pattern
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '../public')));

// ── Session ───────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || uuidv4(), // uuidv4 fallback is dev-only (hard-fails in prod above)
  resave: false,
  saveUninitialized: false,
  name: '__hsph_sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 30 * 60 * 1000, // 30-minute HIPAA session timeout
    sameSite: 'lax'
  }
}));

// ── CSRF protection (csrf-csrf double-submit cookie pattern) ──────────────────
// Must be registered AFTER cookieParser and session.
// Protects all state-mutating routes (POST /auth/consent, etc.).
// GET / HEAD / OPTIONS are ignored automatically by csrf-csrf.
const { doubleCsrf } = require('csrf-csrf');
const { generateToken, doubleCsrfProtection } = doubleCsrf({
  // Signing secret – reuse SESSION_SECRET so key material stays in one place.
  getSecret: () => process.env.SESSION_SECRET || 'dev-csrf-secret-change-me',
  cookieName: process.env.NODE_ENV === 'production' ? '__Host-csrf' : '_csrf',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS']
});

// Expose generateToken on res.locals so routes can pass it to views.
app.use((req, res, next) => {
  res.locals.generateCsrfToken = () => generateToken(req, res);
  next();
});

// Apply CSRF protection globally; individual routes that need the token will
// call res.locals.generateCsrfToken() when rendering forms.
app.use(doubleCsrfProtection);

// ── View engine ───────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Audit logging ─────────────────────────────────────────────────────────────
app.use(auditLog);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/api/bluebutton', require('./routes/bluebutton'));
app.use('/api/medications', require('./routes/medications'));
app.use('/api/claims', require('./routes/claims'));
app.use('/api/care-gaps', require('./routes/careGaps'));
app.use('/api/survey', require('./routes/survey'));
app.use('/api/insights', require('./routes/insights'));

// ── Error handlers ────────────────────────────────────────────────────────────
// CSRF token mismatch
app.use((err, req, res, next) => {
  if (err.code === 'CSRF_INVALID' || err.message === 'invalid csrf token') {
    logger.warn('CSRF validation failed', { path: req.path, ip: req.ip });
    return res.status(403).render('error', { message: 'Invalid or expired form token. Please refresh and try again.', error: {} });
  }
  next(err);
});

// Generic error handler – never expose stack traces to the client in production.
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path });
  res.status(500).render('error', {
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found', error: {} });
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
initDatabase().then(() => {
  app.listen(PORT, () => {
    logger.info(`Healthcare Select Patient Hub running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(err => {
  logger.error('Failed to initialize database', { error: err.message });
  process.exit(1);
});
