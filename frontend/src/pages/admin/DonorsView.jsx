import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency } from "../../utils/helpers";
import { API_BASE_URL, parseJsonResponse } from "../../utils/api";

const DonorsView = () => {
  const { user } = useAuth();
  const [donors, setDonors] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDonor, setSelectedDonor] = useState(null);

  // Fetch donors and donations from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication required");
          return;
        }

        // Fetch donations to get donor info
        const donationsRes = await fetch(`${API_BASE_URL}/admin/system/donations`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!donationsRes.ok) {
          throw new Error("Failed to fetch donations");
        }

        const donationsData = await parseJsonResponse(donationsRes);
        setDonations(donationsData);

        // Build donors list from donations (unique by donor name + ID)
        const donorMap = new Map();
        donationsData.forEach((donation) => {
          if (donation.donor && donation.donor.name) {
            const key = `${donation.donor.name}-${donation.donor.idNumber || ""}`;
            if (!donorMap.has(key)) {
              donorMap.set(key, {
                id: donation._id,
                name: donation.donor.name,
                mobile: donation.donor.mobile || "N/A",
                email: donation.donor.email || "",
                address: donation.donor.address || "",
                governmentIdType: donation.donor.idType || "N/A",
                governmentIdMasked: donation.donor.idNumber || "****",
                totalDonated: 0,
                donationCount: 0,
                lastDonation: donation.createdAt,
              });
            }
            if (donation.status === "SUCCESS") {
              const donor = donorMap.get(key);
              donor.totalDonated += donation.amount;
              donor.donationCount += 1;
              if (new Date(donation.createdAt) > new Date(donor.lastDonation)) {
                donor.lastDonation = donation.createdAt;
              }
            }
          }
        });

        setDonors(Array.from(donorMap.values()));
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter donors
  const filteredDonors = useMemo(() => {
    if (!searchQuery) return donors;

    const query = searchQuery.toLowerCase();
    return donors.filter(
      (donor) =>
        donor.name.toLowerCase().includes(query) ||
        donor.mobile.includes(query) ||
        (donor.email && donor.email.toLowerCase().includes(query))
    );
  }, [donors, searchQuery]);

  // Get donor's donation history
  const getDonorDonations = (donorName, donorIdNumber) => {
    return donations.filter(
      (d) =>
        d.donor &&
        d.donor.name === donorName &&
        (donorIdNumber ? d.donor.idNumber === donorIdNumber : true)
    );
  };

  const handleDonorClick = (donor) => {
    setSelectedDonor(donor);
  };

  const closeModal = () => {
    setSelectedDonor(null);
  };

  const donorDonations = selectedDonor
    ? getDonorDonations(selectedDonor.name, selectedDonor.governmentIdMasked)
    : [];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          <span className="ml-3 text-gray-600">Loading donors...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Donors</h1>
          <p className="text-gray-600 text-sm mt-1">
            View and manage all donor records from database
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, mobile, or email..."
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Donor Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mobile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Govt ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Donated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  # Donations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDonors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No donors found
                  </td>
                </tr>
              ) : (
                filteredDonors.map((donor, index) => (
                  <tr key={`${donor.id}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {donor.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {donor.mobile || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {donor.email || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {donor.governmentIdType}: {donor.governmentIdMasked}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-amber-900">
                      {formatCurrency(donor.totalDonated)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {donor.donationCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDonorClick(donor)}
                        className="text-amber-600 hover:text-amber-700 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Total Donors: {filteredDonors.length}
            </span>
            <span className="text-sm font-semibold text-amber-900">
              Total Donated: {formatCurrency(
                filteredDonors.reduce((sum, d) => sum + d.totalDonated, 0)
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Donor Details Modal */}
      {selectedDonor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Donor Summary</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Name</label>
                  <p className="text-sm font-medium text-gray-900">{selectedDonor.name}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Mobile</label>
                  <p className="text-sm text-gray-700">{selectedDonor.mobile || "N/A"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                  <p className="text-sm text-gray-700">{selectedDonor.email || "N/A"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Address</label>
                  <p className="text-sm text-gray-700">{selectedDonor.address || "N/A"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Government ID</label>
                  <p className="text-sm text-gray-700">
                    {selectedDonor.governmentIdType}: {selectedDonor.governmentIdMasked}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Total Donated</label>
                  <p className="text-sm font-semibold text-amber-900">
                    {formatCurrency(selectedDonor.totalDonated)}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Donation History</h3>
                {donorDonations.length === 0 ? (
                  <p className="text-sm text-gray-500">No donations found</p>
                ) : (
                  <div className="space-y-2">
                    {donorDonations.map((donation) => (
                      <div key={donation._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{donation.donationHead?.name || "General"}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(donation.createdAt).toLocaleDateString()} • 
                            <span className={`ml-1 font-medium ${donation.status === "SUCCESS" ? "text-green-600" : donation.status === "PENDING" ? "text-yellow-600" : "text-red-600"}`}>
                              {donation.status}
                            </span> • 
                            <span className="ml-1 text-blue-600">{donation.paymentMethod || "ONLINE"}</span>
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(donation.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DonorsView;
