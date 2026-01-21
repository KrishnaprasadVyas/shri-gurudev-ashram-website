import { useState, useEffect } from "react";
import { formatCurrency } from "../../utils/helpers";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ExportsView = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication required");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/admin/system/donations`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch donations");
        }

        const data = await response.json();
        setDonations(data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Convert data to CSV format
  const convertToCSV = (data, headers) => {
    const headerRow = headers.map(h => h.label).join(",");
    const rows = data.map(item => 
      headers.map(h => {
        let value = h.getValue(item);
        // Escape commas and quotes in values
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(",")
    );
    return [headerRow, ...rows].join("\n");
  };

  // Download CSV file
  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExportDonations = () => {
    if (donations.length === 0) {
      showToast("No donations to export", true);
      return;
    }

    const headers = [
      { label: "Date", getValue: (d) => new Date(d.createdAt).toLocaleDateString() },
      { label: "Receipt No", getValue: (d) => d.receiptNumber || "N/A" },
      { label: "Donor Name", getValue: (d) => d.donor?.anonymousDisplay ? "Anonymous" : (d.donor?.name || "N/A") },
      { label: "Mobile", getValue: (d) => d.donor?.mobile || "N/A" },
      { label: "Email", getValue: (d) => d.donor?.email || "N/A" },
      { label: "Amount", getValue: (d) => d.amount },
      { label: "Cause", getValue: (d) => d.donationHead?.name || "General" },
      { label: "Payment Method", getValue: (d) => d.paymentMethod || "ONLINE" },
      { label: "Status", getValue: (d) => d.status },
      { label: "Transaction Ref", getValue: (d) => d.transactionRef || d.razorpayPaymentId || "N/A" },
    ];

    const csv = convertToCSV(donations, headers);
    downloadCSV(csv, `donations_export_${new Date().toISOString().split("T")[0]}.csv`);
    showToast("Donations exported successfully!");
  };

  const handleExportDonors = () => {
    // Build unique donors from donations
    const donorMap = new Map();
    donations.forEach((donation) => {
      if (donation.donor && donation.donor.name) {
        const key = `${donation.donor.name}-${donation.donor.idNumber || ""}`;
        if (!donorMap.has(key)) {
          donorMap.set(key, {
            name: donation.donor.name,
            mobile: donation.donor.mobile || "N/A",
            email: donation.donor.email || "N/A",
            address: donation.donor.address || "N/A",
            idType: donation.donor.idType || "N/A",
            idNumber: donation.donor.idNumber || "N/A",
            totalDonated: 0,
            donationCount: 0,
          });
        }
        if (donation.status === "SUCCESS") {
          const donor = donorMap.get(key);
          donor.totalDonated += donation.amount;
          donor.donationCount += 1;
        }
      }
    });

    const donors = Array.from(donorMap.values());

    if (donors.length === 0) {
      showToast("No donors to export", true);
      return;
    }

    const headers = [
      { label: "Name", getValue: (d) => d.name },
      { label: "Mobile", getValue: (d) => d.mobile },
      { label: "Email", getValue: (d) => d.email },
      { label: "Address", getValue: (d) => d.address },
      { label: "ID Type", getValue: (d) => d.idType },
      { label: "ID Number (Masked)", getValue: (d) => d.idNumber },
      { label: "Total Donated", getValue: (d) => d.totalDonated },
      { label: "Donation Count", getValue: (d) => d.donationCount },
    ];

    const csv = convertToCSV(donors, headers);
    downloadCSV(csv, `donors_export_${new Date().toISOString().split("T")[0]}.csv`);
    showToast("Donors exported successfully!");
  };

  const handleExportReceipts = () => {
    const donationsWithReceipts = donations.filter(d => d.receiptUrl);
    
    if (donationsWithReceipts.length === 0) {
      showToast("No receipts available to export", true);
      return;
    }

    // Export receipt list as CSV (actual PDF bulk download would need backend support)
    const headers = [
      { label: "Receipt No", getValue: (d) => d.receiptNumber || "N/A" },
      { label: "Date", getValue: (d) => new Date(d.createdAt).toLocaleDateString() },
      { label: "Donor Name", getValue: (d) => d.donor?.name || "N/A" },
      { label: "Amount", getValue: (d) => d.amount },
      { label: "Cause", getValue: (d) => d.donationHead?.name || "General" },
      { label: "Receipt URL", getValue: (d) => d.receiptUrl || "N/A" },
    ];

    const csv = convertToCSV(donationsWithReceipts, headers);
    downloadCSV(csv, `receipts_list_${new Date().toISOString().split("T")[0]}.csv`);
    showToast("Receipts list exported successfully!");
  };

  // Calculate stats
  const totalDonations = donations.length;
  const uniqueDonors = new Set(donations.map(d => d.donor?.name).filter(Boolean)).size;
  const receiptsCount = donations.filter(d => d.receiptUrl).length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          <span className="ml-3 text-gray-600">Loading data...</span>
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
          <h1 className="text-2xl font-bold text-gray-900">Exports</h1>
          <p className="text-gray-600 text-sm mt-1">
            Export donation data and reports
          </p>
        </div>

        <div className="space-y-6">
          {/* Export Donations */}
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Export Donations</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Export all donation records to CSV format
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Total records: {donations.length}
                </p>
              </div>
              <button
                onClick={handleExportDonations}
                className="px-6 py-2 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 transition-colors"
              >
                Export CSV
              </button>
            </div>
            <div className="text-xs text-gray-500">
              Includes: Date, Donor Name, Amount, Cause, Payment Status
            </div>
          </div>

          {/* Export Donors */}
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Export Donors</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Export all donor records to CSV format
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Total records: {uniqueDonors}
                </p>
              </div>
              <button
                onClick={handleExportDonors}
                className="px-6 py-2 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 transition-colors"
              >
                Export CSV
              </button>
            </div>
            <div className="text-xs text-gray-500">
              Includes: Name, Mobile, Government ID Type, Total Donated
            </div>
          </div>

          {/* Export Receipts */}
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Export Receipts List</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Export list of all receipts to CSV format
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Total receipts: {receiptsCount}
                </p>
              </div>
              <button
                onClick={handleExportReceipts}
                className="px-6 py-2 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 transition-colors"
              >
                Export CSV
              </button>
            </div>
            <div className="text-xs text-gray-500">
              Exports receipt details including receipt numbers and download URLs
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div className={`${toast.isError ? "bg-red-600" : "bg-green-600"} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {toast.isError ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              )}
            </svg>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportsView;
