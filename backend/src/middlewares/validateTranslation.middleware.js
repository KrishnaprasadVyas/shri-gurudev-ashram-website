const {
  translatableFields,
  SUPPORTED_LANGUAGES,
} = require("../config/translatableFields");

/**
 * Validate that multilingual fields contain at least an English value.
 * Accepts both plain strings (backward compat) and { en, hi, mr } objects.
 *
 * Usage: validateTranslation("Banner") as route middleware
 */
function validateTranslation(modelName) {
  const fields = translatableFields[modelName];
  if (!fields) {
    throw new Error(`No translatable fields config for model: ${modelName}`);
  }

  // Only validate top-level fields (nested are part of arrays, validated inline)
  const topLevelFields = fields.filter((f) => !f.includes("."));

  return (req, res, next) => {
    const errors = [];

    for (const field of topLevelFields) {
      const value = req.body[field];
      if (value === undefined || value === null || value === "") continue;

      // If it's a string, that's backward-compatible, accept it
      if (typeof value === "string") continue;

      // If it's an object, validate structure
      if (typeof value === "object" && !Array.isArray(value)) {
        // Check that all keys are valid languages
        const keys = Object.keys(value);
        const invalidKeys = keys.filter(
          (k) => !SUPPORTED_LANGUAGES.includes(k),
        );
        if (invalidKeys.length > 0) {
          errors.push(
            `${field}: invalid language keys: ${invalidKeys.join(", ")}`,
          );
        }
      } else {
        errors.push(`${field}: must be a string or { en, hi, mr } object`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Translation validation failed: ${errors.join("; ")}`,
      });
    }

    next();
  };
}

module.exports = validateTranslation;
