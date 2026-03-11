const { getDb } = require('../db/database');
const logger = require('../utils/logger');

function auditLog(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    try {
      const duration = Date.now() - start;
      const userId = req.session && req.session.userId ? req.session.userId : 'anonymous';
      if (req.path.startsWith('/api/') || req.path.startsWith('/auth/') || req.path.startsWith('/dashboard')) {
        const db = getDb();
        db.prepare(`INSERT INTO audit_log (user_id, action, resource, detail, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)`)
          .run(userId, req.method, req.path, JSON.stringify({ statusCode: res.statusCode, duration }), req.ip, req.get('user-agent'));
        logger.info('Audit entry', { userId, method: req.method, path: req.path, status: res.statusCode, duration });
      }
    } catch (err) {
      logger.error('Audit log error', { error: err.message });
    }
  });
  next();
}

module.exports = auditLog;
