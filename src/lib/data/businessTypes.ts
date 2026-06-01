export type BusinessType = {
  value: string;
  label: string;
  category: string;
};

export const businessTypes: BusinessType[] = [
  // ===== Food & Drink =====
  { value: "restaurant", label: "Restaurant", category: "Food & Drink" },
  { value: "cafe", label: "Cafe", category: "Food & Drink" },
  { value: "bar", label: "Bar", category: "Food & Drink" },
  { value: "bakery", label: "Bakery", category: "Food & Drink" },
  { value: "pizza restaurant", label: "Pizza Place", category: "Food & Drink" },
  { value: "sushi restaurant", label: "Sushi Restaurant", category: "Food & Drink" },
  { value: "fast food restaurant", label: "Fast Food", category: "Food & Drink" },
  { value: "ice cream shop", label: "Ice Cream Shop", category: "Food & Drink" },
  { value: "juice bar", label: "Juice Bar", category: "Food & Drink" },
  { value: "food truck", label: "Food Truck", category: "Food & Drink" },

  // ===== Health & Medical =====
  { value: "dentist", label: "Dental Clinic", category: "Health & Medical" },
  { value: "doctor", label: "Doctor / GP", category: "Health & Medical" },
  { value: "pharmacy", label: "Pharmacy", category: "Health & Medical" },
  { value: "physiotherapist", label: "Physiotherapist", category: "Health & Medical" },
  { value: "optician", label: "Optician", category: "Health & Medical" },
  { value: "veterinarian", label: "Vet / Animal Clinic", category: "Health & Medical" },
  { value: "chiropractor", label: "Chiropractor", category: "Health & Medical" },
  { value: "mental health clinic", label: "Mental Health Clinic", category: "Health & Medical" },
  { value: "dermatologist", label: "Dermatologist", category: "Health & Medical" },

  // ===== Beauty & Wellness =====
  { value: "hair salon", label: "Hair Salon", category: "Beauty & Wellness" },
  { value: "barbershop", label: "Barbershop", category: "Beauty & Wellness" },
  { value: "nail salon", label: "Nail Salon", category: "Beauty & Wellness" },
  { value: "spa", label: "Spa", category: "Beauty & Wellness" },
  { value: "massage therapy", label: "Massage Therapy", category: "Beauty & Wellness" },
  { value: "tattoo shop", label: "Tattoo Studio", category: "Beauty & Wellness" },
  { value: "tanning salon", label: "Tanning Salon", category: "Beauty & Wellness" },
  { value: "eyebrow threading", label: "Eyebrow Threading", category: "Beauty & Wellness" },

  // ===== Fitness =====
  { value: "gym", label: "Gym", category: "Fitness" },
  { value: "yoga studio", label: "Yoga Studio", category: "Fitness" },
  { value: "pilates studio", label: "Pilates Studio", category: "Fitness" },
  { value: "crossfit gym", label: "CrossFit", category: "Fitness" },
  { value: "martial arts school", label: "Martial Arts", category: "Fitness" },
  { value: "dance studio", label: "Dance Studio", category: "Fitness" },
  { value: "swimming pool", label: "Swimming Pool", category: "Fitness" },

  // ===== Retail =====
  { value: "clothing store", label: "Clothing Store", category: "Retail" },
  { value: "electronics store", label: "Electronics Store", category: "Retail" },
  { value: "furniture store", label: "Furniture Store", category: "Retail" },
  { value: "jewelry store", label: "Jewelry Store", category: "Retail" },
  { value: "bookstore", label: "Bookstore", category: "Retail" },
  { value: "toy store", label: "Toy Store", category: "Retail" },
  { value: "pet store", label: "Pet Store", category: "Retail" },
  { value: "supermarket", label: "Supermarket", category: "Retail" },
  { value: "florist", label: "Florist", category: "Retail" },
  { value: "gift shop", label: "Gift Shop", category: "Retail" },

  // ===== Home Services =====
  { value: "plumber", label: "Plumber", category: "Home Services" },
  { value: "electrician", label: "Electrician", category: "Home Services" },
  { value: "cleaning service", label: "Cleaning Service", category: "Home Services" },
  { value: "interior designer", label: "Interior Designer", category: "Home Services" },
  { value: "painter", label: "Painter", category: "Home Services" },
  { value: "landscaping", label: "Landscaping", category: "Home Services" },
  { value: "pest control", label: "Pest Control", category: "Home Services" },
  { value: "locksmith", label: "Locksmith", category: "Home Services" },
  { value: "roofing contractor", label: "Roofing", category: "Home Services" },

  // ===== Professional Services =====
  { value: "lawyer", label: "Law Firm", category: "Professional Services" },
  { value: "accountant", label: "Accountant / CPA", category: "Professional Services" },
  { value: "real estate agency", label: "Real Estate Agency", category: "Professional Services" },
  { value: "insurance agency", label: "Insurance Agency", category: "Professional Services" },
  { value: "financial advisor", label: "Financial Advisor", category: "Professional Services" },
  { value: "marketing agency", label: "Marketing Agency", category: "Professional Services" },
  { value: "travel agency", label: "Travel Agency", category: "Professional Services" },
  { value: "photographer", label: "Photography Studio", category: "Professional Services" },
  { value: "printing service", label: "Print Shop", category: "Professional Services" },

  // ===== Automotive =====
  { value: "car dealer", label: "Car Dealership", category: "Automotive" },
  { value: "auto repair shop", label: "Auto Repair", category: "Automotive" },
  { value: "car wash", label: "Car Wash", category: "Automotive" },
  { value: "tire shop", label: "Tire Shop", category: "Automotive" },
  { value: "auto parts store", label: "Auto Parts", category: "Automotive" },
  { value: "motorcycle dealer", label: "Motorcycle Dealer", category: "Automotive" },
  { value: "car detailing", label: "Car Detailing", category: "Automotive" },

  // ===== Education =====
  { value: "tutoring center", label: "Tutoring Center", category: "Education" },
  { value: "driving school", label: "Driving School", category: "Education" },
  { value: "language school", label: "Language School", category: "Education" },
  { value: "music school", label: "Music School", category: "Education" },
  { value: "art school", label: "Art School", category: "Education" },
  { value: "preschool", label: "Preschool / Nursery", category: "Education" },

  // ===== Hospitality =====
  { value: "hotel", label: "Hotel", category: "Hospitality" },
  { value: "hostel", label: "Hostel", category: "Hospitality" },
  { value: "bed and breakfast", label: "B&B", category: "Hospitality" },
  { value: "event venue", label: "Event Venue", category: "Hospitality" },
  { value: "wedding venue", label: "Wedding Venue", category: "Hospitality" },

  // ===== Entertainment =====
  { value: "nightclub", label: "Nightclub", category: "Entertainment" },
  { value: "movie theater", label: "Cinema", category: "Entertainment" },
  { value: "bowling alley", label: "Bowling Alley", category: "Entertainment" },
  { value: "escape room", label: "Escape Room", category: "Entertainment" },
  { value: "arcade", label: "Arcade", category: "Entertainment" },
  { value: "karaoke bar", label: "Karaoke", category: "Entertainment" },
];

export const businessCategories = [...new Set(businessTypes.map((b) => b.category))];
