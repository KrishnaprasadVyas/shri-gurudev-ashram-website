import { useState } from "react";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "mr", label: "मराठी" },
];

/**
 * MultilingualInput - Reusable input/textarea with language tabs
 *
 * @param {string} label - Field label
 * @param {object} value - { en: "", hi: "", mr: "" }
 * @param {function} onChange - (newValue) => void, receives full { en, hi, mr } object
 * @param {boolean} required - Whether English is required
 * @param {string} type - "text" | "textarea"
 * @param {number} rows - Textarea rows (default 3)
 * @param {string} placeholder - Placeholder text
 * @param {string} error - Error message
 */
const MultilingualInput = ({
  label,
  value = {},
  onChange,
  required = false,
  type = "text",
  rows = 3,
  placeholder = "",
  error,
}) => {
  const [activeLang, setActiveLang] = useState("en");

  const safeValue = {
    en: value?.en || "",
    hi: value?.hi || "",
    mr: value?.mr || "",
  };

  const handleChange = (e) => {
    onChange({
      ...safeValue,
      [activeLang]: e.target.value,
    });
  };

  const inputClasses = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
    error
      ? "border-red-500 focus:ring-red-500"
      : "border-gray-300 focus:ring-amber-500"
  }`;

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Language tabs */}
      <div className="flex gap-1 mb-1">
        {LANGUAGES.map((lang) => {
          const isActive = activeLang === lang.code;
          const hasContent = safeValue[lang.code]?.trim().length > 0;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setActiveLang(lang.code)}
              className={`px-2.5 py-1 text-xs font-medium rounded-t-md border border-b-0 transition-colors ${
                isActive
                  ? "bg-white text-amber-700 border-gray-300"
                  : hasContent
                    ? "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
              }`}
            >
              {lang.label}
              {hasContent && !isActive && (
                <span className="ml-1 text-green-500">●</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Input field */}
      {type === "textarea" ? (
        <textarea
          value={safeValue[activeLang]}
          onChange={handleChange}
          rows={rows}
          className={inputClasses}
          placeholder={
            placeholder ||
            `Enter ${label?.toLowerCase() || "text"} in ${LANGUAGES.find((l) => l.code === activeLang)?.label}`
          }
          required={required && activeLang === "en"}
        />
      ) : (
        <input
          type="text"
          value={safeValue[activeLang]}
          onChange={handleChange}
          className={inputClasses}
          placeholder={
            placeholder ||
            `Enter ${label?.toLowerCase() || "text"} in ${LANGUAGES.find((l) => l.code === activeLang)?.label}`
          }
          required={required && activeLang === "en"}
        />
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {activeLang !== "en" && (
        <p className="mt-0.5 text-xs text-gray-400">
          Optional — falls back to English if empty
        </p>
      )}
    </div>
  );
};

export default MultilingualInput;
