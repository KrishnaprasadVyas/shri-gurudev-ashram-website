// Dummy data for the entire application

export const announcements = [
  {
    id: 1,
    text: "Special Satsang Program on 15th March - All devotees welcome!",
    type: "event"
  },
  {
    id: 2,
    text: "Annadan Seva: Feed 1000 families this month - Support our cause",
    type: "donation"
  },
  {
    id: 3,
    text: "New spiritual books now available in our shop",
    type: "shop"
  }
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
        description: "Devotional programs and celebrations on Lord Krishna's birth."
      },
      {
        id: "holi",
        title: "Holi",
        description: "Colorful Holi celebrations with community participation."
      },
      {
        id: "diwali",
        title: "Diwali",
        description: "Festival of lights and special aartis and bhajans."
      },
      {
        id: "rakshabandhan",
        title: "Rakshabandhan",
        description: "Sibling bonding festival programs and rituals."
      }
    ]
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
        points: ["Daily meal distribution", "Special festival distributions"]
      }
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
        description: ""
      },
      {
        id: "morning-aarti",
        title: "Daily Morning Aarti 6am",
        description: ""
      },
      {
        id: "kakda-aarti",
        title: "Kakda Aarti 4am",
        description: ""
      },
      {
        id: "haripath",
        title: "Haripath (6 pm)",
        description: ""
      }
    ]
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
        description: ""
      },
      {
        id: "ram-katha",
        title: "Ram katha",
        description: ""
      },
      {
        id: "hari-kala",
        title: "Hari kala kirtan",
        description: ""
      }
    ]
  }
];

export const events = [
  {
    id: 1,
    title: "Maha Satsang with Gurudev",
    date: "2024-03-15",
    time: "6:00 PM",
    location: "Main Hall",
    description: "A special spiritual gathering with Gurudev's divine discourse",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    status: "upcoming"
  },
  {
    id: 2,
    title: "Annadan Seva Program",
    date: "2024-03-20",
    time: "10:00 AM",
    location: "Community Hall",
    description: "Join us in feeding 1000 families. Volunteers welcome!",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800",
    status: "upcoming"
  },
  {
    id: 3,
    title: "Yoga Workshop",
    date: "2024-03-10",
    time: "7:00 AM",
    location: "Yoga Hall",
    description: "Learn traditional yoga practices and meditation techniques",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
    status: "past"
  },
  {
    id: 4,
    title: "Spiritual Retreat",
    date: "2024-02-25",
    time: "All Day",
    location: "Ashram Grounds",
    description: "A day-long spiritual retreat with meditation and satsang",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
    status: "past"
  }
];

export const galleryImages = [
  {
    id: 1,
    src: "/assets/gallery_images/1.png",
    category: "satsang",
    title: "Satsang Gathering"
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800",
    category: "seva",
    title: "Annadan Seva"
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
    category: "yoga",
    title: "Yoga Session"
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
    category: "events",
    title: "Festival Celebration"
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800",
    category: "satsang",
    title: "Evening Aarti"
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800",
    category: "seva",
    title: "Community Service"
  },
  {
    id: 7,
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    category: "yoga",
    title: "Meditation Class"
  },
  {
    id: 8,
    src: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800",
    category: "events",
    title: "Special Program"
  }
];

export const testimonials = [
  {
    id: 1,
    name: "Rajesh Kumar",
    city: "Mumbai",
    message: "The ashram has transformed my life. Gurudev's teachings have brought peace and purpose to my existence.",
    rating: 5
  },
  {
    id: 2,
    name: "Priya Sharma",
    city: "Delhi",
    message: "I am grateful for the Annadan Seva program. It's heartwarming to see so many families being fed daily.",
    rating: 5
  },
  {
    id: 3,
    name: "Amit Patel",
    city: "Ahmedabad",
    message: "The spiritual atmosphere here is divine. Every visit fills my heart with joy and gratitude.",
    rating: 5
  },
  {
    id: 4,
    name: "Sunita Devi",
    city: "Bangalore",
    message: "Gurudev's wisdom has guided me through difficult times. This place is truly blessed.",
    rating: 5
  }
];

export const donationHeads = [
  { id: 1, name: "Annadan Seva", description: "Feed the needy", icon: "" },
  { id: 2, name: "Education", description: "Support children's education", icon: "" },
  { id: 3, name: "Medical Aid", description: "Healthcare for the underprivileged", icon: "" },
  { id: 4, name: "Ashram Development", description: "Infrastructure and maintenance", icon: "" },
  { id: 5, name: "General Seva", description: "General welfare activities", icon: "" }
];

export const presetAmounts = [100, 500, 1000, 2500, 5000, 10000];

export const recentDonors = [
  { id: 1, name: "Anonymous", city: "Mumbai", amount: 5000, date: "2024-03-12" },
  { id: 2, name: "Rajesh K.", city: "Delhi", amount: 1000, date: "2024-03-12" },
  { id: 3, name: "Priya S.", city: "Bangalore", amount: 2500, date: "2024-03-11" },
  { id: 4, name: "Amit P.", city: "Ahmedabad", amount: 500, date: "2024-03-11" },
  { id: 5, name: "Sunita D.", city: "Pune", amount: 10000, date: "2024-03-10" },
  { id: 6, name: "Kumar M.", city: "Chennai", amount: 2000, date: "2024-03-10" },
  { id: 7, name: "Anonymous", city: "Hyderabad", amount: 1500, date: "2024-03-09" },
  { id: 8, name: "Lakshmi R.", city: "Kolkata", amount: 3000, date: "2024-03-09" }
];

export const products = [
  {
    id: 1,
    name: "Spiritual Book Collection",
    price: 299,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600",
    category: "books",
    description: "A collection of spiritual teachings and wisdom from Gurudev",
    stock: 50
  },
  {
    id: 2,
    name: "Rudraksha Mala",
    price: 599,
    image: "",
    category: "accessories",
    description: "Authentic Rudraksha mala for meditation and prayer",
    stock: 30
  },
  {
    id: 3,
    name: "Incense Sticks Pack",
    price: 149,
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600",
    category: "puja",
    description: "Premium quality incense sticks for daily worship",
    stock: 100
  },
  {
    id: 4,
    name: "Brass Aarti Lamp",
    price: 899,
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600",
    category: "puja",
    description: "Beautiful handcrafted brass lamp for aarti",
    stock: 20
  },
  {
    id: 5,
    name: "Yoga Mat",
    price: 799,
    image: "https://images.unsplash.com/photo-1601925260368-ae2f83d02f78?w=600",
    category: "accessories",
    description: "Premium quality non-slip yoga mat",
    stock: 40
  },
  {
    id: 6,
    name: "Bhajan CD Set",
    price: 199,
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600",
    category: "media",
    description: "Collection of devotional bhajans and chants",
    stock: 60
  }
];

export const productCategories = [
  { id: "all", name: "All Products" },
  { id: "books", name: "Books" },
  { id: "accessories", name: "Accessories" },
  { id: "puja", name: "Puja Items" },
  { id: "media", name: "Media" }
];

