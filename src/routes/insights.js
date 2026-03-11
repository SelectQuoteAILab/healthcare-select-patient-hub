const router = require('express').Router();
const { getDb, decrypt } = require('../db/database');
const logger = require('../utils/logger');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

router.get('/health-story', requireAuth, (req, res) => {
  const db = getDb();
  const meds = db.prepare('SELECT * FROM medications WHERE user_id = ? ORDER BY fill_date DESC').all(req.session.userId);
  const gaps = db.prepare('SELECT * FROM care_gaps WHERE user_id = ?').all(req.session.userId);
  const surveys = db.prepare('SELECT * FROM survey_responses WHERE user_id = ?').all(req.session.userId);
  const claims = db.prepare('SELECT data_enc FROM claims_cache WHERE user_id = ? AND resource_type = ?').all(req.session.userId, 'ExplanationOfBenefit');
  const conditions = new Set();
  const providers = new Set();
  let totalSpend = 0;
  claims.forEach(c => {
    try {
      const eob = JSON.parse(decrypt(c.data_enc));
      if (eob.diagnosis) eob.diagnosis.forEach(d => { if (d.diagnosisCodeableConcept?.coding?.[0]?.display) conditions.add(d.diagnosisCodeableConcept.coding[0].display); });
      if (eob.provider?.display) providers.add(eob.provider.display);
      totalSpend += eob.totalCost?.value || 0;
    } catch {}
  });
  const drugNames = [...new Set(meds.map(m => m.drug_name).filter(Boolean))];
  const surveyMap = {};
  surveys.forEach(s => { surveyMap[s.question_key] = s.answer; });
  res.json({
    summary: {
      conditionCount: conditions.size,
      conditions: [...conditions].slice(0, 20),
      medicationCount: drugNames.length,
      medications: drugNames.slice(0, 20),
      providerCount: providers.size,
      claimCount: claims.length,
      totalSpend: Math.round(totalSpend * 100) / 100,
      openCareGaps: gaps.filter(g => g.status === 'open').length,
      resolvedCareGaps: gaps.filter(g => g.status === 'resolved').length
    },
    surveyProfile: surveyMap,
    services: {
      virtualCare: { available: true, name: 'Healthcare Services Virtual Care', description: '50-state licensed virtual care practice', action: 'Schedule a virtual visit' },
      pharmacy: { available: true, name: 'SelectRx Pharmacy', description: '50-state licensed pharmacy with medication sync and MTM', action: 'Connect with SelectRx' },
      ccm: { available: true, name: 'Chronic Care Management', description: 'CCM with RPM and RTM monitoring', action: 'Enroll in CCM program' },
      healthSurvey: { available: true, name: 'Healthcare Select', description: 'Personalized health and lifestyle data', action: 'Complete health survey' }
    }
  });
});

router.get('/recommendations', requireAuth, (req, res) => {
  const db = getDb();
  const meds = db.prepare('SELECT * FROM medications WHERE user_id = ?').all(req.session.userId);
  const gaps = db.prepare('SELECT * FROM care_gaps WHERE user_id = ? AND status = ?').all(req.session.userId, 'open');
  const surveys = db.prepare('SELECT * FROM survey_responses WHERE user_id = ?').all(req.session.userId);
  const recs = [];
  if (meds.length >= 5) recs.push({ type: 'pharmacy', priority: 'high', title: 'Medication Review Recommended', description: 'You are taking 5+ medications. A pharmacist review through SelectRx can help simplify your regimen and check for interactions.', action: 'Schedule SelectRx Consultation' });
  if (gaps.length > 0) recs.push({ type: 'care_gap', priority: 'high', title: `${gaps.length} Open Care Gap(s)`, description: 'You have outstanding preventive care or monitoring needs. Addressing these can prevent complications.', action: 'View Care Gaps' });
  const surveyMap = {};
  surveys.forEach(s => { surveyMap[s.question_key] = s.answer; });
  if (surveyMap.social_isolation === 'Often' || surveyMap.social_isolation === 'Always') recs.push({ type: 'wellness', priority: 'medium', title: 'Social Connection Support', description: 'Feeling isolated can impact your health. Our virtual care team can connect you with support resources.', action: 'Talk to Care Team' });
  if (surveyMap.med_barriers === 'Cost concerns') recs.push({ type: 'pharmacy', priority: 'high', title: 'Medication Cost Assistance', description: 'SelectRx can help identify lower-cost alternatives and assistance programs for your medications.', action: 'Contact SelectRx' });
  res.json(recs);
});

module.exports = router;
