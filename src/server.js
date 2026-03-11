'use strict';
require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const expressLayouts = require('express-ejs-layouts');
const winston = require('winston');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

// Security
app.use((req, res, next) => {
  res.locals.cspNonce = uuidv4();
  next();
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.tailwindcss.com", (req, res) => `'nonce-${res.locals.cspNonce}'`],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, maxAge: 24*60*60*1000 }
}));

// Rate limiting
app.use(rateLimit({ windowMs: 15*60*1000, max: 100 }));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Global template vars
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.bbData = req.session.bbData || null;
  res.locals.isDemoUser = !!req.session.isDemoUser;
  next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/dashboard/medications', require('./routes/medications'));
app.use('/dashboard/care-gaps', require('./routes/careGaps'));
app.use('/dashboard/plan-insights', require('./routes/insights'));
app.use('/dashboard/assessment', require('./routes/survey'));
app.use('/dashboard/care-team', require('./routes/claims'));
app.use('/api/bluebutton', require('./routes/bluebutton'));

// 404
app.use((req, res) => {
  res.status(404).render('error', { title: '404', statusCode: 404, message: 'Page not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).render('error', { title: 'Error', statusCode: 500, message: 'Something went wrong' });
});

app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
