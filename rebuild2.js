const fs = require('fs');
const path = require('path');
const viewsDir = 'src/views';
const partialsDir = path.join(viewsDir, 'partials');
fs.mkdirSync(partialsDir, { recursive: true });

// HEAD partial
fs.writeFileSync(path.join(partialsDir, 'head.ejs'), `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= typeof title !== 'undefined' ? title : 'Healthcare Select' %></title>
  <script src="https://cdn.tailwindcss.com" nonce="<%= typeof cspNonce !== 'undefined' ? cspNonce : '' %>"><\/script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
  <script nonce="<%= typeof cspNonce !== 'undefined' ? cspNonce : '' %>">
    tailwind.config = { theme: { extend: { colors: { navy: '#1B3D6E', red: '#C8102E', lightgray: '#F5F7FA' }, fontFamily: { serif: ['Lora','serif'], sans: ['Inter','sans-serif'] } } } }
  <\/script>
</head>
<body class="font-sans bg-gray-50 text-gray-800 min-h-screen flex flex-col">`);
console.log('Created head.ejs');

// NAV partial
fs.writeFileSync(path.join(partialsDir, 'nav.ejs'), `<nav class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16 items-center">
      <div class="flex items-center space-x-2">
        <svg class="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
        <a href="/" class="text-xl font-serif font-bold" style="color:#1B3D6E">Healthcare Select</a>
      </div>
      <div class="hidden md:flex items-center space-x-1">
        <a href="/" class="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100" style="color:#1B3D6E">Home</a>
        <div class="relative group">
          <button class="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 inline-flex items-center" style="color:#1B3D6E">Medicare Resources <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></button>
          <div class="absolute left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg hidden group-hover:block py-2 z-50">
            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Medicare Advantage</a>
            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Medicare Supplement</a>
            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Medicare Part D</a>
            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Resources</a>
          </div>
        </div>
        <div class="relative group">
          <button class="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 inline-flex items-center" style="color:#1B3D6E">Plan Tools <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></button>
          <div class="absolute left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg hidden group-hover:block py-2 z-50">
            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">AI Plan Compare</a>
            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">AI Plan Recommender</a>
            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Verify Current Coverage</a>
            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Find Best Plan</a>
          </div>
        </div>
        <% if (typeof user !== 'undefined' && user) { %>
          <a href="/dashboard" class="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100" style="color:#1B3D6E">Dashboard</a>
          <a href="/auth/logout" class="ml-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style="background:#C8102E">Sign Out</a>
        <% } else { %>
          <a href="/auth/login" class="ml-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style="background:#C8102E">Sign In with Medicare</a>
        <% } %>
      </div>
      <button id="mobile-menu-btn" class="md:hidden p-2 rounded-lg hover:bg-gray-100" aria-label="Menu">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
  </div>
</nav>`);
console.log('Created nav.ejs');

// FOOTER partial
fs.writeFileSync(path.join(partialsDir, 'footer.ejs'), `<footer style="background:#1B3D6E" class="text-white mt-12">
  <div class="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
    <div>
      <h3 class="text-lg font-serif font-bold text-white mb-4">Healthcare Select</h3>
      <p class="text-gray-300 text-sm">Powered by Blue Button 2.0. Your trusted Medicare health OS.</p>
    </div>
    <div>
      <h4 class="font-semibold text-white mb-3">Quick Links</h4>
      <a href="/privacy" class="block text-sm text-gray-300 hover:text-white mb-2">Privacy Policy</a>
      <a href="/terms" class="block text-sm text-gray-300 hover:text-white mb-2">Terms of Service</a>
    </div>
    <div>
      <h4 class="font-semibold text-white mb-3">Support</h4>
      <p class="text-gray-300 text-sm">1-800-MEDICARE (1-800-633-4227)</p>
    </div>
  </div>
  <div class="border-t border-gray-600 py-4 text-center text-sm text-gray-400">&copy; <%= new Date().getFullYear() %> Healthcare Select. All rights reserved.</div>
</footer>
<script nonce="<%= typeof cspNonce !== 'undefined' ? cspNonce : '' %>">
  document.getElementById('mobile-menu-btn')?.addEventListener('click',()=>{document.getElementById('mobile-menu')?.classList.toggle('hidden')});
<\/script>
</body>
</html>`);
console.log('Created footer.ejs');

// Helper to wrap content with partials
function wrap(content) {
  return `<%- include('partials/head') %>\n<%- include('partials/nav') %>\n<main class="flex-1">\n${content}\n</main>\n<%- include('partials/footer') %>`;
}

// LANDING
fs.writeFileSync(path.join(viewsDir, 'landing.ejs'), wrap(`<section style="background:linear-gradient(135deg,#1B3D6E 0%,#2a5298 100%)" class="py-20 px-4">
  <div class="max-w-4xl mx-auto text-center">
    <h1 class="text-4xl md:text-5xl font-serif font-bold text-white mb-6">Your Medicare Health Dashboard</h1>
    <p class="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">Securely access your Medicare claims, medications, and care gaps through Blue Button 2.0</p>
    <a href="/auth/login" class="inline-block text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:opacity-90 transition" style="background:#C8102E">Connect Your Medicare Account</a>
  </div>
</section>
<section class="max-w-7xl mx-auto px-4 py-16">
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition">
      <div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-4"><svg class="w-6 h-6" style="color:#1B3D6E" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>
      <h3 class="text-lg font-serif font-bold mb-2" style="color:#1B3D6E">Claims History</h3>
      <p class="text-gray-600 text-sm">View all your Medicare claims and explanations of benefits in one place.</p>
    </div>
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition">
      <div class="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-4"><svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg></div>
      <h3 class="text-lg font-serif font-bold mb-2" style="color:#1B3D6E">Medications</h3>
      <p class="text-gray-600 text-sm">Track your prescriptions and Part D coverage details.</p>
    </div>
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition">
      <div class="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-4"><svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg></div>
      <h3 class="text-lg font-serif font-bold mb-2" style="color:#1B3D6E">Care Gaps</h3>
      <p class="text-gray-600 text-sm">Identify preventive care opportunities and recommended screenings.</p>
    </div>
  </div>
</section>`));
console.log('Created landing.ejs');

// DASHBOARD
fs.writeFileSync(path.join(viewsDir, 'dashboard.ejs'), wrap(`<div class="max-w-7xl mx-auto px-4 py-8">
  <div class="mb-8"><h1 class="text-3xl font-serif font-bold" style="color:#1B3D6E">Welcome Back<%= typeof user !== 'undefined' && user && user.name ? ', ' + user.name : '' %></h1><p class="text-gray-600 mt-1">Your Medicare health overview</p></div>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    <div class="bg-white rounded-xl shadow-sm p-6 border-l-4" style="border-left-color:#C8102E"><p class="text-sm text-gray-500">Total Claims</p><p class="text-2xl font-bold" style="color:#1B3D6E"><%= typeof claimsCount !== 'undefined' ? claimsCount : '0' %></p></div>
    <div class="bg-white rounded-xl shadow-sm p-6 border-l-4" style="border-left-color:#C8102E"><p class="text-sm text-gray-500">Medications</p><p class="text-2xl font-bold" style="color:#1B3D6E"><%= typeof medsCount !== 'undefined' ? medsCount : '0' %></p></div>
    <div class="bg-white rounded-xl shadow-sm p-6 border-l-4" style="border-left-color:#C8102E"><p class="text-sm text-gray-500">Care Gaps</p><p class="text-2xl font-bold" style="color:#C8102E"><%= typeof careGapsCount !== 'undefined' ? careGapsCount : '0' %></p></div>
    <div class="bg-white rounded-xl shadow-sm p-6 border-l-4" style="border-left-color:#C8102E"><p class="text-sm text-gray-500">Last Updated</p><p class="text-2xl font-bold" style="color:#1B3D6E"><%= typeof lastSync !== 'undefined' ? lastSync : 'N/A' %></p></div>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <a href="/claims" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"><div class="flex items-center space-x-3 mb-3"><svg class="w-8 h-8" style="color:#1B3D6E" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg><h3 class="text-lg font-serif font-bold" style="color:#1B3D6E">View Claims</h3></div><p class="text-gray-600 text-sm">Review your Medicare claims and EOBs</p></a>
    <a href="/medications" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"><div class="flex items-center space-x-3 mb-3"><svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg><h3 class="text-lg font-serif font-bold" style="color:#1B3D6E">Medications</h3></div><p class="text-gray-600 text-sm">Track prescriptions and Part D coverage</p></a>
    <a href="/care-gaps" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"><div class="flex items-center space-x-3 mb-3"><svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg><h3 class="text-lg font-serif font-bold" style="color:#1B3D6E">Care Gaps</h3></div><p class="text-gray-600 text-sm">View preventive care recommendations</p></a>
  </div>
</div>`));
console.log('Created dashboard.ejs');

// CLAIMS
fs.writeFileSync(path.join(viewsDir, 'claims.ejs'), wrap(`<div class="max-w-7xl mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-8"><div><h1 class="text-3xl font-serif font-bold" style="color:#1B3D6E">Claims History</h1><p class="text-gray-600 mt-1">Your Medicare Explanations of Benefits</p></div><a href="/dashboard" class="px-4 py-2 rounded-lg text-sm font-semibold text-white" style="background:#1B3D6E">Back to Dashboard</a></div>
  <% if (typeof claims !== 'undefined' && claims && claims.length > 0) { %><div class="space-y-4"><% claims.forEach(function(claim) { %><div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6"><div class="flex justify-between items-start"><div><p class="font-semibold" style="color:#1B3D6E"><%= claim.type || 'Medicare Claim' %></p><p class="text-sm text-gray-500 mt-1">Date: <%= claim.date || 'N/A' %></p><p class="text-sm text-gray-500">Provider: <%= claim.provider || 'N/A' %></p></div><div class="text-right"><p class="text-lg font-bold" style="color:#1B3D6E">$<%= claim.amount || '0.00' %></p></div></div></div><% }); %></div><% } else { %><div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center"><svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg><p class="text-gray-500">No claims data available yet.</p></div><% } %>
</div>`));
console.log('Created claims.ejs');

// MEDICATIONS
fs.writeFileSync(path.join(viewsDir, 'medications.ejs'), wrap(`<div class="max-w-7xl mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-8"><div><h1 class="text-3xl font-serif font-bold" style="color:#1B3D6E">Medications</h1><p class="text-gray-600 mt-1">Your prescriptions and Part D coverage</p></div><a href="/dashboard" class="px-4 py-2 rounded-lg text-sm font-semibold text-white" style="background:#1B3D6E">Back to Dashboard</a></div>
  <% if (typeof medications !== 'undefined' && medications && medications.length > 0) { %><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><% medications.forEach(function(med) { %><div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6"><h3 class="font-semibold text-lg" style="color:#1B3D6E"><%= med.name || 'Unknown' %></h3><p class="text-sm text-gray-500 mt-1">Dosage: <%= med.dosage || 'N/A' %></p></div><% }); %></div><% } else { %><div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center"><p class="text-gray-500">No medication data available yet.</p></div><% } %>
</div>`));
console.log('Created medications.ejs');

// CAREGAPS
fs.writeFileSync(path.join(viewsDir, 'careGaps.ejs'), wrap(`<div class="max-w-7xl mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-8"><div><h1 class="text-3xl font-serif font-bold" style="color:#1B3D6E">Care Gaps</h1><p class="text-gray-600 mt-1">Preventive care recommendations</p></div><a href="/dashboard" class="px-4 py-2 rounded-lg text-sm font-semibold text-white" style="background:#1B3D6E">Back to Dashboard</a></div>
  <% if (typeof careGaps !== 'undefined' && careGaps && careGaps.length > 0) { %><div class="space-y-4"><% careGaps.forEach(function(gap) { %><div class="bg-white rounded-xl shadow-sm border-l-4 border border-gray-200 p-6" style="border-left-color:#C8102E"><h3 class="font-semibold" style="color:#1B3D6E"><%= gap.measure || 'Care Gap' %></h3><p class="text-sm text-gray-500 mt-1"><%= gap.description || '' %></p></div><% }); %></div><% } else { %><div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center"><svg class="w-16 h-16 text-green-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><p class="text-gray-500">No care gaps identified.</p></div><% } %>
</div>`));
console.log('Created careGaps.ejs');

// SURVEY
fs.writeFileSync(path.join(viewsDir, 'survey.ejs'), wrap(`<div class="max-w-3xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-serif font-bold mb-2" style="color:#1B3D6E">Health Survey</h1>
  <p class="text-gray-600 mb-8">Help us personalize your care recommendations</p>
  <form method="POST" action="/survey" class="space-y-6"><% if (typeof csrfToken !== 'undefined') { %><input type="hidden" name="_csrf" value="<%= csrfToken %>"><% } %><div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6"><label class="block font-semibold mb-2" style="color:#1B3D6E">How would you rate your overall health?</label><div class="space-y-2"><label class="flex items-center space-x-3"><input type="radio" name="health_rating" value="excellent" class="w-4 h-4"><span>Excellent</span></label><label class="flex items-center space-x-3"><input type="radio" name="health_rating" value="good" class="w-4 h-4"><span>Good</span></label><label class="flex items-center space-x-3"><input type="radio" name="health_rating" value="fair" class="w-4 h-4"><span>Fair</span></label><label class="flex items-center space-x-3"><input type="radio" name="health_rating" value="poor" class="w-4 h-4"><span>Poor</span></label></div></div><button type="submit" class="w-full px-6 py-3 rounded-lg text-white font-semibold" style="background:#C8102E">Submit Survey</button></form>
</div>`));
console.log('Created survey.ejs');

// CONSENT
fs.writeFileSync(path.join(viewsDir, 'consent.ejs'), wrap(`<div class="max-w-3xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-serif font-bold mb-2" style="color:#1B3D6E">Data Consent</h1>
  <p class="text-gray-600 mb-8">Please review and provide your consent for data usage</p>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"><h2 class="text-xl font-serif font-bold mb-4" style="color:#1B3D6E">How We Use Your Data</h2><p class="text-sm text-gray-600 mb-3">We use Blue Button 2.0 to securely access your Medicare claims data. Your data is encrypted using AES-256 and stored in compliance with HIPAA regulations.</p><p class="text-sm text-gray-600">Your information is never sold or shared with third parties without your explicit consent.</p></div>
  <form method="POST" action="/consent"><% if (typeof csrfToken !== 'undefined') { %><input type="hidden" name="_csrf" value="<%= csrfToken %>"><% } %><label class="flex items-start space-x-3 mb-6"><input type="checkbox" name="consent" value="granted" class="mt-1 w-5 h-5" required><span class="text-sm">I consent to Healthcare Select accessing and processing my Medicare data as described above.</span></label><button type="submit" class="w-full px-6 py-3 rounded-lg text-white font-semibold" style="background:#C8102E">Provide Consent</button></form>
</div>`));
console.log('Created consent.ejs');

// ERROR
fs.writeFileSync(path.join(viewsDir, 'error.ejs'), wrap(`<div class="max-w-2xl mx-auto px-4 py-16 text-center">
  <div class="text-6xl font-serif font-bold mb-4" style="color:#C8102E"><%= typeof statusCode !== 'undefined' ? statusCode : '500' %></div>
  <h1 class="text-2xl font-serif font-bold mb-4" style="color:#1B3D6E"><%= typeof message !== 'undefined' ? message : 'Something went wrong' %></h1>
  <p class="text-gray-600 mb-8">We apologize for the inconvenience. Please try again or contact support.</p>
  <a href="/" class="inline-block px-6 py-3 rounded-lg text-white font-semibold" style="background:#C8102E">Return Home</a>
</div>`));
console.log('Created error.ejs');

// PRIVACY
fs.writeFileSync(path.join(viewsDir, 'privacy.ejs'), wrap(`<div class="max-w-3xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-serif font-bold mb-6" style="color:#1B3D6E">Privacy Policy</h1>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h2 class="text-xl font-serif font-bold mt-6 mb-3" style="color:#1B3D6E">Information We Collect</h2><p class="text-gray-600 mb-4 text-sm">We collect Medicare claims data through CMS Blue Button 2.0 API with your explicit authorization.</p>
    <h2 class="text-xl font-serif font-bold mt-6 mb-3" style="color:#1B3D6E">Data Security</h2><p class="text-gray-600 mb-4 text-sm">All data is encrypted using AES-256 at rest and TLS 1.2+ in transit. We maintain full HIPAA compliance.</p>
    <h2 class="text-xl font-serif font-bold mt-6 mb-3" style="color:#1B3D6E">Your Rights</h2><p class="text-gray-600 mb-4 text-sm">You may request deletion of your data at any time.</p>
  </div>
</div>`));
console.log('Created privacy.ejs');

// TERMS
fs.writeFileSync(path.join(viewsDir, 'terms.ejs'), wrap(`<div class="max-w-3xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-serif font-bold mb-6" style="color:#1B3D6E">Terms of Service</h1>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h2 class="text-xl font-serif font-bold mt-6 mb-3" style="color:#1B3D6E">Acceptance of Terms</h2><p class="text-gray-600 mb-4 text-sm">By using Healthcare Select, you agree to these terms.</p>
    <h2 class="text-xl font-serif font-bold mt-6 mb-3" style="color:#1B3D6E">Use of Service</h2><p class="text-gray-600 mb-4 text-sm">You agree to use this service only for lawful purposes related to managing your Medicare health information.</p>
    <h2 class="text-xl font-serif font-bold mt-6 mb-3" style="color:#1B3D6E">Disclaimer</h2><p class="text-gray-600 mb-4 text-sm">This platform is not a substitute for professional medical advice.</p>
  </div>
</div>`));
console.log('Created terms.ejs');

console.log('\nAll files rebuilt with partials!');
