const router = require('express').Router();
const { getDb } = require('../db/database');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

router.get('/questions', requireAuth, (req, res) => {
  res.json({
    health_goals: [
      { key: 'primary_goal', question: 'What is your primary health goal?', type: 'select', options: ['Manage chronic condition', 'Lose weight', 'Improve mobility', 'Better mental health', 'Reduce medications', 'Stay independent'] },
      { key: 'exercise_freq', question: 'How often do you exercise?', type: 'select', options: ['Daily', '3-5 times/week', '1-2 times/week', 'Rarely', 'Unable to exercise'] },
      { key: 'diet_quality', question: 'How would you rate your diet?', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] }
    ],
    barriers: [
      { key: 'med_barriers', question: 'Do you have trouble taking medications as prescribed?', type: 'select', options: ['No issues', 'Cost concerns', 'Side effects', 'Forget to take them', 'Too many medications', 'Dont understand why I need them'] },
      { key: 'transportation', question: 'Do you have reliable transportation to medical appointments?', type: 'select', options: ['Yes always', 'Usually', 'Sometimes', 'Rarely', 'No'] },
      { key: 'food_security', question: 'In the past 12 months, have you worried about running out of food?', type: 'select', options: ['Never', 'Sometimes', 'Often', 'Always'] },
      { key: 'social_isolation', question: 'How often do you feel lonely or isolated?', type: 'select', options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] }
    ],
    digital: [
      { key: 'tech_comfort', question: 'How comfortable are you using technology?', type: 'select', options: ['Very comfortable', 'Somewhat comfortable', 'Not very comfortable', 'Not at all comfortable'] },
      { key: 'contact_pref', question: 'How would you prefer to receive health reminders?', type: 'select', options: ['Text message', 'Phone call', 'Email', 'App notification', 'Mail'] }
    ]
  });
});

router.post('/submit', requireAuth, (req, res) => {
  const db = getDb();
  const { survey_type, responses } = req.body;
  if (!survey_type || !responses) return res.status(400).json({ error: 'Missing survey_type or responses' });
  const stmt = db.prepare('INSERT INTO survey_responses (user_id, survey_type, question_key, answer) VALUES (?, ?, ?, ?)');
  const insert = db.transaction((items) => { items.forEach(r => stmt.run(req.session.userId, survey_type, r.key, r.answer)); });
  insert(responses);
  res.json({ success: true, saved: responses.length });
});

router.get('/responses', requireAuth, (req, res) => {
  const db = getDb();
  const responses = db.prepare('SELECT * FROM survey_responses WHERE user_id = ? ORDER BY answered_at DESC').all(req.session.userId);
  res.json(responses);
});

module.exports = router;
