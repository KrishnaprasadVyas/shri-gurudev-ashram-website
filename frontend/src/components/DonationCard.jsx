import { Link } from 'react-router-dom';
import { donationIcons } from '../data/dummyData';

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
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: iconSvg }}
    />
  );
};

const DonationCard = ({ donation }) => {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 border border-amber-100">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <CauseIcon 
            iconKey={donation.icon} 
            className="w-12 h-12 text-amber-600 [&>svg]:w-full [&>svg]:h-full [&>svg]:fill-current" 
          />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-amber-900 mb-2">{donation.name}</h3>
          <p className="text-gray-600 mb-4">{donation.description}</p>
          <Link
            to="/donate"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-md transition-colors text-sm font-medium"
          >
            <HeartIcon className="w-4 h-4" />
            Donate Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DonationCard;

