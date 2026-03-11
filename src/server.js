require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('./utils/logger');
const auditLog = require('./middleware/auditLog');
const { initDatabase } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// ── HIPAA-compliant security headers ──
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://sandbox.bluebutton.cms.gov", "https://api.bluebutton.cms.gov"]
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

app.use(cors({ origin: process.env.APP_URL || 'http://localhost:3000', credentials: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use(limiter);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Session with secure config
app.use(session({
  secret: process.env.SESSION_SECRET || uuidv4(),
  resave: false,
  saveUninitialized: false,
  name: '__hsph_sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 30 * 60 * 1000,
    sameSite: 'lax'
  }
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Audit logging middleware
app.use(auditLog);

// ── Routes ──
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/api/bluebutton', require('./routes/bluebutton'));
app.use('/api/medications', require('./routes/medications'));
app.use('/api/claims', require('./routes/claims'));
app.use('/api/care-gaps', require('./routes/careGaps'));
app.use('/api/survey', require('./routes/survey'));
app.use('/api/insights', require('./routes/insights'));

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path });
  res.status(500).render('error', { message: 'An unexpected error occurred', error: process.env.NODE_ENV === 'development' ? err : {} });
});

// 404
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found', error: {} });
});

// Initialize DB and start
initDatabase().then(() => {
  app.listen(PORT, () => {
    logger.info(`Healthcare Select Patient Hub running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(err => {
  logger.error('Failed to initialize database', { error: err.message });
  process.exit(1);
});
