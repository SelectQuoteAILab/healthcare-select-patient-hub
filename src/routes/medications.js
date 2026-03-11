const router = require('express').Router();
const { getDb } = require('../db/database');
const logger = require('../utils/logger');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const meds = db.prepare('SELECT * FROM medications WHERE user_id = ? ORDER BY fill_date DESC').all(req.session.userId);
  res.json(meds);
});

router.get('/adherence', requireAuth, (req, res) => {
  const db = getDb();
  const meds = db.prepare('SELECT drug_name, fill_date, days_supply FROM medications WHERE user_id = ? ORDER BY drug_name, fill_date').all(req.session.userId);
  const adherence = {};
  meds.forEach(m => {
    if (!adherence[m.drug_name]) adherence[m.drug_name] = { fills: [], totalDaysSupply: 0 };
    adherence[m.drug_name].fills.push({ date: m.fill_date, days: m.days_supply });
    adherence[m.drug_name].totalDaysSupply += m.days_supply || 0;
  });
  Object.keys(adherence).forEach(drug => {
    const fills = adherence[drug].fills;
    if (fills.length < 2) { adherence[drug].pdc = null; return; }
    const first = new Date(fills[0].date);
    const last = new Date(fills[fills.length - 1].date);
    const daySpan = Math.max(1, (last - first) / (1000 * 60 * 60 * 24));
    adherence[drug].pdc = Math.min(1, adherence[drug].totalDaysSupply / daySpan);
  });
  res.json(adherence);
});

router.get('/cost-summary', requireAuth, (req, res) => {
  const db = getDb();
  const costs = db.prepare('SELECT drug_name, SUM(cost) as total_cost, COUNT(*) as fill_count FROM medications WHERE user_id = ? GROUP BY drug_name ORDER BY total_cost DESC').all(req.session.userId);
  res.json(costs);
});

module.exports = router;
