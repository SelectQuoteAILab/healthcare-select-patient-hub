/**
 * src/middleware/validate.js
 *
 * Reusable input validation middleware built on express-validator.
 *
 * Usage:
 *   const { validateParams, validateQuery, rules } = require('../middleware/validate');
 *
 *   // Validate a UUID route param named 'id':
 *   router.get('/:id', validateParams({ id: rules.uuid }), handler);
 *
 *   // Validate an integer query param named 'page' (optional):
 *   router.get('/', validateQuery({ page: rules.positiveInt.optional() }), handler);
 *
 * All validators call next(validationError) on failure so the global error
 * handler in server.js logs it and returns a safe 400 response. No PHI is
 * ever reflected back in validation error messages.
 */

const { param, query, body, validationResult } = require('express-validator');

// ── Shared validation chains ──────────────────────────────────────────────────

/**
 * Pre-built validation chain factories. Each is a function that accepts an
 * express-validator field name and returns a configured ValidationChain.
 * Attach .optional() before passing to validateParams/validateQuery if needed.
 */
const rules = {
  /**
   * UUID v4 – used for user IDs, claim IDs, etc.
   * Accepts both upper and lower case hex.
   */
  uuid: (field) =>
    param(field)
      .trim()
      .isUUID(4)
      .withMessage(`${field} must be a valid UUID`),

  /**
   * UUID sourced from a query string rather than a route param.
   */
  uuidQuery: (field) =>
    query(field)
      .trim()
      .isUUID(4)
      .withMessage(`${field} must be a valid UUID`),

  /**
   * Positive integer (page numbers, row IDs from SQLite AUTOINCREMENT columns).
   * Coerces the string to an integer; rejects floats and negative numbers.
   */
  positiveInt: (field) =>
    param(field)
      .trim()
      .isInt({ min: 1 })
      .toInt()
      .withMessage(`${field} must be a positive integer`),

  /**
   * Positive integer sourced from a query string.
   */
  positiveIntQuery: (field) =>
    query(field)
      .trim()
      .isInt({ min: 1 })
      .toInt()
      .withMessage(`${field} must be a positive integer`),

  /**
   * Non-empty string body field, with a configurable max length.
   * Strips leading/trailing whitespace.
   *
   * @param {string} field - body field name
   * @param {number} [maxLen=1000] - maximum character length
   */
  nonEmptyString: (field, maxLen = 1000) =>
    body(field)
      .trim()
      .notEmpty()
      .withMessage(`${field} is required`)
      .isLength({ max: maxLen })
      .withMessage(`${field} must be at most ${maxLen} characters`),

  /**
   * Optional string body field. Permits absent/empty values but caps length
   * when present to prevent oversized payloads being written to the DB.
   *
   * @param {string} field
   * @param {number} [maxLen=1000]
   */
  optionalString: (field, maxLen = 1000) =>
    body(field)
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: maxLen })
      .withMessage(`${field} must be at most ${maxLen} characters`),

  /**
   * ISO 8601 date string. Used for date params in query strings.
   */
  isoDate: (field) =>
    query(field)
      .optional({ checkFalsy: true })
      .trim()
      .isISO8601()
      .withMessage(`${field} must be a valid ISO 8601 date (YYYY-MM-DD)`),

  /**
   * Enum validator – rejects values outside an allowed set.
   *
   * @param {string} field - body/param field name
   * @param {string[]} allowed - allowed string values
   * @param {'param'|'query'|'body'} [source='body']
   */
  oneOf: (field, allowed, source = 'body') => {
    const builders = { param, query, body };
    const builder = builders[source] || body;
    return builder(field)
      .trim()
      .isIn(allowed)
      .withMessage(`${field} must be one of: ${allowed.join(', ')}`);
  }
};

// ── Middleware factories ───────────────────────────────────────────────────────

/**
 * Returns a middleware array that validates route parameters.
 *
 * @param {Object.<string, function>} fieldRules
 *   Map of param name → rules factory, e.g. { id: rules.uuid }
 * @returns {import('express').RequestHandler[]}
 */
function validateParams(fieldRules) {
  const chains = Object.entries(fieldRules).map(([field, ruleFn]) => ruleFn(field));
  return [...chains, handleValidationErrors];
}

/**
 * Returns a middleware array that validates query string parameters.
 *
 * @param {Object.<string, function>} fieldRules
 * @returns {import('express').RequestHandler[]}
 */
function validateQuery(fieldRules) {
  const chains = Object.entries(fieldRules).map(([field, ruleFn]) => ruleFn(field));
  return [...chains, handleValidationErrors];
}

/**
 * Returns a middleware array that validates request body fields.
 *
 * @param {Object.<string, function>} fieldRules
 * @returns {import('express').RequestHandler[]}
 */
function validateBody(fieldRules) {
  const chains = Object.entries(fieldRules).map(([field, ruleFn]) => ruleFn(field));
  return [...chains, handleValidationErrors];
}

/**
 * Final middleware in any validate* chain. Collects results and either calls
 * next() (pass) or returns a 400 with a sanitized error list (fail).
 *
 * Error details are intentionally generic – no input values are reflected back
 * to prevent PHI/PII from appearing in error responses.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Map to field + message only; never include .value to avoid reflecting PHI.
    const sanitized = errors.array().map(({ path, msg }) => ({ field: path, message: msg }));
    return res.status(400).json({
      error: 'Validation failed',
      details: sanitized
    });
  }
  next();
}

// ── Convenience: authenticate session ────────────────────────────────────────

/**
 * Middleware that requires an authenticated session.
 * Redirects to '/' for browser requests; returns 401 JSON for API requests.
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  res.redirect('/');
}

module.exports = {
  rules,
  validateParams,
  validateQuery,
  validateBody,
  handleValidationErrors,
  requireAuth
};
