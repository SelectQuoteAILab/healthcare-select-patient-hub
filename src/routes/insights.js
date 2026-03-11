const router = require('express').Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/');
  next();
}

router.get('/', requireAuth, (req, res) => {
  const data = req.session.bbData || {};
  res.render('insights', {
    title: 'Plan Insights', page: 'insights',
    spending: data.spending || null,
    claims: data.claims || []
  });
});

module.exports = router;
