const router = require('express').Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/');
  next();
}

router.get('/', requireAuth, (req, res) => {
  const data = req.session.bbData || {};
  res.render('care-gaps', {
    title: 'Care Gaps', page: 'care-gaps',
    careGaps: data.careGaps || []
  });
});

module.exports = router;
