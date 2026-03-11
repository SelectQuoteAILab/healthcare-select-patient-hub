const router = require('express').Router();
const { getDb, decrypt } = require('../db/database');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const cached = db.prepare('SELECT * FROM claims_cache WHERE user_id = ? ORDER BY fetched_at DESC').all(req.session.userId);
  const claims = cached.map(c => {
    try { return { ...c, data: JSON.parse(decrypt(c.data_enc)), data_enc: undefined }; }
    catch { return { ...c, data: null, data_enc: undefined }; }
  });
  res.json(claims);
});

router.get('/summary', requireAuth, (req, res) => {
  const db = getDb();
  const cached = db.prepare('SELECT data_enc FROM claims_cache WHERE user_id = ? AND resource_type = ?').all(req.session.userId, 'ExplanationOfBenefit');
  let totalCost = 0, totalBenefit = 0, claimCount = 0;
  const byType = {};
  cached.forEach(c => {
    try {
      const eob = JSON.parse(decrypt(c.data_enc));
      claimCount++;
      const cost = eob.totalCost?.value || eob.total?.find(t => t.category?.coding?.[0]?.code === 'submitted')?.amount?.value || 0;
      const benefit = eob.totalBenefit?.value || eob.total?.find(t => t.category?.coding?.[0]?.code === 'benefit')?.amount?.value || 0;
      totalCost += cost;
      totalBenefit += benefit;
      const type = eob.type?.coding?.[0]?.code || 'unknown';
      byType[type] = (byType[type] || 0) + 1;
    } catch {}
  });
  res.json({ claimCount, totalCost: Math.round(totalCost * 100) / 100, totalBenefit: Math.round(totalBenefit * 100) / 100, outOfPocket: Math.round((totalCost - totalBenefit) * 100) / 100, byType });
});

module.exports = router;
