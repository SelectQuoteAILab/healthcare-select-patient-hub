const router = require('express').Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/');
  next();
}

router.get('/', requireAuth, (req, res) => {
  const data = req.session.bbData || {};
  res.render('dashboard', {
    title: 'Dashboard', page: 'dashboard',
    patient: data.patient || null,
    coverage: data.coverage || null,
    medications: data.medications || [],
    careGaps: data.careGaps || [],
    spending: data.spending || null
  });
});

router.get('/profile', requireAuth, (req, res) => {
  const data = req.session.bbData || {};
  res.render('profile', {
    title: 'My Profile', page: 'profile',
    patient: data.patient || null,
    coverage: data.coverage || null
  });
});

module.exports = router;
