/**
 * Translatable Fields Configuration
 * Maps each model to its translatable field paths.
 *
 * - Top-level fields: "title", "description"
 * - Nested array fields: "subitems.title" means subitems[].title
 */

const SUPPORTED_LANGUAGES = ["en", "hi", "mr"];
const DEFAULT_LANGUAGE = "en";

const translatableFields = {
  Event: ["title", "description", "location"],

  Activity: [
    "title",
    "description",
    "subitems.title",
    "subitems.description",
    "subitems.points",
  ],

  DonationHead: [
    "name",
    "description",
    "longDescription",
    "subCauses.name",
    "subCauses.description",
  ],

  GalleryCategory: ["name", "description", "images.title", "images.altText"],

  Announcement: ["text", "linkText"],

  Banner: ["title", "subtitle", "description", "ctaText"],
};

module.exports = {
  translatableFields,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
};
