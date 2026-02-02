import { createContext, useContext, useState, useEffect } from "react";

const DonationsContext = createContext();

// Initialize with mock data
const getInitialDonations = () => {
  return [
    {
      id: 1,
      date: "2024-03-12",
      donorName: "Anonymous",
      amount: 5000,
      cause: "General Seva",
      paymentStatus: "Success",
      receiptAvailable: true,
    },
    {
      id: 2,
      date: "2024-03-12",
      donorName: "Rajesh Kumar",
      amount: 1000,
      cause: "Annadan Seva",
      paymentStatus: "Success",
      receiptAvailable: true,
    },
    {
      id: 3,
      date: "2024-03-11",
      donorName: "Priya Sharma",
      amount: 2500,
      cause: "Education",
      paymentStatus: "Success",
      receiptAvailable: true,
    },
    {
      id: 4,
      date: "2024-03-11",
      donorName: "Amit Patel",
      amount: 500,
      cause: "Medical Seva",
      paymentStatus: "Pending",
      receiptAvailable: false,
    },
    {
      id: 5,
      date: "2024-03-10",
      donorName: "Sunita Devi",
      amount: 10000,
      cause: "Goushala Seva",
      paymentStatus: "Success",
      receiptAvailable: true,
    },
    {
      id: 6,
      date: "2024-03-10",
      donorName: "Kumar Mehta",
      amount: 2000,
      cause: "Anath Seva",
      paymentStatus: "Success",
      receiptAvailable: true,
    },
    {
      id: 7,
      date: "2024-03-09",
      donorName: "Anonymous",
      amount: 1500,
      cause: "General Seva",
      paymentStatus: "Success",
      receiptAvailable: true,
    },
    {
      id: 8,
      date: "2024-03-09",
      donorName: "Lakshmi Rao",
      amount: 3000,
      cause: "Ashram Development",
      paymentStatus: "Success",
      receiptAvailable: true,
    },
  ];
};

const getInitialDonors = () => {
  // Calculate total donated for each donor
  const donations = getInitialDonations();
  const donorMap = new Map();

  donations.forEach((donation) => {
    if (donation.donorName !== "Anonymous") {
      if (!donorMap.has(donation.donorName)) {
        donorMap.set(donation.donorName, {
          id: donorMap.size + 1,
          name: donation.donorName,
          mobile: "", // Will be populated from donation flow
          governmentIdType: "PAN",
          governmentIdMasked: "AB****1A",
          totalDonated: 0,
        });
      }
      const donor = donorMap.get(donation.donorName);
      donor.totalDonated += donation.amount;
    }
  });

  // Add some mock data for donors
  const donors = Array.from(donorMap.values());
  donors[0] = {
    ...donors[0],
    mobile: "9876543210",
    governmentIdType: "PAN",
    governmentIdMasked: maskGovtId("ABCDE1234F", "PAN"),
  };
  if (donors[1])
    donors[1] = {
      ...donors[1],
      mobile: "9876543211",
      governmentIdType: "Aadhaar",
      governmentIdMasked: maskGovtId("123456789012", "Aadhaar"),
    };
  if (donors[2])
    donors[2] = {
      ...donors[2],
      mobile: "9876543212",
      governmentIdType: "PAN",
      governmentIdMasked: maskGovtId("FGHIJ5678K", "PAN"),
    };
  if (donors[3])
    donors[3] = {
      ...donors[3],
      mobile: "9876543213",
      governmentIdType: "Aadhaar",
      governmentIdMasked: maskGovtId("987654321098", "Aadhaar"),
    };
  if (donors[4])
    donors[4] = {
      ...donors[4],
      mobile: "9876543214",
      governmentIdType: "PAN",
      governmentIdMasked: maskGovtId("LMNOP9012Q", "PAN"),
    };
  if (donors[5])
    donors[5] = {
      ...donors[5],
      mobile: "9876543215",
      governmentIdType: "Aadhaar",
      governmentIdMasked: maskGovtId("456789012345", "Aadhaar"),
    };

  return donors;
};

export const DonationsProvider = ({ children }) => {
  const [donations, setDonations] = useState(() => {
    const saved = localStorage.getItem("donations");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return getInitialDonations();
      }
    }
    return getInitialDonations();
  });

  const [donors, setDonors] = useState(() => {
    const saved = localStorage.getItem("donors");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return getInitialDonors();
      }
    }
    return getInitialDonors();
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem("donations", JSON.stringify(donations));
  }, [donations]);

  useEffect(() => {
    localStorage.setItem("donors", JSON.stringify(donors));
  }, [donors]);

  // Add a new donation (called from donation flow)
  const addDonation = (donationData) => {
    const newDonation = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      donorName: donationData.anonymousDisplay
        ? "Anonymous"
        : donationData.name || "Anonymous",
      amount: donationData.amount || 0,
      cause: donationData.donationHead?.name || "General Seva",
      paymentStatus: "Success", // Assume success after payment
      receiptAvailable: true,
    };

    setDonations((prev) => [newDonation, ...prev]);

    // Update or create donor
    if (!donationData.anonymousDisplay && donationData.name) {
      const existingDonorIndex = donors.findIndex(
        (d) => d.name === donationData.name,
      );

      if (existingDonorIndex >= 0) {
        // Update existing donor
        const updatedDonors = [...donors];
        updatedDonors[existingDonorIndex] = {
          ...updatedDonors[existingDonorIndex],
          totalDonated:
            updatedDonors[existingDonorIndex].totalDonated + newDonation.amount,
          mobile:
            donationData.mobile || updatedDonors[existingDonorIndex].mobile,
        };
        setDonors(updatedDonors);
      } else {
        // Create new donor
        const newDonor = {
          id: Date.now() + 1,
          name: donationData.name,
          mobile: donationData.mobile || "",
          governmentIdType: "PAN",
          governmentId: donationData.pan || "",
          totalDonated: newDonation.amount,
        };
        setDonors((prev) => [...prev, newDonor]);
      }
    }
  };

  const value = {
    donations,
    donors,
    addDonation,
  };

  return (
    <DonationsContext.Provider value={value}>
      {children}
    </DonationsContext.Provider>
  );
};

export const useDonations = () => {
  const context = useContext(DonationsContext);
  if (!context) {
    throw new Error("useDonations must be used within DonationsProvider");
  }
  return context;
};
