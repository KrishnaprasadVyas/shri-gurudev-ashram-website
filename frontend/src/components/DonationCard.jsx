import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { donationIcons } from "../data/dummyData";

const HeartIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
  </svg>
);

// Component to render SVG icon from string
const CauseIcon = ({ iconKey, className }) => {
  const iconSvg = donationIcons[iconKey];
  if (!iconSvg) return null;

  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: iconSvg }} />
  );
};

const DonationCard = ({ donation }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden border border-amber-100">
      {/* Image Section */}
      {donation.imageUrl ? (
        <div className="h-48 overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50">
          <img
            src={donation.imageUrl}
            alt={donation.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `<div class="flex items-center justify-center h-full"><div class="w-16 h-16 text-amber-600 [&>svg]:w-full [&>svg]:h-full [&>svg]:fill-current">${donationIcons[donation.iconKey || donation.icon] || ''}</div></div>`;
            }}
          />
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
          <CauseIcon
            iconKey={donation.iconKey || donation.icon}
            className="w-16 h-16 text-amber-600 [&>svg]:w-full [&>svg]:h-full [&>svg]:fill-current"
          />
        </div>
      )}
      
      {/* Content Section */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <CauseIcon
            iconKey={donation.iconKey || donation.icon}
            className="w-5 h-5 text-amber-600 [&>svg]:w-full [&>svg]:h-full [&>svg]:fill-current"
          />
          <h3 className="text-xl font-bold text-amber-900">
            {donation.name}
          </h3>
        </div>
        <p className="text-gray-600 mb-4 text-sm">{donation.description}</p>
        <Link
          to="/donate"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-md transition-colors text-sm font-medium w-full justify-center"
        >
          <HeartIcon className="w-4 h-4" />
          {t("donation.donateNow")}
        </Link>
      </div>
    </div>
  );
};

export default DonationCard;
