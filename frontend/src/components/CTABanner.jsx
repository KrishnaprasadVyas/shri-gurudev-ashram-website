import { Link } from "react-router-dom";

const CTABanner = ({ title, description, primaryAction, secondaryAction }) => {
  const renderAction = (action, variant = "primary") => {
    if (!action) return null;

    const baseClasses =
      variant === "primary"
        ? "px-8 py-3 bg-white text-amber-700 rounded-lg text-lg font-semibold hover:bg-amber-50 transition-colors shadow-lg"
        : "px-8 py-3 bg-amber-800 text-white rounded-lg text-lg font-semibold hover:bg-amber-900 transition-colors shadow-lg";

    if (action.disabled) {
      return (
        <span
          aria-disabled="true"
          title={action.title || "Coming soon"}
          className={`${baseClasses} cursor-not-allowed opacity-70 hover:bg-amber-800/60 hover:text-white`}
        >
          {action.label}
        </span>
      );
    }

    return (
      <Link to={action.path} className={baseClasses}>
        {action.label}
      </Link>
    );
  };

  return (
    <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white py-12 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
        {description && (
          <p className="text-xl mb-8 text-amber-100">{description}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {renderAction(primaryAction, "primary")}
          {renderAction(secondaryAction, "secondary")}
        </div>
      </div>
    </div>
  );
};

export default CTABanner;
