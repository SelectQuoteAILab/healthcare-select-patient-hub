const router = require('express').Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/');
  next();
}

router.get('/status', requireAuth, (req, res) => {
  res.json({
    connected: !!req.session.bbConnected,
    dataFetched: !!req.session.bbData,
    isDemoUser: !!req.session.isDemoUser
  });
});

module.exports = router;
