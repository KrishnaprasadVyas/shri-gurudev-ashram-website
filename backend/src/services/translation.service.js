const {
  translatableFields,
  DEFAULT_LANGUAGE,
} = require("../config/translatableFields");

/**
 * Resolve a single translatable field to the requested language.
 * Handles both pre-migration plain strings and { en, hi, mr } objects.
 */
function resolveTranslation(field, lang) {
  if (field === null || field === undefined) return "";
  if (typeof field === "string") return field;
  if (typeof field === "object" && !Array.isArray(field)) {
    return field[lang] || field[DEFAULT_LANGUAGE] || "";
  }
  return field;
}

/**
 * Format a single document by resolving all translatable fields for the given model.
 * Returns a new plain object (does not mutate input).
 */
function formatDocWithLanguage(doc, modelName, lang) {
  if (!doc) return doc;

  const fields = translatableFields[modelName];
  if (!fields) return doc;

  const result =
    typeof doc.toObject === "function" ? doc.toObject() : { ...doc };

  for (const fieldPath of fields) {
    if (fieldPath.includes(".")) {
      // Nested array field, e.g. "subitems.title"
      const [arrayField, nestedField] = fieldPath.split(".");
      if (Array.isArray(result[arrayField])) {
        for (const item of result[arrayField]) {
          if (nestedField === "points" && Array.isArray(item[nestedField])) {
            // points is an array of translatable strings
            item[nestedField] = item[nestedField].map((p) =>
              resolveTranslation(p, lang),
            );
          } else {
            item[nestedField] = resolveTranslation(item[nestedField], lang);
          }
        }
      }
    } else {
      // Top-level field
      result[fieldPath] = resolveTranslation(result[fieldPath], lang);
    }
  }

  return result;
}

/**
 * Format an array of documents.
 */
function formatArrayWithLanguage(docs, modelName, lang) {
  if (!Array.isArray(docs)) return docs;
  return docs.map((doc) => formatDocWithLanguage(doc, modelName, lang));
}

module.exports = {
  resolveTranslation,
  formatDocWithLanguage,
  formatArrayWithLanguage,
};
