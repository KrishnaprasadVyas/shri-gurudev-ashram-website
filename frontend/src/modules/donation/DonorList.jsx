import { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/helpers';
import { topDonors } from '../../data/dummyData';

// Trophy icon for top donors
const TrophyIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15.19a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
  </svg>
);

// Recent donation icon
const DonationIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
  </svg>
);

const DonorList = ({ donors }) => {
  const [displayDonors, setDisplayDonors] = useState(donors.slice(0, 5));

  useEffect(() => {
    // Simulate live scrolling effect
    const interval = setInterval(() => {
      setDisplayDonors(prev => {
        const randomIndex = Math.floor(Math.random() * donors.length);
        const newDonor = donors[randomIndex];
        // Add new donor and remove oldest
        return [newDonor, ...prev.slice(0, 4)];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [donors]);

  // Get top 5 donors sorted by total amount
  const displayTopDonors = [...topDonors]
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
      {/* Recent Donations */}
      <div className="bg-amber-50 rounded-lg p-5 h-fit">
        <div className="flex items-center gap-3 mb-4">
          <DonationIcon className="w-6 h-6 text-amber-600" />
          <h3 className="text-xl font-bold text-amber-900">Recent Donations</h3>
          <span className="ml-auto flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-green-600 font-medium">Live</span>
          </span>
        </div>
        <div className="space-y-2">
          {displayDonors.map((donor, index) => (
            <div
              key={`${donor.id}-${index}`}
              className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border-l-4 border-amber-400"
            >
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-amber-900">{donor.name}</span>
                <span className="text-gray-500 text-sm ml-2">from {donor.city}</span>
              </div>
              <div className="font-bold text-amber-700 whitespace-nowrap ml-2">{formatCurrency(donor.amount)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Donors */}
      <div className="bg-gradient-to-br from-amber-100 to-orange-50 rounded-lg p-5 border border-amber-200 h-fit">
        <div className="flex items-center gap-3 mb-4">
          <TrophyIcon className="w-6 h-6 text-amber-600" />
          <h3 className="text-xl font-bold text-amber-900">Top Donors</h3>
        </div>
        <div className="space-y-2">
          {displayTopDonors.map((donor, index) => (
            <div
              key={donor.id}
              className="flex justify-between items-center bg-white/90 p-3 rounded-lg shadow-sm"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${
                  index === 0 ? 'bg-yellow-400 text-yellow-900' :
                  index === 1 ? 'bg-gray-300 text-gray-700' :
                  index === 2 ? 'bg-orange-400 text-orange-900' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {index + 1}
                </span>
                <span className="font-medium text-amber-900 truncate">{donor.name}</span>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <div className="font-bold text-amber-700 text-sm">{formatCurrency(donor.totalAmount)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DonorList;

