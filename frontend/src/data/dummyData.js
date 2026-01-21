// Dummy data for the entire application

export const announcements = [
  {
    id: 1,
    text: "Special Satsang Program on 15th March - All devotees welcome!",
    type: "event",
  },
  {
    id: 2,
    text: "Annadan Seva: Feed 1000 families this month - Support our cause",
    type: "donation",
  },
  {
    id: 3,
    text: "Online shop coming soon. Stay tuned!",
    type: "info",
  },
];

export const activities = [
  {
    id: 1,
    title: "Festival Celebration",
    description: "Celebrations and special programs for major festivals.",
    icon: "",
    category: "spiritual",
    subitems: [
      {
        id: "jammashtami",
        title: "Jammashtami",
        description:
          "Devotional programs and celebrations on Lord Krishna's birth.",
      },
      {
        id: "holi",
        title: "Holi",
        description: "Colorful Holi celebrations with community participation.",
      },
      {
        id: "diwali",
        title: "Diwali",
        description: "Festival of lights and special aartis and bhajans.",
      },
      {
        id: "rakshabandhan",
        title: "Rakshabandhan",
        description: "Sibling bonding festival programs and rituals.",
      },
    ],
  },
  {
    id: 2,
    title: "Annadan Seva",
    description: "Feeding the needy and underprivileged families",
    icon: "",
    category: "social",
    subitems: [
      {
        id: "annadan-overview",
        title: "Annadan Seva",
        description: "Feeding drives and schedules for supporting families.",
        points: ["Daily meal distribution", "Special festival distributions"],
      },
    ],
  },
  {
    id: 7,
    title: "Daily Routine",
    description: "Regular daily schedule and aartis.",
    icon: "",
    category: "spiritual",
    subitems: [
      {
        id: "daily-aandan",
        title: "Daily Aandan",
        description: "",
      },
      {
        id: "morning-aarti",
        title: "Daily Morning Aarti 6am",
        description: "",
      },
      {
        id: "kakda-aarti",
        title: "Kakda Aarti 4am",
        description: "",
      },
      {
        id: "haripath",
        title: "Haripath (6 pm)",
        description: "",
      },
    ],
  },
  {
    id: 8,
    title: "Gurudev Programs",
    description: "Special spiritual programs led by Gurudev.",
    icon: "",
    category: "spiritual",
    subitems: [
      {
        id: "shrimad-bhagwat",
        title: "Shrimad bhagwat khata",
        description: "",
      },
      {
        id: "ram-katha",
        title: "Ram katha",
        description: "",
      },
      {
        id: "hari-kala",
        title: "Hari kala kirtan",
        description: "",
      },
    ],
  },
];

export const events = [
  {
    id: 1,
    title: "Maha Satsang with Gurudev",
    date: "2024-03-15",
    time: "6:00 PM",
    location: "Main Hall",
    description:
      "A special spiritual gathering with Gurudev's divine discourse",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    status: "upcoming",
  },
  {
    id: 2,
    title: "Annadan Seva Program",
    date: "2024-03-20",
    time: "10:00 AM",
    location: "Community Hall",
    description: "Join us in feeding 1000 families. Volunteers welcome!",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800",
    status: "upcoming",
  },
  {
    id: 3,
    title: "Yoga Workshop",
    date: "2024-03-10",
    time: "7:00 AM",
    location: "Yoga Hall",
    description: "Learn traditional yoga practices and meditation techniques",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
    status: "past",
  },
  {
    id: 4,
    title: "Spiritual Retreat",
    date: "2024-02-25",
    time: "All Day",
    location: "Ashram Grounds",
    description: "A day-long spiritual retreat with meditation and satsang",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
    status: "past",
  },
];

export const galleryImages = [
  {
    id: 1,
    src: "/assets/gallery_images/1.png",
    category: "satsang",
    title: "Satsang Gathering",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800",
    category: "seva",
    title: "Annadan Seva",
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
    category: "yoga",
    title: "Yoga Session",
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
    category: "events",
    title: "Festival Celebration",
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800",
    category: "satsang",
    title: "Evening Aarti",
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800",
    category: "seva",
    title: "Community Service",
  },
  {
    id: 7,
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    category: "yoga",
    title: "Meditation Class",
  },
  {
    id: 8,
    src: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800",
    category: "events",
    title: "Special Program",
  },
];

export const testimonials = [
  {
    id: 1,
    name: "Rajesh Kumar",
    city: "Mumbai",
    message:
      "The ashram has transformed my life. Gurudev's teachings have brought peace and purpose to my existence.",
    rating: 5,
  },
  {
    id: 2,
    name: "Priya Sharma",
    city: "Delhi",
    message:
      "I am grateful for the Annadan Seva program. It's heartwarming to see so many families being fed daily.",
    rating: 5,
  },
  {
    id: 3,
    name: "Amit Patel",
    city: "Ahmedabad",
    message:
      "The spiritual atmosphere here is divine. Every visit fills my heart with joy and gratitude.",
    rating: 5,
  },
  {
    id: 4,
    name: "Sunita Devi",
    city: "Bangalore",
    message:
      "Gurudev's wisdom has guided me through difficult times. This place is truly blessed.",
    rating: 5,
  },
];

// Icon components for donation causes
export const donationIcons = {
  annadan: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM8.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v.75c0 .621-.504 1.125-1.125 1.125h-5.25A1.125 1.125 0 018.25 9.375v-.75zm0 3.75c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-3.75z"/></svg>`,
  education: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.948 49.948 0 0 0-9.902 3.912l-.003.002c-.114.06-.227.119-.34.18a.75.75 0 0 1-.707 0A50.88 50.88 0 0 0 7.5 12.173v-.224c0-.131.067-.248.172-.311a54.615 54.615 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.123 56.123 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z"/><path d="M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.284a.75.75 0 0 1-.46.711 47.87 47.87 0 0 0-8.105 4.342.75.75 0 0 1-.832 0 47.87 47.87 0 0 0-8.104-4.342.75.75 0 0 1-.461-.71c.035-1.442.121-2.87.255-4.286a48.4 48.4 0 0 1 7.667 3.282 49.518 49.518 0 0 1 2.119.927Z"/><path d="M2.57 10.43a.75.75 0 0 1 .787-.693l.098.007a48.68 48.68 0 0 1 4.078.757.75.75 0 0 1-.36 1.456 47.18 47.18 0 0 0-3.963-.735v4.149a.75.75 0 0 1-1.5 0v-4.162a.75.75 0 0 1 .86-.779Z"/></svg>`,
  medical: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd"/></svg>`,
  infrastructure: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z"/><path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z"/></svg>`,
  maintenance: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M12 6.75a5.25 5.25 0 0 1 6.775-5.025.75.75 0 0 1 .313 1.248l-3.32 3.319c.063.475.276.934.641 1.299.365.365.824.578 1.3.64l3.318-3.319a.75.75 0 0 1 1.248.313 5.25 5.25 0 0 1-5.472 6.756c-1.018-.086-1.87.1-2.309.634L7.344 21.3A3.298 3.298 0 1 1 2.7 16.657l8.684-7.151c.533-.44.72-1.291.634-2.309A5.342 5.342 0 0 1 12 6.75ZM4.117 19.125a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Z" clip-rule="evenodd"/></svg>`,
  goushala: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5.5C3 4.12 4.12 3 5.5 3h2C8.88 3 10 4.12 10 5.5V7h4V5.5C14 4.12 15.12 3 16.5 3h2C19.88 3 21 4.12 21 5.5V8c0 .55-.45 1-1 1h-1v2.07c1.77.77 3 2.53 3 4.59v3c0 1.1-.9 2-2 2h-1v1h-2v-1H7v1H5v-1H4c-1.1 0-2-.9-2-2v-3c0-2.06 1.23-3.82 3-4.59V9H4c-.55 0-1-.45-1-1V5.5zM7 9h10v2.26c-.65.24-1.24.6-1.74 1.06-.73.67-1.26 1.56-1.49 2.56-.06.27-.1.55-.12.84-.01.19-.02.38-.01.57V17H10.35v-.72c.02-.18 0-.36-.01-.56-.02-.29-.06-.57-.12-.84-.23-1-.76-1.89-1.49-2.56-.5-.46-1.09-.82-1.74-1.06V9z"/></svg>`,
  anath: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z"/></svg>`,
  general: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z"/></svg>`,
};

export const donationHeads = [
  {
    id: 1,
    name: "Annadan Seva",
    description: "Feed the needy",
    image: "/assets/Brochure/Annadan/1.JPG",
    icon: "annadan",
    subCauses: [
      { id: "annadan-nithya", name: "Nithya Annadhan Seva" },
      { id: "annadan-aajeevan", name: "Aajeevan Svasat Daan" },
    ],
  },
  {
    id: 2,
    name: "Education",
    description: "Support children's education",
    image: "/assets/Brochure/Shri Gurudev Vidhyalay/1.jpg",
    icon: "education",
  },
  {
    id: 3,
    name: "Medical Seva",
    description: "Healthcare for the underprivileged",
    image: "/assets/Brochure/Adivasi/Medical Camp.jpg",
    icon: "medical",
  },
  {
    id: 4,
    name: "Ashram Nirman",
    description: "Building and infrastructure development",
    image: "/assets/Brochure/Vaishanvi Mata/Vaishanvi Temple_.png",
    icon: "infrastructure",
    minAmount: 5000,
  },
  {
    id: 5,
    name: "Ashram Seva",
    description: "Daily maintenance and upkeep",
    image: "/assets/Home_Page.JPG",
    icon: "maintenance",
  },
  {
    id: 6,
    name: "Goushala Seva",
    description: "Care for cows and cattle",
    image: "/assets/Brochure/Goushala/1.jpeg",
    icon: "goushala",
  },
  {
    id: 7,
    name: "Anath Seva",
    description: "Support for orphans",
    image: "/assets/Brochure/Anath/1.JPG",
    icon: "anath",
  },
  {
    id: 8,
    name: "General Seva",
    description: "General welfare activities",
    image: "/assets/Brochure/Seva Tirth/01.jpg",
    icon: "general",
  },
];

export const presetAmounts = [100, 500, 1000, 2500, 5000, 10000];

export const recentDonors = [
  {
    id: 1,
    name: "Anonymous",
    city: "Mumbai",
    amount: 5000,
    date: "2024-03-12",
  },
  { id: 2, name: "Rajesh K.", city: "Delhi", amount: 1000, date: "2024-03-12" },
  {
    id: 3,
    name: "Priya S.",
    city: "Bangalore",
    amount: 2500,
    date: "2024-03-11",
  },
  {
    id: 4,
    name: "Amit P.",
    city: "Ahmedabad",
    amount: 500,
    date: "2024-03-11",
  },
  { id: 5, name: "Sunita D.", city: "Pune", amount: 10000, date: "2024-03-10" },
  {
    id: 6,
    name: "Kumar M.",
    city: "Chennai",
    amount: 2000,
    date: "2024-03-10",
  },
  {
    id: 7,
    name: "Anonymous",
    city: "Hyderabad",
    amount: 1500,
    date: "2024-03-09",
  },
  {
    id: 8,
    name: "Lakshmi R.",
    city: "Kolkata",
    amount: 3000,
    date: "2024-03-09",
  },
];

// Top donors - sorted by total contribution
export const topDonors = [
  { id: 1, name: "Shri Ramesh Agarwal", totalAmount: 500000, donations: 12 },
  { id: 2, name: "Smt. Kamala Devi", totalAmount: 350000, donations: 8 },
  { id: 3, name: "Shri Vijay Sharma", totalAmount: 250000, donations: 15 },
  { id: 4, name: "Shri Suresh Patel", totalAmount: 200000, donations: 6 },
  {
    id: 5,
    name: "Smt. Lata Mangeshkar Trust",
    totalAmount: 175000,
    donations: 4,
  },
  { id: 6, name: "Shri Manoj Kumar", totalAmount: 150000, donations: 10 },
  { id: 7, name: "Anonymous Devotee", totalAmount: 125000, donations: 3 },
  { id: 8, name: "Shri Prakash Jain", totalAmount: 100000, donations: 7 },
];

export const products = [
  {
    id: 1,
    name: "Spiritual Book Collection",
    price: 299,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600",
    category: "books",
    description: "A collection of spiritual teachings and wisdom from Gurudev",
    stock: 50,
  },
  {
    id: 2,
    name: "Rudraksha Mala",
    price: 599,
    image: "",
    category: "accessories",
    description: "Authentic Rudraksha mala for meditation and prayer",
    stock: 30,
  },
  {
    id: 3,
    name: "Incense Sticks Pack",
    price: 149,
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600",
    category: "puja",
    description: "Premium quality incense sticks for daily worship",
    stock: 100,
  },
  {
    id: 4,
    name: "Brass Aarti Lamp",
    price: 899,
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600",
    category: "puja",
    description: "Beautiful handcrafted brass lamp for aarti",
    stock: 20,
  },
  {
    id: 5,
    name: "Yoga Mat",
    price: 799,
    image: "https://images.unsplash.com/photo-1601925260368-ae2f83d02f78?w=600",
    category: "accessories",
    description: "Premium quality non-slip yoga mat",
    stock: 40,
  },
  {
    id: 6,
    name: "Bhajan CD Set",
    price: 199,
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600",
    category: "media",
    description: "Collection of devotional bhajans and chants",
    stock: 60,
  },
];

export const productCategories = [
  { id: "all", name: "All Products" },
  { id: "books", name: "Books" },
  { id: "accessories", name: "Accessories" },
  { id: "puja", name: "Puja Items" },
  { id: "media", name: "Media" },
];
