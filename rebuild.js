const fs = require('fs');
const path = require('path');

const viewsDir = 'src/views';
const partialsDir = path.join(viewsDir, 'partials');
const cssDir = 'public/css';

fs.mkdirSync(partialsDir, { recursive: true });
fs.mkdirSync(cssDir, { recursive: true });

// ===== CSS =====
fs.writeFileSync(path.join(cssDir, 'style.css'), `
:root {
  --navy: #1B3D6E;
  --red: #C8102E;
  --white: #FFFFFF;
  --light-gray: #F5F7FA;
  --medium-gray: #E2E8F0;
  --dark-gray: #4A5568;
  --text: #2D3748;
}
body { font-family: 'Inter', sans-serif; color: var(--text); }
h1, h2, h3, h4 { font-family: 'Lora', serif; color: var(--navy); }
.btn-primary { background: var(--red); color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; transition: all 0.2s; }
.btn-primary:hover { background: #a00d24; transform: translateY(-1px); }
.btn-secondary { background: var(--navy); color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; transition: all 0.2s; }
.btn-secondary:hover { background: #152e54; }
.card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 24px; border: 1px solid var(--medium-gray); }
.card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.nav-link { color: var(--navy); font-weight: 500; padding: 8px 16px; border-radius: 6px; transition: all 0.2s; }
.nav-link:hover { background: var(--light-gray); }
.dropdown-menu { background: white; border: 1px solid var(--medium-gray); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.hero-section { background: linear-gradient(135deg, var(--navy) 0%, #2a5298 100%); }
.stat-card { border-left: 4px solid var(--red); }
`);
console.log('Created style.css');

// ===== LAYOUT.EJS =====
fs.writeFileSync(path.join(viewsDir, 'layout.ejs'), `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= typeof title !== 'undefined' ? title : '' %> | Healthcare Select</title>
  <script src="https://cdn.tailwindcss.com" nonce="<%= typeof cspNonce !== 'undefined' ? cspNonce : '' %>"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
  <script nonce="<%= typeof cspNonce !== 'undefined' ? cspNonce : '' %>">
    tailwind.config = { theme: { extend: { colors: { navy: '#1B3D6E', red: '#C8102E', lightgray: '#F5F7FA' }, fontFamily: { serif: ['Lora', 'serif'], sans: ['Inter', 'sans-serif'] } } } }
  </script>
</head>
<body class="font-sans bg-gray-50 text-gray-800 min-h-screen flex flex-col">
  <nav class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16 items-center">
        <div class="flex items-center space-x-2">
          <svg class="w-8 h-8 text-red" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          <a href="/" class="text-xl font-serif font-bold text-navy">Healthcare Select</a>
        </div>
        <div class="hidden md:flex items-center space-x-1">
          <a href="/" class="nav-link">Home</a>
          <div class="relative group">
            <button class="nav-link inline-flex items-center">Medicare Resources <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></button>
            <div class="absolute left-0 mt-1 w-56 dropdown-menu hidden group-hover:block py-2 z-50">
              <a href="#" class="block px-4 py-2 text-sm hover:bg-gray-50">Medicare Advantage</a>
              <a href="#" class="block px-4 py-2 text-sm hover:bg-gray-50">Medicare Supplement</a>
              <a href="#" class="block px-4 py-2 text-sm hover:bg-gray-50">Medicare Part D</a>
              <a href="#" class="block px-4 py-2 text-sm hover:bg-gray-50">Resources</a>
            </div>
          </div>
          <div class="relative group">
            <button class="nav-link inline-flex items-center">Plan Tools <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></button>
            <div class="absolute left-0 mt-1 w-56 dropdown-menu hidden group-hover:block py-2 z-50">
              <a href="#" class="block px-4 py-2 text-sm hover:bg-gray-50">AI Plan Compare</a>
              <a href="#" class="block px-4 py-2 text-sm hover:bg-gray-50">AI Plan Recommender</a>
              <a href="#" class="block px-4 py-2 text-sm hover:bg-gray-50">Verify Current Coverage</a>
              <a href="#" class="block px-4 py-2 text-sm hover:bg-gray-50">Find Best Plan</a>
            </div>
          </div>
          <% if (typeof user !== 'undefined' && user) { %>
            <a href="/dashboard" class="nav-link">Dashboard</a>
            <a href="/auth/logout" class="btn-primary text-sm">Sign Out</a>
          <% } else { %>
            <a href="/auth/login" class="btn-primary text-sm">Sign In with Medicare</a>
          <% } %>
        </div>
        <button id="mobile-menu-btn" class="md:hidden p-2 rounded-lg hover:bg-gray-100" aria-label="Menu">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>
    </div>
    <div id="mobile-menu" class="md:hidden hidden border-t bg-white px-4 py-3 space-y-2">
      <a href="/" class="block py-2 nav-link">Home</a>
      <a href="#" class="block py-2 nav-link">Medicare Advantage</a>
      <a href="#" class="block py-2 nav-link">Medicare Supplement</a>
      <a href="#" class="block py-2 nav-link">Medicare Part D</a>
      <a href="#" class="block py-2 nav-link">AI Plan Compare</a>
      <a href="#" class="block py-2 nav-link">AI Plan Recommender</a>
      <% if (typeof user !== 'undefined' && user) { %>
        <a href="/dashboard" class="block py-2 nav-link">Dashboard</a>
        <a href="/auth/logout" class="block py-2 text-red-600">Sign Out</a>
      <% } else { %>
        <a href="/auth/login" class="block py-2 btn-primary text-center">Sign In with Medicare</a>
      <% } %>
    </div>
  </nav>
  <main class="flex-1"><%- body %></main>
  <footer class="bg-navy text-white mt-12">
    <div class="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div>
        <h3 class="text-lg font-serif font-bold text-white mb-4">Healthcare Select</h3>
        <p class="text-gray-300 text-sm">Powered by Blue Button 2.0. Your trusted Medicare health OS.</p>
      </div>
      <div>
        <h4 class="font-semibold text-white mb-3">Quick Links</h4>
        <div class="space-y-2 text-sm text-gray-300">
          <a href="/privacy" class="block hover:text-white">Privacy Policy</a>
          <a href="/terms" class="block hover:text-white">Terms of Service</a>
          <a href="/consent" class="block hover:text-white">Data Consent</a>
        </div>
      </div>
      <div>
        <h4 class="font-semibold text-white mb-3">Support</h4>
        <p class="text-gray-300 text-sm">1-800-MEDICARE (1-800-633-4227)</p>
        <p class="text-gray-300 text-sm mt-1">TTY: 1-877-486-2048</p>
      </div>
    </div>
    <div class="border-t border-gray-600 py-4 text-center text-sm text-gray-400">
      &copy; <%= new Date().getFullYear() %> Healthcare Select. All rights reserved.
    </div>
  </footer>
  <script nonce="<%= typeof cspNonce !== 'undefined' ? cspNonce : '' %>">
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
      document.getElementById('mobile-menu')?.classList.toggle('hidden');
    });
  </script>
</body>
</html>`);
console.log('Created layout.ejs');

// ===== INDEX.EJS =====
fs.writeFileSync(path.join(viewsDir, 'index.ejs'), `<section class="hero-section py-20 px-4">
  <div class="max-w-4xl mx-auto text-center">
    <h1 class="text-4xl md:text-5xl font-serif font-bold text-white mb-6">Your Medicare Health Dashboard</h1>
    <p class="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">Securely access your Medicare claims, medications, and care gaps through Blue Button 2.0</p>
    <a href="/auth/login" class="inline-block bg-red text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-700 transition shadow-lg">Connect Your Medicare Account</a>
  </div>
</section>
<section class="max-w-7xl mx-auto px-4 py-16">
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <div class="card text-center">
      <div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-4"><svg class="w-6 h-6 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>
      <h3 class="text-lg font-serif font-bold mb-2">Claims History</h3>
      <p class="text-gray-600 text-sm">View all your Medicare claims and explanations of benefits in one place.</p>
    </div>
    <div class="card text-center">
      <div class="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-4"><svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg></div>
      <h3 class="text-lg font-serif font-bold mb-2">Medications</h3>
      <p class="text-gray-600 text-sm">Track your prescriptions and Part D coverage details.</p>
    </div>
    <div class="card text-center">
      <div class="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-4"><svg class="w-6 h-6 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg></div>
      <h3 class="text-lg font-serif font-bold mb-2">Care Gaps</h3>
      <p class="text-gray-600 text-sm">Identify preventive care opportunities and recommended screenings.</p>
    </div>
  </div>
</section>`);
console.log('Created index.ejs');

// ===== LANDING.EJS =====
fs.writeFileSync(path.join(viewsDir, 'landing.ejs'), `<section class="hero-section py-20 px-4">
  <div class="max-w-4xl mx-auto text-center">
    <h1 class="text-4xl md:text-5xl font-serif font-bold text-white mb-6">Welcome to Healthcare Select</h1>
    <p class="text-xl text-gray-200 mb-8">Your comprehensive Medicare health management platform</p>
    <a href="/auth/login" class="inline-block bg-red text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-700 transition">Get Started</a>
  </div>
</section>`);
console.log('Created landing.ejs');

// ===== DASHBOARD.EJS =====
fs.writeFileSync(path.join(viewsDir, 'dashboard.ejs'), `<div class="max-w-7xl mx-auto px-4 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-serif font-bold">Welcome Back<%= typeof user !== 'undefined' && user && user.name ? ', ' + user.name : '' %></h1>
    <p class="text-gray-600 mt-1">Your Medicare health overview</p>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    <div class="card stat-card"><p class="text-sm text-gray-500">Total Claims</p><p class="text-2xl font-bold text-navy"><%= typeof claimsCount !== 'undefined' ? claimsCount : '0' %></p></div>
    <div class="card stat-card"><p class="text-sm text-gray-500">Medications</p><p class="text-2xl font-bold text-navy"><%= typeof medsCount !== 'undefined' ? medsCount : '0' %></p></div>
    <div class="card stat-card"><p class="text-sm text-gray-500">Care Gaps</p><p class="text-2xl font-bold text-red"><%= typeof careGapsCount !== 'undefined' ? careGapsCount : '0' %></p></div>
    <div class="card stat-card"><p class="text-sm text-gray-500">Last Updated</p><p class="text-2xl font-bold text-navy"><%= typeof lastSync !== 'undefined' ? lastSync : 'N/A' %></p></div>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <a href="/claims" class="card hover:border-navy transition group">
      <div class="flex items-center space-x-3 mb-3"><svg class="w-8 h-8 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg><h3 class="text-lg font-serif font-bold">View Claims</h3></div>
      <p class="text-gray-600 text-sm">Review your Medicare claims and EOBs</p>
    </a>
    <a href="/medications" class="card hover:border-navy transition group">
      <div class="flex items-center space-x-3 mb-3"><svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg><h3 class="text-lg font-serif font-bold">Medications</h3></div>
      <p class="text-gray-600 text-sm">Track prescriptions and Part D coverage</p>
    </a>
    <a href="/care-gaps" class="card hover:border-navy transition group">
      <div class="flex items-center space-x-3 mb-3"><svg class="w-8 h-8 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg><h3 class="text-lg font-serif font-bold">Care Gaps</h3></div>
      <p class="text-gray-600 text-sm">View preventive care recommendations</p>
    </a>
  </div>
</div>`);
console.log('Created dashboard.ejs');

// ===== CLAIMS.EJS =====
fs.writeFileSync(path.join(viewsDir, 'claims.ejs'), `<div class="max-w-7xl mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-8">
    <div><h1 class="text-3xl font-serif font-bold">Claims History</h1><p class="text-gray-600 mt-1">Your Medicare Explanations of Benefits</p></div>
    <a href="/dashboard" class="btn-secondary text-sm">Back to Dashboard</a>
  </div>
  <% if (typeof claims !== 'undefined' && claims && claims.length > 0) { %>
    <div class="space-y-4">
      <% claims.forEach(function(claim) { %>
        <div class="card">
          <div class="flex justify-between items-start">
            <div>
              <p class="font-semibold text-navy"><%= claim.type || 'Medicare Claim' %></p>
              <p class="text-sm text-gray-500 mt-1">Date: <%= claim.date || 'N/A' %></p>
              <p class="text-sm text-gray-500">Provider: <%= claim.provider || 'N/A' %></p>
            </div>
            <div class="text-right">
              <p class="text-lg font-bold text-navy">$<%= claim.amount || '0.00' %></p>
              <span class="inline-block mt-1 px-3 py-1 text-xs rounded-full <%= claim.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700' %>"><%= claim.status || 'pending' %></span>
            </div>
          </div>
        </div>
      <% }); %>
    </div>
  <% } else { %>
    <div class="card text-center py-12">
      <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
      <p class="text-gray-500">No claims data available yet. Connect your Medicare account to view claims.</p>
    </div>
  <% } %>
</div>`);
console.log('Created claims.ejs');

// ===== MEDICATIONS.EJS =====
fs.writeFileSync(path.join(viewsDir, 'medications.ejs'), `<div class="max-w-7xl mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-8">
    <div><h1 class="text-3xl font-serif font-bold">Medications</h1><p class="text-gray-600 mt-1">Your prescriptions and Part D coverage</p></div>
    <a href="/dashboard" class="btn-secondary text-sm">Back to Dashboard</a>
  </div>
  <% if (typeof medications !== 'undefined' && medications && medications.length > 0) { %>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <% medications.forEach(function(med) { %>
        <div class="card">
          <h3 class="font-semibold text-navy text-lg"><%= med.name || 'Unknown Medication' %></h3>
          <p class="text-sm text-gray-500 mt-1">Dosage: <%= med.dosage || 'N/A' %></p>
          <p class="text-sm text-gray-500">Prescriber: <%= med.prescriber || 'N/A' %></p>
          <p class="text-sm text-gray-500">Last Filled: <%= med.lastFilled || 'N/A' %></p>
        </div>
      <% }); %>
    </div>
  <% } else { %>
    <div class="card text-center py-12">
      <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
      <p class="text-gray-500">No medication data available yet.</p>
    </div>
  <% } %>
</div>`);
console.log('Created medications.ejs');

// ===== CAREGAPS.EJS =====
fs.writeFileSync(path.join(viewsDir, 'careGaps.ejs'), `<div class="max-w-7xl mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-8">
    <div><h1 class="text-3xl font-serif font-bold">Care Gaps</h1><p class="text-gray-600 mt-1">Preventive care recommendations</p></div>
    <a href="/dashboard" class="btn-secondary text-sm">Back to Dashboard</a>
  </div>
  <% if (typeof careGaps !== 'undefined' && careGaps && careGaps.length > 0) { %>
    <div class="space-y-4">
      <% careGaps.forEach(function(gap) { %>
        <div class="card border-l-4 <%= gap.priority === 'high' ? 'border-l-red' : 'border-l-yellow-400' %>">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="font-semibold text-navy"><%= gap.measure || 'Care Gap' %></h3>
              <p class="text-sm text-gray-500 mt-1"><%= gap.description || '' %></p>
            </div>
            <span class="px-3 py-1 text-xs rounded-full font-medium <%= gap.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700' %>"><%= gap.priority || 'medium' %></span>
          </div>
        </div>
      <% }); %>
    </div>
  <% } else { %>
    <div class="card text-center py-12">
      <svg class="w-16 h-16 text-green-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      <p class="text-gray-500">No care gaps identified. You are up to date on preventive care.</p>
    </div>
  <% } %>
</div>`);
console.log('Created careGaps.ejs');

// ===== SURVEY.EJS =====
fs.writeFileSync(path.join(viewsDir, 'survey.ejs'), `<div class="max-w-3xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-serif font-bold mb-2">Health Survey</h1>
  <p class="text-gray-600 mb-8">Help us personalize your care recommendations</p>
  <form method="POST" action="/survey" class="space-y-6">
    <% if (typeof csrfToken !== 'undefined') { %><input type="hidden" name="_csrf" value="<%= csrfToken %>"><% } %>
    <div class="card">
      <label class="block font-semibold text-navy mb-2">How would you rate your overall health?</label>
      <div class="space-y-2">
        <label class="flex items-center space-x-3 cursor-pointer"><input type="radio" name="health_rating" value="excellent" class="w-4 h-4"><span>Excellent</span></label>
        <label class="flex items-center space-x-3 cursor-pointer"><input type="radio" name="health_rating" value="good" class="w-4 h-4"><span>Good</span></label>
        <label class="flex items-center space-x-3 cursor-pointer"><input type="radio" name="health_rating" value="fair" class="w-4 h-4"><span>Fair</span></label>
        <label class="flex items-center space-x-3 cursor-pointer"><input type="radio" name="health_rating" value="poor" class="w-4 h-4"><span>Poor</span></label>
      </div>
    </div>
    <button type="submit" class="btn-primary w-full">Submit Survey</button>
  </form>
</div>`);
console.log('Created survey.ejs');

// ===== CONSENT.EJS =====
fs.writeFileSync(path.join(viewsDir, 'consent.ejs'), `<div class="max-w-3xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-serif font-bold mb-2">Data Consent</h1>
  <p class="text-gray-600 mb-8">Please review and provide your consent for data usage</p>
  <div class="card mb-6">
    <h2 class="text-xl font-serif font-bold text-navy mb-4">How We Use Your Data</h2>
    <div class="space-y-3 text-sm text-gray-600">
      <p>We use Blue Button 2.0 to securely access your Medicare claims data. Your data is encrypted using AES-256 and stored in compliance with HIPAA regulations.</p>
      <p>Your information is never sold or shared with third parties without your explicit consent.</p>
    </div>
  </div>
  <form method="POST" action="/consent">
    <% if (typeof csrfToken !== 'undefined') { %><input type="hidden" name="_csrf" value="<%= csrfToken %>"><% } %>
    <label class="flex items-start space-x-3 mb-6 cursor-pointer">
      <input type="checkbox" name="consent" value="granted" class="mt-1 w-5 h-5" required>
      <span class="text-sm">I consent to Healthcare Select accessing and processing my Medicare data as described above.</span>
    </label>
    <button type="submit" class="btn-primary w-full">Provide Consent</button>
  </form>
</div>`);
console.log('Created consent.ejs');

// ===== ERROR.EJS =====
fs.writeFileSync(path.join(viewsDir, 'error.ejs'), `<div class="max-w-2xl mx-auto px-4 py-16 text-center">
  <div class="text-6xl font-serif font-bold text-red mb-4"><%= typeof statusCode !== 'undefined' ? statusCode : '500' %></div>
  <h1 class="text-2xl font-serif font-bold mb-4"><%= typeof message !== 'undefined' ? message : 'Something went wrong' %></h1>
  <p class="text-gray-600 mb-8">We apologize for the inconvenience. Please try again or contact support.</p>
  <a href="/" class="btn-primary">Return Home</a>
</div>`);
console.log('Created error.ejs');

// ===== PRIVACY.EJS =====
fs.writeFileSync(path.join(viewsDir, 'privacy.ejs'), `<div class="max-w-3xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-serif font-bold mb-6">Privacy Policy</h1>
  <div class="card prose prose-sm max-w-none">
    <h2 class="text-xl font-serif font-bold text-navy mt-6 mb-3">Information We Collect</h2>
    <p class="text-gray-600 mb-4">We collect Medicare claims data through CMS Blue Button 2.0 API with your explicit authorization. This includes claims history, medication records, and coverage information.</p>
    <h2 class="text-xl font-serif font-bold text-navy mt-6 mb-3">Data Security</h2>
    <p class="text-gray-600 mb-4">All data is encrypted using AES-256 encryption at rest and TLS 1.2+ in transit. We maintain full HIPAA compliance.</p>
    <h2 class="text-xl font-serif font-bold text-navy mt-6 mb-3">Your Rights</h2>
    <p class="text-gray-600 mb-4">You may request deletion of your data at any time. You may also revoke Blue Button 2.0 access through Medicare.gov.</p>
  </div>
</div>`);
console.log('Created privacy.ejs');

// ===== TERMS.EJS =====
fs.writeFileSync(path.join(viewsDir, 'terms.ejs'), `<div class="max-w-3xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-serif font-bold mb-6">Terms of Service</h1>
  <div class="card prose prose-sm max-w-none">
    <h2 class="text-xl font-serif font-bold text-navy mt-6 mb-3">Acceptance of Terms</h2>
    <p class="text-gray-600 mb-4">By using Healthcare Select, you agree to these terms. This platform provides Medicare beneficiaries with access to their health data through the CMS Blue Button 2.0 API.</p>
    <h2 class="text-xl font-serif font-bold text-navy mt-6 mb-3">Use of Service</h2>
    <p class="text-gray-600 mb-4">You agree to use this service only for lawful purposes related to managing your Medicare health information.</p>
    <h2 class="text-xl font-serif font-bold text-navy mt-6 mb-3">Disclaimer</h2>
    <p class="text-gray-600 mb-4">This platform is not a substitute for professional medical advice. Always consult with your healthcare provider.</p>
  </div>
</div>`);
console.log('Created terms.ejs');

console.log('\nAll files created successfully!');
