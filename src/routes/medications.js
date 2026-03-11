const router = require('express').Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/');
  next();
}

router.get('/', requireAuth, (req, res) => {
  const data = req.session.bbData || {};
  res.render('medications', {
    title: 'Medications', page: 'medications',
    medications: data.medications || []
  });
});

module.exports = router;
