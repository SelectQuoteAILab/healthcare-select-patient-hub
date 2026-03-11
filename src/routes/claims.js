const router = require('express').Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/');
  next();
}

router.get('/', requireAuth, (req, res) => {
  const data = req.session.bbData || {};
  res.render('care-team', {
    title: 'Care Team', page: 'care-team',
    providers: data.providers || [],
    claims: data.claims || []
  });
});

module.exports = router;
