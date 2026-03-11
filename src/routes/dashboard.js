const router = require('express').Router();
const { getDb } = require('../db/database');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) return res.redirect('/');
  next();
}

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  const medCount = db.prepare('SELECT COUNT(*) as cnt FROM medications WHERE user_id = ?').get(req.session.userId).cnt;
  const gapCount = db.prepare('SELECT COUNT(*) as cnt FROM care_gaps WHERE user_id = ? AND status = ?').get(req.session.userId, 'open').cnt;
  const planCount = db.prepare('SELECT COUNT(*) as cnt FROM care_plans WHERE user_id = ? AND status = ?').get(req.session.userId, 'active').cnt;
  const recentClaims = db.prepare('SELECT COUNT(*) as cnt FROM claims_cache WHERE user_id = ?').get(req.session.userId).cnt;
  res.render('dashboard', {
    title: 'My Health Dashboard',
    user,
    stats: { medications: medCount, careGaps: gapCount, carePlans: planCount, claims: recentClaims }
  });
});

router.get('/medications', requireAuth, (req, res) => {
  const db = getDb();
  const meds = db.prepare('SELECT * FROM medications WHERE user_id = ? ORDER BY fill_date DESC').all(req.session.userId);
  res.render('medications', { title: 'My Medications', medications: meds });
});

router.get('/claims', requireAuth, (req, res) => {
  res.render('claims', { title: 'My Claims History' });
});

router.get('/care-gaps', requireAuth, (req, res) => {
  const db = getDb();
  const gaps = db.prepare('SELECT * FROM care_gaps WHERE user_id = ? ORDER BY priority DESC, created_at DESC').all(req.session.userId);
  res.render('care-gaps', { title: 'Care Gaps & To-Dos', gaps });
});

router.get('/care-plan', requireAuth, (req, res) => {
  const db = getDb();
  const plans = db.prepare('SELECT * FROM care_plans WHERE user_id = ? ORDER BY updated_at DESC').all(req.session.userId);
  res.render('care-plan', { title: 'My Care Plan', plans });
});

router.get('/survey', requireAuth, (req, res) => {
  res.render('survey', { title: 'Health & Lifestyle Survey' });
});

router.get('/insights', requireAuth, (req, res) => {
  res.render('insights', { title: 'AI Health Insights' });
});

module.exports = router;
