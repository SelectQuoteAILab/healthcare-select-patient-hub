const router = require('express').Router();

router.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('landing', { title: 'Healthcare Select Patient Hub' });
});

router.get('/privacy', (req, res) => {
  res.render('privacy', { title: 'Privacy Policy' });
});

router.get('/terms', (req, res) => {
  res.render('terms', { title: 'Terms of Service' });
});

module.exports = router;
