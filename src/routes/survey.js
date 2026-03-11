const router = require('express').Router();

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
