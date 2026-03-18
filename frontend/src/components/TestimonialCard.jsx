import { useTranslation } from "react-i18next";

const TestimonialCard = ({ testimonial }) => {
  const { i18n } = useTranslation();

  const getLocalizedText = (value) => {
    if (typeof value === "string") return value;
    if (value && typeof value === "object") {
      return value[i18n.language] || value.en || value.hi || value.mr || "";
    }
    return "";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-amber-100">
      <div className="flex items-center mb-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <span key={i} className="text-amber-500 text-xl"></span>
        ))}
      </div>
      <p className="text-gray-700 mb-4 italic">
        "{getLocalizedText(testimonial.message)}"
      </p>
      <div className="border-t pt-4">
        <p className="font-semibold text-amber-900">
          {getLocalizedText(testimonial.name)}
        </p>
        <p className="text-sm text-gray-600">
          {getLocalizedText(testimonial.city)}
        </p>
      </div>
    </div>
  );
};

export default TestimonialCard;
