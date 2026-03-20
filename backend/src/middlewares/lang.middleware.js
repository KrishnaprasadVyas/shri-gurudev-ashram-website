const {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
} = require("../config/translatableFields");

/**
 * Language middleware
 * Extracts ?lang= query param and sets req.lang
 * Defaults to "en" if missing or invalid
 */
function langMiddleware(req, res, next) {
  const lang = req.query.lang;
  req.lang = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
  next();
}

module.exports = langMiddleware;
