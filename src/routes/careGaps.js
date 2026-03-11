const router = require('express').Router();
const { getDb } = require('../db/database');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const gaps = db.prepare('SELECT * FROM care_gaps WHERE user_id = ? ORDER BY priority DESC, created_at DESC').all(req.session.userId);
  res.json(gaps);
});

router.post('/resolve/:id', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE care_gaps SET status = ?, resolved_date = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?').run('resolved', req.params.id, req.session.userId);
  res.json({ success: true });
});

router.post('/generate', requireAuth, (req, res) => {
  const db = getDb();
  const meds = db.prepare('SELECT * FROM medications WHERE user_id = ?').all(req.session.userId);
  const gaps = [];
  const diabetesMeds = meds.filter(m => /metformin|insulin|glipizide|januvia|ozempic/i.test(m.drug_name));
  if (diabetesMeds.length > 0) {
    const hasA1c = db.prepare('SELECT * FROM care_gaps WHERE user_id = ? AND gap_type = ? AND status = ?').get(req.session.userId, 'a1c_test', 'open');
    if (!hasA1c) gaps.push({ gap_type: 'a1c_test', description: 'A1C test recommended every 3 months for diabetes management', priority: 'high', source: 'medication_analysis' });
    const hasEye = db.prepare('SELECT * FROM care_gaps WHERE user_id = ? AND gap_type = ? AND status = ?').get(req.session.userId, 'retinal_exam', 'open');
    if (!hasEye) gaps.push({ gap_type: 'retinal_exam', description: 'Annual retinal exam recommended for diabetes patients', priority: 'medium', source: 'medication_analysis' });
  }
  const heartMeds = meds.filter(m => /lisinopril|metoprolol|amlodipine|losartan|atorvastatin/i.test(m.drug_name));
  if (heartMeds.length > 0) {
    const hasBP = db.prepare('SELECT * FROM care_gaps WHERE user_id = ? AND gap_type = ? AND status = ?').get(req.session.userId, 'bp_monitoring', 'open');
    if (!hasBP) gaps.push({ gap_type: 'bp_monitoring', description: 'Regular blood pressure monitoring recommended - consider RPM enrollment', priority: 'high', source: 'medication_analysis' });
  }
  gaps.forEach(g => {
    db.prepare('INSERT INTO care_gaps (user_id, gap_type, description, priority, source) VALUES (?, ?, ?, ?, ?)').run(req.session.userId, g.gap_type, g.description, g.priority, g.source);
  });
  res.json({ generated: gaps.length, gaps });
});

module.exports = router;
