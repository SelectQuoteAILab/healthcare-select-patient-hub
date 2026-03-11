const router = require('express').Router();
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
