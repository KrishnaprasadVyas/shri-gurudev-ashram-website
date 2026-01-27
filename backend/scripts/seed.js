/**
 * DATABASE SEED SCRIPT
 * Migrates frontend dummy data to MongoDB
 *
 * USAGE:
 *   node scripts/seed.js           - Seeds all data
 *   node scripts/seed.js --reset   - Drops existing data and reseeds
 *   node scripts/seed.js --only=announcements,events  - Seeds specific collections
 *
 * IMPORTANT:
 * - Run this ONCE during initial deployment
 * - After seeding, all data should be managed via admin APIs
 * - This script is idempotent (won't duplicate data if run multiple times)
 */

require("dotenv").config({
  path: require("path").join(__dirname, "../.env.local"),
});
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");

// Models
const Announcement = require("../src/models/Announcement");
const Activity = require("../src/models/Activity");
const Event = require("../src/models/Event");
const GalleryCategory = require("../src/models/GalleryCategory");
const Testimonial = require("../src/models/Testimonial");
const DonationHead = require("../src/models/DonationHead");
const Product = require("../src/models/Product");
const ProductCategory = require("../src/models/ProductCategory");

// ==================== SEED DATA ====================
// Migrated from frontend/src/data/dummyData.js and brochureData.js

const announcementsData = [
  {
    text: "Special Satsang Program on 15th March - All devotees welcome!",
    type: "event",
    isActive: true,
    priority: 10,
  },
  {
    text: "Annadan Seva: Feed 1000 families this month - Support our cause",
    type: "donation",
    isActive: true,
    priority: 5,
  },
  {
    text: "Online shop coming soon. Stay tuned!",
    type: "info",
    isActive: true,
    priority: 1,
  },
];

const activitiesData = [
  {
    title: "Festival Celebration",
    description: "Celebrations and special programs for major festivals.",
    iconKey: "festival",
    category: "spiritual",
    order: 1,
    isVisible: true,
    subitems: [
      {
        key: "janmashtami",
        title: "Janmashtami",
        description:
          "Devotional programs and celebrations on Lord Krishna's birth.",
        order: 0,
        isVisible: true,
      },
      {
        key: "holi",
        title: "Holi",
        description: "Colorful Holi celebrations with community participation.",
        order: 1,
        isVisible: true,
      },
      {
        key: "diwali",
        title: "Diwali",
        description: "Festival of lights and special aartis and bhajans.",
        order: 2,
        isVisible: true,
      },
      {
        key: "rakshabandhan",
        title: "Rakshabandhan",
        description: "Sibling bonding festival programs and rituals.",
        order: 3,
        isVisible: true,
      },
    ],
  },
  {
    title: "Annadan Seva",
    description: "Feeding the needy and underprivileged families",
    iconKey: "food",
    category: "social",
    order: 2,
    isVisible: true,
    subitems: [
      {
        key: "annadan-overview",
        title: "Annadan Seva",
        description: "Feeding drives and schedules for supporting families.",
        points: ["Daily meal distribution", "Special festival distributions"],
        order: 0,
        isVisible: true,
      },
    ],
  },
  {
    title: "Daily Routine",
    description: "Regular daily schedule and aartis.",
    iconKey: "schedule",
    category: "spiritual",
    order: 3,
    isVisible: true,
    subitems: [
      {
        key: "daily-annadan",
        title: "Daily Annadan",
        description: "",
        order: 0,
        isVisible: true,
      },
      {
        key: "morning-aarti",
        title: "Daily Morning Aarti 6am",
        description: "",
        order: 1,
        isVisible: true,
      },
      {
        key: "kakda-aarti",
        title: "Kakda Aarti 4am",
        description: "",
        order: 2,
        isVisible: true,
      },
      {
        key: "haripath",
        title: "Haripath (6 pm)",
        description: "",
        order: 3,
        isVisible: true,
      },
    ],
  },
  {
    title: "Gurudev Programs",
    description: "Special spiritual programs led by Gurudev.",
    iconKey: "spiritual",
    category: "spiritual",
    order: 4,
    isVisible: true,
    subitems: [
      {
        key: "shrimad-bhagwat",
        title: "Shrimad Bhagwat Katha",
        description: "",
        order: 0,
        isVisible: true,
      },
      {
        key: "ram-katha",
        title: "Ram Katha",
        description: "",
        order: 1,
        isVisible: true,
      },
      {
        key: "hari-kala",
        title: "Hari Kala Kirtan",
        description: "",
        order: 2,
        isVisible: true,
      },
    ],
  },
];

const eventsData = [
  {
    title: "Maha Satsang with Gurudev",
    date: new Date("2026-03-15"),
    time: "6:00 PM",
    location: "Main Hall",
    description:
      "A special spiritual gathering with Gurudev's divine discourse",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    status: "upcoming",
    isPublished: true,
    isFeatured: true,
  },
  {
    title: "Annadan Seva Program",
    date: new Date("2026-03-20"),
    time: "10:00 AM",
    location: "Community Hall",
    description: "Join us in feeding 1000 families. Volunteers welcome!",
    imageUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800",
    status: "upcoming",
    isPublished: true,
    isFeatured: false,
  },
  {
    title: "Yoga Workshop",
    date: new Date("2025-03-10"),
    time: "7:00 AM",
    location: "Yoga Hall",
    description: "Learn traditional yoga practices and meditation techniques",
    imageUrl:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
    status: "past",
    isPublished: true,
    isFeatured: false,
  },
  {
    title: "Spiritual Retreat",
    date: new Date("2025-02-25"),
    time: "All Day",
    location: "Ashram Grounds",
    description: "A day-long spiritual retreat with meditation and satsang",
    imageUrl:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
    status: "past",
    isPublished: true,
    isFeatured: false,
  },
];

const testimonialsData = [
  {
    name: "Rajesh Kumar",
    city: "Mumbai",
    message:
      "The ashram has transformed my life. Gurudev's teachings have brought peace and purpose to my existence.",
    rating: 5,
    isApproved: true,
    isFeatured: true,
    order: 0,
  },
  {
    name: "Priya Sharma",
    city: "Delhi",
    message:
      "I am grateful for the Annadan Seva program. It's heartwarming to see so many families being fed daily.",
    rating: 5,
    isApproved: true,
    isFeatured: true,
    order: 1,
  },
  {
    name: "Amit Patel",
    city: "Ahmedabad",
    message:
      "The spiritual atmosphere here is divine. Every visit fills my heart with joy and gratitude.",
    rating: 5,
    isApproved: true,
    isFeatured: false,
    order: 2,
  },
  {
    name: "Sunita Devi",
    city: "Bangalore",
    message:
      "Gurudev's wisdom has guided me through difficult times. This place is truly blessed.",
    rating: 5,
    isApproved: true,
    isFeatured: false,
    order: 3,
  },
];

const donationHeadsData = [
  {
    key: "annadan",
    name: "Annadan Seva",
    description: "Feed the needy",
    longDescription:
      "Annadan Seva is a sacred act of feeding the hungry. Your donation helps us provide nutritious meals to underprivileged families, orphans, and the elderly.",
    imageUrl: "/assets/Brochure/Annadan/1.JPG",
    iconKey: "annadan",
    order: 0,
    isActive: true,
    isFeatured: true,
    subCauses: [
      { key: "annadan-nithya", name: "Nithya Annadhan Seva", isActive: true },
      { key: "annadan-aajeevan", name: "Aajeevan Svasat Daan", isActive: true },
    ],
  },
  {
    key: "education",
    name: "Education",
    description: "Support children's education",
    longDescription:
      "Education is the foundation of a better future. Help us provide quality education, books, and supplies to underprivileged children.",
    imageUrl: "/assets/Brochure/Shri Gurudev Vidhyalay/1.jpg",
    iconKey: "education",
    order: 1,
    isActive: true,
    isFeatured: true,
  },
  {
    key: "medical",
    name: "Medical Seva",
    description: "Healthcare for the underprivileged",
    longDescription:
      "Healthcare is a basic human right. Your donations help us organize medical camps and provide essential healthcare to those who cannot afford it.",
    imageUrl: "/assets/Brochure/Adivasi/Medical Camp.jpg",
    iconKey: "medical",
    order: 2,
    isActive: true,
    isFeatured: true,
  },
  {
    key: "ashram-nirman",
    name: "Ashram Nirman",
    description: "Building and infrastructure development",
    imageUrl: "/assets/Brochure/Vaishanvi Mata/Vaishanvi Temple_.png",
    iconKey: "infrastructure",
    minAmount: 5000,
    order: 3,
    isActive: true,
    isFeatured: false,
  },
  {
    key: "ashram-seva",
    name: "Ashram Seva",
    description: "Daily maintenance and upkeep",
    imageUrl: "/assets/Home_Page.JPG",
    iconKey: "maintenance",
    order: 4,
    isActive: true,
    isFeatured: false,
  },
  {
    key: "goushala",
    name: "Goushala Seva",
    description: "Care for cows and cattle",
    imageUrl: "/assets/Brochure/Goushala/1.jpeg",
    iconKey: "goushala",
    order: 5,
    isActive: true,
    isFeatured: true,
  },
  {
    key: "anath",
    name: "Anath Seva",
    description: "Support for orphans",
    imageUrl: "/assets/Brochure/Anath/1.JPG",
    iconKey: "anath",
    order: 6,
    isActive: true,
    isFeatured: false,
  },
  {
    key: "general",
    name: "General Seva",
    description: "General welfare activities",
    imageUrl: "/assets/Brochure/Seva Tirth/01.jpg",
    iconKey: "general",
    order: 7,
    isActive: true,
    isFeatured: false,
  },
];

const productCategoriesData = [
  { name: "All Products", slug: "all", order: 0, isVisible: true },
  { name: "Books", slug: "books", order: 1, isVisible: true },
  { name: "Accessories", slug: "accessories", order: 2, isVisible: true },
  { name: "Puja Items", slug: "puja", order: 3, isVisible: true },
  { name: "Media", slug: "media", order: 4, isVisible: true },
];

const galleryCategoriesData = [
  {
    name: "Adivasi",
    slug: "adivasi",
    order: 0,
    isVisible: true,
    images: [
      { url: "/assets/Brochure/Adivasi/0.JPG", order: 0 },
      { url: "/assets/Brochure/Adivasi/00.JPG", order: 1 },
      { url: "/assets/Brochure/Adivasi/1.JPG", order: 2 },
      { url: "/assets/Brochure/Adivasi/10.JPG", order: 3 },
      { url: "/assets/Brochure/Adivasi/11.JPG", order: 4 },
      { url: "/assets/Brochure/Adivasi/12.JPG", order: 5 },
      { url: "/assets/Brochure/Adivasi/2.jpg", order: 6 },
      { url: "/assets/Brochure/Adivasi/3.jpg", order: 7 },
      { url: "/assets/Brochure/Adivasi/4.JPG", order: 8 },
      { url: "/assets/Brochure/Adivasi/5.JPG", order: 9 },
      { url: "/assets/Brochure/Adivasi/6.JPG", order: 10 },
      { url: "/assets/Brochure/Adivasi/7.JPG", order: 11 },
      { url: "/assets/Brochure/Adivasi/8.JPG", order: 12 },
      { url: "/assets/Brochure/Adivasi/9.JPG", order: 13 },
      { url: "/assets/Brochure/Adivasi/IMG_1179.JPG", order: 14 },
      { url: "/assets/Brochure/Adivasi/Medical Camp.jpg", order: 15 },
    ],
  },
  {
    name: "Anath",
    slug: "anath",
    order: 1,
    isVisible: true,
    images: [
      { url: "/assets/Brochure/Anath/1.JPG", order: 0 },
      { url: "/assets/Brochure/Anath/2.jpg", order: 1 },
      { url: "/assets/Brochure/Anath/3.jpg", order: 2 },
      { url: "/assets/Brochure/Anath/4.jpg", order: 3 },
    ],
  },
  {
    name: "Annadan",
    slug: "annadan",
    order: 2,
    isVisible: true,
    images: [
      { url: "/assets/Brochure/Annadan/1.JPG", order: 0 },
      { url: "/assets/Brochure/Annadan/2.JPG", order: 1 },
      { url: "/assets/Brochure/Annadan/3.JPG", order: 2 },
    ],
  },
  {
    name: "Goushala",
    slug: "goushala",
    order: 3,
    isVisible: true,
    images: [
      { url: "/assets/Brochure/Goushala/1.jpeg", order: 0 },
      { url: "/assets/Brochure/Goushala/2.jpg", order: 1 },
      { url: "/assets/Brochure/Goushala/3.jpg", order: 2 },
    ],
  },
  {
    name: "Gurukul",
    slug: "gurukul",
    order: 4,
    isVisible: true,
    images: [
      { url: "/assets/Brochure/Gurukul/1.jpg", order: 0 },
      { url: "/assets/Brochure/Gurukul/2.jpg", order: 1 },
      { url: "/assets/Brochure/Gurukul/3.jpg", order: 2 },
    ],
  },
  {
    name: "Seva Tirth",
    slug: "seva-tirth",
    order: 5,
    isVisible: true,
    images: [
      { url: "/assets/Brochure/Seva Tirth/01.jpg", order: 0 },
      { url: "/assets/Brochure/Seva Tirth/1.JPG", order: 1 },
      { url: "/assets/Brochure/Seva Tirth/2.jpg", order: 2 },
      { url: "/assets/Brochure/Seva Tirth/IMG-20231027-WA0081.jpg", order: 3 },
    ],
  },
  {
    name: "Shri Gurudev Vidhyalay",
    slug: "shri-gurudev-vidhyalay",
    order: 6,
    isVisible: true,
    images: [
      { url: "/assets/Brochure/Shri Gurudev Vidhyalay/1.jpg", order: 0 },
      { url: "/assets/Brochure/Shri Gurudev Vidhyalay/2.jpg", order: 1 },
      { url: "/assets/Brochure/Shri Gurudev Vidhyalay/3.jpg", order: 2 },
      { url: "/assets/Brochure/Shri Gurudev Vidhyalay/4.jpg", order: 3 },
      { url: "/assets/Brochure/Shri Gurudev Vidhyalay/5.jpg", order: 4 },
    ],
  },
  {
    name: "Utsav",
    slug: "utsav",
    order: 7,
    isVisible: true,
    images: [
      { url: "/assets/Brochure/Utsav/1.JPG", order: 0 },
      { url: "/assets/Brochure/Utsav/2.JPG", order: 1 },
      { url: "/assets/Brochure/Utsav/3.JPG", order: 2 },
      { url: "/assets/Brochure/Utsav/4.JPG", order: 3 },
      { url: "/assets/Brochure/Utsav/5.JPG", order: 4 },
      { url: "/assets/Brochure/Utsav/6.JPG", order: 5 },
      { url: "/assets/Brochure/Utsav/7.JPG", order: 6 },
    ],
  },
  {
    name: "Vaishanvi Mata",
    slug: "vaishanvi-mata",
    order: 8,
    isVisible: true,
    images: [
      {
        url: "/assets/Brochure/Vaishanvi Mata/Vaishanvi Temple_.png",
        order: 0,
      },
    ],
  },
];

// ==================== SEED FUNCTIONS ====================

async function seedAnnouncements(reset = false) {
  console.log("📢 Seeding announcements...");

  if (reset) {
    await Announcement.deleteMany({});
  }

  const count = await Announcement.countDocuments();
  if (count > 0) {
    console.log(`   ⏭️  Skipped (${count} announcements already exist)`);
    return;
  }

  await Announcement.insertMany(announcementsData);
  console.log(`   ✅ Created ${announcementsData.length} announcements`);
}

async function seedActivities(reset = false) {
  console.log("🎯 Seeding activities...");

  if (reset) {
    await Activity.deleteMany({});
  }

  const count = await Activity.countDocuments();
  if (count > 0) {
    console.log(`   ⏭️  Skipped (${count} activities already exist)`);
    return;
  }

  await Activity.insertMany(activitiesData);
  console.log(`   ✅ Created ${activitiesData.length} activities`);
}

async function seedEvents(reset = false) {
  console.log("📅 Seeding events...");

  if (reset) {
    await Event.deleteMany({});
  }

  const count = await Event.countDocuments();
  if (count > 0) {
    console.log(`   ⏭️  Skipped (${count} events already exist)`);
    return;
  }

  await Event.insertMany(eventsData);
  console.log(`   ✅ Created ${eventsData.length} events`);
}

async function seedGallery(reset = false) {
  console.log("🖼️  Seeding gallery...");

  if (reset) {
    await GalleryCategory.deleteMany({});
  }

  const count = await GalleryCategory.countDocuments();

  if (count > 0) {
    console.log(`   ⏭️  Skipped (${count} gallery categories already exist)`);
    return;
  }

  await GalleryCategory.insertMany(galleryCategoriesData);
  console.log(
    `   ✅ Created ${galleryCategoriesData.length} gallery categories`,
  );
}

async function seedTestimonials(reset = false) {
  console.log("💬 Seeding testimonials...");

  if (reset) {
    await Testimonial.deleteMany({});
  }

  const count = await Testimonial.countDocuments();
  if (count > 0) {
    console.log(`   ⏭️  Skipped (${count} testimonials already exist)`);
    return;
  }

  await Testimonial.insertMany(testimonialsData);
  console.log(`   ✅ Created ${testimonialsData.length} testimonials`);
}

async function seedDonationHeads(reset = false) {
  console.log("🎁 Seeding donation heads...");

  if (reset) {
    await DonationHead.deleteMany({});
  }

  const count = await DonationHead.countDocuments();
  if (count > 0) {
    console.log(`   ⏭️  Skipped (${count} donation heads already exist)`);
    return;
  }

  await DonationHead.insertMany(donationHeadsData);
  console.log(`   ✅ Created ${donationHeadsData.length} donation heads`);
}

async function seedProductCategories(reset = false) {
  console.log("🏷️  Seeding product categories...");

  if (reset) {
    await ProductCategory.deleteMany({});
  }

  const count = await ProductCategory.countDocuments();
  if (count > 0) {
    console.log(`   ⏭️  Skipped (${count} product categories already exist)`);
    return;
  }

  await ProductCategory.insertMany(productCategoriesData);
  console.log(
    `   ✅ Created ${productCategoriesData.length} product categories`,
  );
}

// ==================== MAIN EXECUTION ====================

async function seed() {
  const args = process.argv.slice(2);
  const reset = args.includes("--reset");
  const onlyArg = args.find((a) => a.startsWith("--only="));
  const onlyCollections = onlyArg
    ? onlyArg.replace("--only=", "").split(",")
    : null;

  console.log("\n🌱 DATABASE SEED SCRIPT");
  console.log("========================");

  if (reset) {
    console.log("⚠️  RESET MODE: Existing data will be deleted\n");
  }

  if (onlyCollections) {
    console.log(`📋 Seeding only: ${onlyCollections.join(", ")}\n`);
  }

  try {
    await connectDB();
    console.log("✅ Connected to MongoDB\n");

    const seedMap = {
      announcements: seedAnnouncements,
      activities: seedActivities,
      events: seedEvents,
      gallery: seedGallery,
      testimonials: seedTestimonials,
      "donation-heads": seedDonationHeads,
      "product-categories": seedProductCategories,
    };

    const collectionsToSeed = onlyCollections || Object.keys(seedMap);

    for (const collection of collectionsToSeed) {
      if (seedMap[collection]) {
        await seedMap[collection](reset);
      } else {
        console.log(`⚠️  Unknown collection: ${collection}`);
      }
    }

    console.log("\n✅ Seed completed successfully!\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
