/**
 * Mongoose schema helpers for multilingual fields.
 * Generates { en: String, hi: String, mr: String } sub-schemas.
 */

/**
 * Create a multilingual field definition.
 * @param {Object} options - Options for the English (primary) field
 *   e.g. { required: true, maxlength: 200, trim: true }
 * @returns Mongoose schema definition for { en, hi, mr }
 */
function multilingualField(options = {}) {
  const { required, maxlength, trim = true, default: defaultVal } = options;

  const enField = { type: String, trim };
  const otherField = { type: String, trim, default: "" };

  if (required) {
    enField.required = Array.isArray(required)
      ? required
      : [true, `English value is required`];
  }
  if (maxlength) {
    const ml = Array.isArray(maxlength)
      ? maxlength
      : [maxlength, `Cannot exceed ${maxlength} characters`];
    enField.maxlength = ml;
    otherField.maxlength = ml;
  }
  if (defaultVal !== undefined) {
    enField.default = defaultVal;
    otherField.default = defaultVal;
  } else if (!required) {
    enField.default = "";
  }

  return {
    en: enField,
    hi: otherField,
    mr: otherField,
  };
}

/**
 * Shorthand for required multilingual field with maxlength.
 */
function multilingualFieldRequired(maxlength, message) {
  return multilingualField({
    required: message ? [true, message] : true,
    maxlength: maxlength || undefined,
  });
}

module.exports = { multilingualField, multilingualFieldRequired };
