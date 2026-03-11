const fs = require('fs');
const path = require('path');

function w(f, c) {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, c);
  console.log('Created: ' + f);
}

// package.json
w('package.json', JSON.stringify({
  name: 'healthcare-select-patient-hub',
  version: '2.0.0',
  description: 'Healthcare Select Health OS - Blue Button 2.0 powered',
  main: 'src/server.js',
  scripts: { start: 'node src/server.js', dev: 'node --watch src/server.js' },
  dependencies: {
    express: '^4.18.2', ejs: '^3.1.9', 'express-session': '^1.17.3',
    helmet: '^7.1.0', winston: '^3.11.0', uuid: '^9.0.0',
    dotenv: '^16.3.1', 'cookie-parser': '^1.4.6',
    compression: '^1.7.4', 'express-rate-limit': '^7.1.4'
  }
}, null, 2));

// .env.example
w('.env.example', `BB2_CLIENT_ID=your_bb2_client_id
BB2_CLIENT_SECRET=your_bb2_secret
BB2_CALLBACK_URL=http://localhost:3000/auth/callback
SESSION_SECRET=change-me-in-production
NODE_ENV=development
PORT=3000
`);

// render.yaml
w('render.yaml', `services:\n  - type: web\n    name: healthcare-select-patient-hub\n    runtime: node\n    buildCommand: npm install\n    startCommand: node src/server.js\n    envVars:\n      - key: NODE_ENV\n        value: production\n      - key: SESSION_SECRET\n        generateValue: true\n`);

// src/server.js
w('src/server.js', `'use strict';
require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

const app = express();
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
      scriptSrc: ["'self'", "https://cdn.tailwindcss.com", (req, res) => \`'nonce-\${res.locals.cspNonce}'\`],
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

app.listen(PORT, () => logger.info(\`Server running on port \${PORT}\`));
`);

// src/routes/index.js
w('src/routes/index.js', `const router = require('express').Router();

router.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('landing', { title: 'Healthcare Select Health OS', page: 'home' });
});

router.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

module.exports = router;
`);

// src/routes/auth.js
w('src/routes/auth.js', `const router = require('express').Router();
const https = require('https');
const querystring = require('querystring');

const BB2_AUTH_URL = 'https://sandbox.bluebutton.cms.gov/v2/o/authorize';
const BB2_TOKEN_URL = 'https://sandbox.bluebutton.cms.gov/v2/o/token/';

router.get('/login', (req, res) => {
  const params = querystring.stringify({
    response_type: 'code',
    client_id: process.env.BB2_CLIENT_ID,
    redirect_uri: process.env.BB2_CALLBACK_URL,
    scope: 'patient/Patient.read patient/Coverage.read patient/ExplanationOfBenefit.read profile'
  });
  res.redirect(BB2_AUTH_URL + '?' + params);
});

router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.redirect('/?error=no_code');
    // Token exchange would happen here in production
    req.session.user = { name: 'Medicare Beneficiary', connected: true };
    req.session.bbConnected = true;
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Auth error:', err);
    res.redirect('/?error=auth_failed');
  }
});

router.get('/demo', (req, res) => {
  req.session.user = { name: 'Demo User', connected: false };
  req.session.isDemoUser = true;
  req.session.bbData = getDemoData();
  res.redirect('/dashboard');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

function getDemoData() {
  return {
    patient: { name: 'Jane Smith', birthDate: '1952-03-15', id: 'demo-123', gender: 'female', address: { city: 'Tampa', state: 'FL' } },
    coverage: { planName: 'Medicare Part A & B', type: 'Medicare', status: 'active', memberId: 'DEMO-1234567890' },
    medications: [
      { name: 'Lisinopril 10mg', status: 'active', prescriber: 'Dr. Johnson', refillDate: '2025-04-01', adherence: 92 },
      { name: 'Metformin 500mg', status: 'active', prescriber: 'Dr. Chen', refillDate: '2025-03-28', adherence: 87 },
      { name: 'Atorvastatin 20mg', status: 'active', prescriber: 'Dr. Johnson', refillDate: '2025-04-10', adherence: 95 },
      { name: 'Amlodipine 5mg', status: 'active', prescriber: 'Dr. Patel', refillDate: '2025-03-25', adherence: 78 }
    ],
    careGaps: [
      { name: 'Annual Wellness Visit', status: 'overdue', dueDate: '2025-01-15', priority: 'high', description: 'Schedule your yearly preventive checkup' },
      { name: 'Diabetes Eye Exam', status: 'due_soon', dueDate: '2025-04-30', priority: 'medium', description: 'Annual diabetic retinopathy screening' },
      { name: 'Colon Cancer Screening', status: 'due_soon', dueDate: '2025-06-01', priority: 'high', description: 'Colonoscopy due per screening schedule' },
      { name: 'Flu Vaccination', status: 'completed', dueDate: '2024-10-15', priority: 'low', description: 'Annual influenza vaccine' }
    ],
    claims: [
      { date: '2025-02-10', provider: 'Tampa General Hospital', type: 'Outpatient', charged: 850, allowed: 420, paid: 336, owed: 84 },
      { date: '2025-01-20', provider: 'Dr. Johnson Family Medicine', type: 'Office Visit', charged: 250, allowed: 175, paid: 140, owed: 35 },
      { date: '2024-12-05', provider: 'Quest Diagnostics', type: 'Lab Work', charged: 380, allowed: 195, paid: 156, owed: 39 }
    ],
    providers: [
      { name: 'Dr. Sarah Johnson', specialty: 'Primary Care', phone: '(813) 555-0101', npi: '1234567890' },
      { name: 'Dr. Michael Chen', specialty: 'Endocrinology', phone: '(813) 555-0202', npi: '0987654321' },
      { name: 'Dr. Priya Patel', specialty: 'Cardiology', phone: '(813) 555-0303', npi: '1122334455' }
    ],
    spending: { ytd: 1480, deductible: 233, deductibleMax: 240, outOfPocketMax: 7550, outOfPocket: 158 },
    fetchedAt: new Date().toISOString()
  };
}

module.exports = router;
`);

// src/routes/dashboard.js
w('src/routes/dashboard.js', `const router = require('express').Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/');
  next();
}

router.get('/', requireAuth, (req, res) => {
  const data = req.session.bbData || {};
  res.render('dashboard', {
    title: 'Dashboard', page: 'dashboard',
    patient: data.patient || null,
    coverage: data.coverage || null,
    medications: data.medications || [],
    careGaps: data.careGaps || [],
    spending: data.spending || null
  });
});

router.get('/profile', requireAuth, (req, res) => {
  const data = req.session.bbData || {};
  res.render('profile', {
    title: 'My Profile', page: 'profile',
    patient: data.patient || null,
    coverage: data.coverage || null
  });
});

module.exports = router;
`);

// src/routes/medications.js
w('src/routes/medications.js', `const router = require('express').Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/');
  next();
}

router.get('/', requireAuth, (req, res) => {
  const data = req.session.bbData || {};
  res.render('medications', {
    title: 'Medications', page: 'medications',
    medications: data.medications || []
  });
});

module.exports = router;
`);

// src/routes/careGaps.js
w('src/routes/careGaps.js', `const router = require('express').Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/');
  next();
}

router.get('/', requireAuth, (req, res) => {
  const data = req.session.bbData || {};
  res.render('care-gaps', {
    title: 'Care Gaps', page: 'care-gaps',
    careGaps: data.careGaps || []
  });
});

module.exports = router;
`);

// src/routes/insights.js
w('src/routes/insights.js', `const router = require('express').Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/');
  next();
}

router.get('/', requireAuth, (req, res) => {
  const data = req.session.bbData || {};
  res.render('insights', {
    title: 'Plan Insights', page: 'insights',
    spending: data.spending || null,
    claims: data.claims || []
  });
});

module.exports = router;
`);

// src/routes/survey.js
w('src/routes/survey.js', `const router = require('express').Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/');
  next();
}

router.get('/', requireAuth, (req, res) => {
  res.render('survey', { title: 'Health Assessment', page: 'assessment' });
});

router.post('/', requireAuth, (req, res) => {
  req.session.surveyComplete = true;
  res.json({ success: true, message: 'Assessment saved' });
});

module.exports = router;
`);

// src/routes/claims.js
w('src/routes/claims.js', `const router = require('express').Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/');
  next();
}

router.get('/', requireAuth, (req, res) => {
  const data = req.session.bbData || {};
  res.render('care-team', {
    title: 'Care Team', page: 'care-team',
    providers: data.providers || [],
    claims: data.claims || []
  });
});

module.exports = router;
`);

// src/routes/bluebutton.js
w('src/routes/bluebutton.js', `const router = require('express').Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/');
  next();
}

router.get('/status', requireAuth, (req, res) => {
  res.json({
    connected: !!req.session.bbConnected,
    dataFetched: !!req.session.bbData,
    isDemoUser: !!req.session.isDemoUser
  });
});

module.exports = router;
`);

// src/views/layout.ejs
w('src/views/layout.ejs', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= title %> | Healthcare Select</title>
  <script src="https://cdn.tailwindcss.com" nonce="<%= typeof cspNonce !== 'undefined' ? cspNonce : '' %>"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    h1, h2, h3 { font-family: 'Lora', serif; }
    .brand-navy { color: #1B3D6E; }
    .bg-brand-navy { background-color: #1B3D6E; }
    .brand-red { color: #C8102E; }
    .bg-brand-red { background-color: #C8102E; }
  </style>
</head>
<body class="bg-gray-50 min-h-screen flex flex-col">
  <!-- Navigation -->
  <nav class="bg-brand-navy text-white shadow-lg">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16 items-center">
        <a href="/" class="text-xl font-bold tracking-tight">Healthcare Select</a>
        <button id="mobileMenuBtn" class="md:hidden p-2 rounded" onclick="document.getElementById('mobileMenu').classList.toggle('hidden')">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <div class="hidden md:flex items-center space-x-6">
          <% if (typeof user !== 'undefined' && user) { %>
            <a href="/dashboard" class="hover:text-gray-300 transition">Dashboard</a>
            <a href="/dashboard/medications" class="hover:text-gray-300 transition">Medications</a>
            <a href="/dashboard/care-gaps" class="hover:text-gray-300 transition">Care Gaps</a>
            <a href="/dashboard/plan-insights" class="hover:text-gray-300 transition">Plan Insights</a>
            <a href="/dashboard/care-team" class="hover:text-gray-300 transition">Care Team</a>
            <a href="/dashboard/assessment" class="hover:text-gray-300 transition">Assessment</a>
            <a href="/auth/logout" class="bg-brand-red px-4 py-2 rounded-lg hover:opacity-90 transition">Logout</a>
          <% } else { %>
            <a href="/auth/demo" class="bg-white text-brand-navy px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition">Try Demo</a>
            <a href="/auth/login" class="bg-brand-red px-4 py-2 rounded-lg hover:opacity-90 transition">Connect Medicare</a>
          <% } %>
        </div>
      </div>
    </div>
    <!-- Mobile menu -->
    <div id="mobileMenu" class="hidden md:hidden px-4 pb-4 space-y-2">
      <% if (typeof user !== 'undefined' && user) { %>
        <a href="/dashboard" class="block py-2 hover:text-gray-300">Dashboard</a>
        <a href="/dashboard/medications" class="block py-2 hover:text-gray-300">Medications</a>
        <a href="/dashboard/care-gaps" class="block py-2 hover:text-gray-300">Care Gaps</a>
        <a href="/dashboard/plan-insights" class="block py-2 hover:text-gray-300">Plan Insights</a>
        <a href="/dashboard/care-team" class="block py-2 hover:text-gray-300">Care Team</a>
        <a href="/dashboard/assessment" class="block py-2 hover:text-gray-300">Assessment</a>
        <a href="/auth/logout" class="block py-2 text-red-300">Logout</a>
      <% } else { %>
        <a href="/auth/demo" class="block py-2">Try Demo</a>
        <a href="/auth/login" class="block py-2">Connect Medicare</a>
      <% } %>
    </div>
  </nav>

  <main class="flex-1">
    <%- body %>
  </main>

  <footer class="bg-brand-navy text-white py-8 mt-12">
    <div class="max-w-7xl mx-auto px-4 text-center">
      <p class="text-sm opacity-75">&copy; 2025 Healthcare Select. All rights reserved. | HIPAA Compliant</p>
    </div>
  </footer>
</body>
</html>
`);

// Actually, we need express-ejs-layouts. Let me add it to package.json deps.
// First, let me write the landing page view
w('src/views/landing.ejs', `<%- include('partials/header') %>

<div class="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
  <div class="max-w-7xl mx-auto px-4 py-20 sm:py-32">
    <div class="text-center">
      <h1 class="text-4xl sm:text-6xl font-bold mb-6">Your Health Command Center</h1>
      <p class="text-xl sm:text-2xl text-blue-200 mb-10 max-w-3xl mx-auto">Connect your Medicare Blue Button data to get personalized insights, manage medications, close care gaps, and take control of your healthcare journey.</p>
      <div class="flex flex-col sm:flex-row justify-center gap-4">
        <a href="/auth/demo" class="bg-white text-blue-900 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-100 transition shadow-lg">Try Demo</a>
        <a href="/auth/login" class="bg-brand-red px-8 py-4 rounded-xl text-lg font-bold hover:opacity-90 transition shadow-lg">Connect Medicare Data</a>
      </div>
    </div>
  </div>
</div>

<div class="max-w-7xl mx-auto px-4 py-16">
  <h2 class="text-3xl font-bold text-center brand-navy mb-12">Powered by Blue Button 2.0</h2>
  <div class="grid md:grid-cols-3 gap-8">
    <div class="bg-white rounded-xl p-8 shadow-md text-center">
      <div class="text-4xl mb-4">&#x1F48A;</div>
      <h3 class="text-xl font-bold brand-navy mb-3">Medication Management</h3>
      <p class="text-gray-600">Track medications, adherence scores, and get refill reminders powered by your claims data.</p>
    </div>
    <div class="bg-white rounded-xl p-8 shadow-md text-center">
      <div class="text-4xl mb-4">&#x1F3AF;</div>
      <h3 class="text-xl font-bold brand-navy mb-3">Care Gap Detection</h3>
      <p class="text-gray-600">AI-powered analysis identifies missed screenings and preventive care opportunities.</p>
    </div>
    <div class="bg-white rounded-xl p-8 shadow-md text-center">
      <div class="text-4xl mb-4">&#x1F4CA;</div>
      <h3 class="text-xl font-bold brand-navy mb-3">Plan Insights</h3>
      <p class="text-gray-600">Understand your spending, deductibles, and out-of-pocket costs in real time.</p>
    </div>
  </div>
</div>

<div class="bg-white py-16">
  <div class="max-w-7xl mx-auto px-4">
    <h2 class="text-3xl font-bold text-center brand-navy mb-12">Your Complete Health Ecosystem</h2>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="border-2 border-blue-100 rounded-xl p-6">
        <h3 class="font-bold brand-navy mb-2">SelectRx Pharmacy</h3>
        <p class="text-sm text-gray-600">50-state licensed pharmacy with home delivery and medication therapy management.</p>
      </div>
      <div class="border-2 border-blue-100 rounded-xl p-6">
        <h3 class="font-bold brand-navy mb-2">Virtual Care</h3>
        <p class="text-sm text-gray-600">50-state licensed virtual care practice for convenient telehealth visits.</p>
      </div>
      <div class="border-2 border-blue-100 rounded-xl p-6">
        <h3 class="font-bold brand-navy mb-2">CCM & RPM</h3>
        <p class="text-sm text-gray-600">Chronic Care Management with Remote Patient Monitoring for ongoing support.</p>
      </div>
      <div class="border-2 border-blue-100 rounded-xl p-6">
        <h3 class="font-bold brand-navy mb-2">Healthcare Select</h3>
        <p class="text-sm text-gray-600">First-party health and lifestyle surveys powering personalized recommendations.</p>
      </div>
    </div>
  </div>
</div>

<%- include('partials/footer') %>
`);

// src/views/partials/header.ejs
w('src/views/partials/header.ejs', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= title %> | Healthcare Select</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    h1, h2, h3 { font-family: 'Lora', serif; }
    .brand-navy { color: #1B3D6E; }
    .bg-brand-navy { background-color: #1B3D6E; }
    .brand-red { color: #C8102E; }
    .bg-brand-red { background-color: #C8102E; }
  </style>
</head>
<body class="bg-gray-50 min-h-screen flex flex-col">
  <nav class="bg-brand-navy text-white shadow-lg">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16 items-center">
        <a href="/" class="text-xl font-bold">Healthcare Select</a>
        <button onclick="document.getElementById('mobileMenu').classList.toggle('hidden')" class="md:hidden p-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <div class="hidden md:flex items-center space-x-6">
          <% if (typeof user !== 'undefined' && user) { %>
            <a href="/dashboard" class="hover:text-gray-300">Dashboard</a>
            <a href="/dashboard/medications" class="hover:text-gray-300">Medications</a>
            <a href="/dashboard/care-gaps" class="hover:text-gray-300">Care Gaps</a>
            <a href="/dashboard/plan-insights" class="hover:text-gray-300">Plan Insights</a>
            <a href="/dashboard/care-team" class="hover:text-gray-300">Care Team</a>
            <a href="/dashboard/assessment" class="hover:text-gray-300">Assessment</a>
            <a href="/auth/logout" class="bg-brand-red px-4 py-2 rounded-lg">Logout</a>
          <% } else { %>
            <a href="/auth/demo" class="bg-white text-blue-900 px-4 py-2 rounded-lg font-semibold">Try Demo</a>
            <a href="/auth/login" class="bg-brand-red px-4 py-2 rounded-lg">Connect Medicare</a>
          <% } %>
        </div>
      </div>
    </div>
    <div id="mobileMenu" class="hidden md:hidden px-4 pb-4 space-y-2">
      <% if (typeof user !== 'undefined' && user) { %>
        <a href="/dashboard" class="block py-2">Dashboard</a>
        <a href="/dashboard/medications" class="block py-2">Medications</a>
        <a href="/dashboard/care-gaps" class="block py-2">Care Gaps</a>
        <a href="/dashboard/plan-insights" class="block py-2">Plan Insights</a>
        <a href="/dashboard/care-team" class="block py-2">Care Team</a>
        <a href="/dashboard/assessment" class="block py-2">Assessment</a>
        <a href="/auth/logout" class="block py-2 text-red-300">Logout</a>
      <% } else { %>
        <a href="/auth/demo" class="block py-2">Try Demo</a>
        <a href="/auth/login" class="block py-2">Connect Medicare</a>
      <% } %>
    </div>
  </nav>
  <main class="flex-1">
`);

// src/views/partials/footer.ejs
w('src/views/partials/footer.ejs', `  </main>
  <footer class="bg-brand-navy text-white py-8 mt-12">
    <div class="max-w-7xl mx-auto px-4 text-center">
      <p class="text-sm opacity-75">&copy; 2025 Healthcare Select. All rights reserved. | HIPAA Compliant</p>
    </div>
  </footer>
</body>
</html>
`);

// src/views/dashboard.ejs
w('src/views/dashboard.ejs', `<%- include('partials/header') %>
<div class="max-w-7xl mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-8">
    <h1 class="text-3xl font-bold brand-navy">Health Dashboard</h1>
    <% if (typeof isDemoUser !== 'undefined' && isDemoUser) { %>
      <span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">Demo Mode</span>
    <% } %>
  </div>

  <% if (patient) { %>
  <div class="grid md:grid-cols-4 gap-6 mb-8">
    <div class="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-600">
      <p class="text-sm text-gray-500">Patient</p>
      <p class="text-lg font-bold brand-navy"><%= patient.name %></p>
      <p class="text-sm text-gray-400"><%= patient.address ? patient.address.city + ', ' + patient.address.state : '' %></p>
    </div>
    <div class="bg-white rounded-xl p-6 shadow-sm border-l-4 border-green-500">
      <p class="text-sm text-gray-500">Coverage</p>
      <p class="text-lg font-bold"><%= coverage ? coverage.planName : 'N/A' %></p>
      <p class="text-sm text-green-600"><%= coverage ? coverage.status : '' %></p>
    </div>
    <div class="bg-white rounded-xl p-6 shadow-sm border-l-4 border-orange-500">
      <p class="text-sm text-gray-500">Active Medications</p>
      <p class="text-3xl font-bold"><%= medications.length %></p>
    </div>
    <div class="bg-white rounded-xl p-6 shadow-sm border-l-4 border-red-500">
      <p class="text-sm text-gray-500">Care Gaps</p>
      <p class="text-3xl font-bold"><%= careGaps.filter(g => g.status !== 'completed').length %></p>
      <p class="text-sm text-red-600">need attention</p>
    </div>
  </div>

  <div class="grid md:grid-cols-2 gap-8">
    <div class="bg-white rounded-xl p-6 shadow-sm">
      <h2 class="text-xl font-bold brand-navy mb-4">Medications</h2>
      <% medications.slice(0,3).forEach(med => { %>
        <div class="flex justify-between items-center py-3 border-b last:border-0">
          <div>
            <p class="font-medium"><%= med.name %></p>
            <p class="text-sm text-gray-500"><%= med.prescriber %></p>
          </div>
          <div class="text-right">
            <span class="<%= med.adherence >= 90 ? 'text-green-600' : med.adherence >= 80 ? 'text-yellow-600' : 'text-red-600' %> font-bold"><%= med.adherence %>%</span>
            <p class="text-xs text-gray-400">adherence</p>
          </div>
        </div>
      <% }) %>
      <a href="/dashboard/medications" class="block text-center mt-4 text-blue-600 hover:underline">View all medications &rarr;</a>
    </div>

    <div class="bg-white rounded-xl p-6 shadow-sm">
      <h2 class="text-xl font-bold brand-navy mb-4">Care Gaps</h2>
      <% careGaps.filter(g => g.status !== 'completed').slice(0,3).forEach(gap => { %>
        <div class="flex justify-between items-center py-3 border-b last:border-0">
          <div>
            <p class="font-medium"><%= gap.name %></p>
            <p class="text-sm text-gray-500"><%= gap.description %></p>
          </div>
          <span class="<%= gap.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800' %> px-2 py-1 rounded-full text-xs font-medium"><%= gap.status %></span>
        </div>
      <% }) %>
      <a href="/dashboard/care-gaps" class="block text-center mt-4 text-blue-600 hover:underline">View all care gaps &rarr;</a>
    </div>
  </div>

  <% if (spending) { %>
  <div class="mt-8 bg-white rounded-xl p-6 shadow-sm">
    <h2 class="text-xl font-bold brand-navy mb-4">Spending Summary</h2>
    <div class="grid md:grid-cols-3 gap-6">
      <div>
        <p class="text-sm text-gray-500">YTD Spending</p>
        <p class="text-2xl font-bold">$<%= spending.ytd.toLocaleString() %></p>
      </div>
      <div>
        <p class="text-sm text-gray-500">Deductible</p>
        <p class="text-2xl font-bold">$<%= spending.deductible %> / $<%= spending.deductibleMax %></p>
        <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div class="bg-blue-600 h-2 rounded-full" style="width: <%= Math.min(100, (spending.deductible/spending.deductibleMax)*100) %>%"></div>
        </div>
      </div>
      <div>
        <p class="text-sm text-gray-500">Out-of-Pocket</p>
        <p class="text-2xl font-bold">$<%= spending.outOfPocket %> / $<%= spending.outOfPocketMax.toLocaleString() %></p>
        <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div class="bg-green-600 h-2 rounded-full" style="width: <%= Math.min(100, (spending.outOfPocket/spending.outOfPocketMax)*100) %>%"></div>
        </div>
      </div>
    </div>
  </div>
  <% } %>
  <% } else { %>
  <div class="text-center py-20">
    <p class="text-xl text-gray-500 mb-4">No health data loaded yet.</p>
    <a href="/auth/login" class="bg-brand-red text-white px-6 py-3 rounded-lg">Connect Blue Button</a>
  </div>
  <% } %>
</div>
<%- include('partials/footer') %>
`);

// src/views/medications.ejs
w('src/views/medications.ejs', `<%- include('partials/header') %>
<div class="max-w-7xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold brand-navy mb-8">Medications</h1>
  <div class="grid gap-4">
    <% medications.forEach(med => { %>
    <div class="bg-white rounded-xl p-6 shadow-sm flex justify-between items-center">
      <div>
        <h3 class="text-lg font-bold"><%= med.name %></h3>
        <p class="text-gray-500">Prescribed by <%= med.prescriber %></p>
        <p class="text-sm text-gray-400">Next refill: <%= med.refillDate %></p>
      </div>
      <div class="text-right">
        <div class="text-2xl font-bold <%= med.adherence >= 90 ? 'text-green-600' : med.adherence >= 80 ? 'text-yellow-600' : 'text-red-600' %>"><%= med.adherence %>%</div>
        <p class="text-xs text-gray-400">adherence</p>
        <span class="inline-block mt-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs"><%= med.status %></span>
      </div>
    </div>
    <% }) %>
  </div>
</div>
<%- include('partials/footer') %>
`);

// src/views/care-gaps.ejs
w('src/views/care-gaps.ejs', `<%- include('partials/header') %>
<div class="max-w-7xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold brand-navy mb-8">Care Gaps</h1>
  <div class="grid gap-4">
    <% careGaps.forEach(gap => { %>
    <div class="bg-white rounded-xl p-6 shadow-sm border-l-4 <%= gap.status === 'overdue' ? 'border-red-500' : gap.status === 'completed' ? 'border-green-500' : 'border-yellow-500' %>">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="text-lg font-bold"><%= gap.name %></h3>
          <p class="text-gray-500"><%= gap.description %></p>
          <p class="text-sm text-gray-400 mt-1">Due: <%= gap.dueDate %></p>
        </div>
        <span class="<%= gap.status === 'overdue' ? 'bg-red-100 text-red-800' : gap.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800' %> px-3 py-1 rounded-full text-sm font-medium"><%= gap.status %></span>
      </div>
    </div>
    <% }) %>
  </div>
</div>
<%- include('partials/footer') %>
`);

// src/views/insights.ejs
w('src/views/insights.ejs', `<%- include('partials/header') %>
<div class="max-w-7xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold brand-navy mb-8">Plan Insights</h1>
  <% if (spending) { %>
  <div class="grid md:grid-cols-3 gap-6 mb-8">
    <div class="bg-white rounded-xl p-6 shadow-sm">
      <p class="text-sm text-gray-500">Year-to-Date Spending</p>
      <p class="text-3xl font-bold brand-navy">$<%= spending.ytd.toLocaleString() %></p>
    </div>
    <div class="bg-white rounded-xl p-6 shadow-sm">
      <p class="text-sm text-gray-500">Deductible Progress</p>
      <p class="text-3xl font-bold">$<%= spending.deductible %> / $<%= spending.deductibleMax %></p>
      <div class="w-full bg-gray-200 rounded-full h-3 mt-3">
        <div class="bg-blue-600 h-3 rounded-full" style="width: <%= Math.min(100,(spending.deductible/spending.deductibleMax)*100) %>%"></div>
      </div>
    </div>
    <div class="bg-white rounded-xl p-6 shadow-sm">
      <p class="text-sm text-gray-500">Out-of-Pocket Max</p>
      <p class="text-3xl font-bold">$<%= spending.outOfPocket %> / $<%= spending.outOfPocketMax.toLocaleString() %></p>
      <div class="w-full bg-gray-200 rounded-full h-3 mt-3">
        <div class="bg-green-600 h-3 rounded-full" style="width: <%= Math.min(100,(spending.outOfPocket/spending.outOfPocketMax)*100) %>%"></div>
      </div>
    </div>
  </div>
  <% } %>
  <h2 class="text-2xl font-bold brand-navy mb-4">Recent Claims</h2>
  <div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <table class="w-full">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
          <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Charged</th>
          <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">You Owe</th>
        </tr>
      </thead>
      <tbody>
        <% claims.forEach(claim => { %>
        <tr class="border-t">
          <td class="px-6 py-4 text-sm"><%= claim.date %></td>
          <td class="px-6 py-4 text-sm font-medium"><%= claim.provider %></td>
          <td class="px-6 py-4 text-sm"><%= claim.type %></td>
          <td class="px-6 py-4 text-sm text-right">$<%= claim.charged %></td>
          <td class="px-6 py-4 text-sm text-right font-bold">$<%= claim.owed %></td>
        </tr>
        <% }) %>
      </tbody>
    </table>
  </div>
</div>
<%- include('partials/footer') %>
`);

// src/views/survey.ejs
w('src/views/survey.ejs', `<%- include('partials/header') %>
<div class="max-w-3xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold brand-navy mb-8">Health Assessment</h1>
  <form id="surveyForm" class="space-y-8">
    <div class="bg-white rounded-xl p-6 shadow-sm">
      <h2 class="text-xl font-bold mb-4">General Health</h2>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">How would you rate your overall health?</label>
          <select name="overallHealth" class="w-full border rounded-lg p-3">
            <option>Excellent</option><option>Very Good</option><option>Good</option><option>Fair</option><option>Poor</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Do you exercise regularly?</label>
          <select name="exercise" class="w-full border rounded-lg p-3">
            <option>5+ days/week</option><option>3-4 days/week</option><option>1-2 days/week</option><option>Rarely</option><option>Never</option>
          </select>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-xl p-6 shadow-sm">
      <h2 class="text-xl font-bold mb-4">Chronic Conditions</h2>
      <div class="grid grid-cols-2 gap-3">
        <label class="flex items-center"><input type="checkbox" name="conditions" value="diabetes" class="mr-2"> Diabetes</label>
        <label class="flex items-center"><input type="checkbox" name="conditions" value="hypertension" class="mr-2"> Hypertension</label>
        <label class="flex items-center"><input type="checkbox" name="conditions" value="heart" class="mr-2"> Heart Disease</label>
        <label class="flex items-center"><input type="checkbox" name="conditions" value="copd" class="mr-2"> COPD</label>
        <label class="flex items-center"><input type="checkbox" name="conditions" value="arthritis" class="mr-2"> Arthritis</label>
        <label class="flex items-center"><input type="checkbox" name="conditions" value="depression" class="mr-2"> Depression</label>
      </div>
    </div>
    <button type="submit" class="w-full bg-brand-red text-white py-4 rounded-xl text-lg font-bold hover:opacity-90 transition">Submit Assessment</button>
  </form>
</div>
<script>
document.getElementById('surveyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const resp = await fetch('/dashboard/assessment', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(Object.fromEntries(formData)) });
  if (resp.ok) { alert('Assessment saved!'); window.location.href = '/dashboard'; }
});
</script>
<%- include('partials/footer') %>
`);

// src/views/care-team.ejs
w('src/views/care-team.ejs', `<%- include('partials/header') %>
<div class="max-w-7xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold brand-navy mb-8">Care Team</h1>
  <div class="grid md:grid-cols-3 gap-6">
    <% providers.forEach(doc => { %>
    <div class="bg-white rounded-xl p-6 shadow-sm">
      <h3 class="text-lg font-bold brand-navy"><%= doc.name %></h3>
      <p class="text-gray-500"><%= doc.specialty %></p>
      <p class="text-sm mt-2"><%= doc.phone %></p>
      <p class="text-xs text-gray-400 mt-1">NPI: <%= doc.npi %></p>
    </div>
    <% }) %>
  </div>
  <% if (claims && claims.length) { %>
  <h2 class="text-2xl font-bold brand-navy mt-12 mb-4">Recent Visits</h2>
  <div class="space-y-3">
    <% claims.forEach(c => { %>
    <div class="bg-white rounded-lg p-4 shadow-sm flex justify-between items-center">
      <div>
        <p class="font-medium"><%= c.provider %></p>
        <p class="text-sm text-gray-500"><%= c.type %> - <%= c.date %></p>
      </div>
      <p class="font-bold">$<%= c.owed %></p>
    </div>
    <% }) %>
  </div>
  <% } %>
</div>
<%- include('partials/footer') %>
`);

// src/views/profile.ejs
w('src/views/profile.ejs', `<%- include('partials/header') %>
<div class="max-w-3xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold brand-navy mb-8">My Profile</h1>
  <% if (patient) { %>
  <div class="bg-white rounded-xl p-8 shadow-sm">
    <div class="grid grid-cols-2 gap-6">
      <div><p class="text-sm text-gray-500">Name</p><p class="text-lg font-bold"><%= patient.name %></p></div>
      <div><p class="text-sm text-gray-500">Date of Birth</p><p class="text-lg font-bold"><%= patient.birthDate %></p></div>
      <div><p class="text-sm text-gray-500">Gender</p><p class="text-lg font-bold capitalize"><%= patient.gender %></p></div>
      <div><p class="text-sm text-gray-500">Location</p><p class="text-lg font-bold"><%= patient.address ? patient.address.city + ', ' + patient.address.state : 'N/A' %></p></div>
    </div>
    <% if (coverage) { %>
    <hr class="my-6">
    <h2 class="text-xl font-bold brand-navy mb-4">Coverage</h2>
    <div class="grid grid-cols-2 gap-6">
      <div><p class="text-sm text-gray-500">Plan</p><p class="text-lg font-bold"><%= coverage.planName %></p></div>
      <div><p class="text-sm text-gray-500">Status</p><p class="text-lg font-bold text-green-600"><%= coverage.status %></p></div>
      <div><p class="text-sm text-gray-500">Member ID</p><p class="text-lg font-bold"><%= coverage.memberId %></p></div>
    </div>
    <% } %>
  </div>
  <% } %>
</div>
<%- include('partials/footer') %>
`);

// src/views/error.ejs
w('src/views/error.ejs', `<%- include('partials/header') %>
<div class="max-w-xl mx-auto px-4 py-20 text-center">
  <h1 class="text-6xl font-bold brand-navy mb-4"><%= statusCode %></h1>
  <p class="text-xl text-gray-600 mb-8"><%= message %></p>
  <a href="/" class="bg-brand-red text-white px-6 py-3 rounded-lg hover:opacity-90 transition">Go Home</a>
</div>
<%- include('partials/footer') %>
`);

// public/css/style.css
w('public/css/style.css', `/* Custom styles */\n`);

// public/js/app.js
w('public/js/app.js', `// Healthcare Select App JS\nconsole.log('Healthcare Select Health OS loaded');\n`);

console.log('\nAll files created successfully!');
console.log('Run: npm install && npm start');
