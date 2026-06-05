/**
 * Maps Nearsited business_type values to Google Places Nearby Search `type` values.
 * Google Places supported types: https://developers.google.com/maps/documentation/places/web-service/supported-types
 */
export const BUSINESS_TYPE_TO_PLACES_TYPE: Record<string, string> = {
  // Food & Drink
  restaurant: "restaurant",
  cafe: "cafe",
  bar: "bar",
  bakery: "bakery",
  "pizza restaurant": "restaurant",
  "sushi restaurant": "restaurant",
  "fast food restaurant": "meal_takeaway",
  "ice cream shop": "ice_cream",
  "juice bar": "cafe",
  "food truck": "meal_takeaway",

  // Health & Medical
  dentist: "dentist",
  doctor: "doctor",
  pharmacy: "pharmacy",
  physiotherapist: "physiotherapist",
  optician: "optician",
  veterinarian: "veterinary_care",
  chiropractor: "doctor",
  "mental health clinic": "doctor",
  dermatologist: "doctor",

  // Beauty & Wellness
  "hair salon": "hair_care",
  barbershop: "hair_care",
  "nail salon": "beauty_salon",
  spa: "spa",
  "massage therapy": "spa",
  "tattoo shop": "beauty_salon",
  "tanning salon": "beauty_salon",
  "eyebrow threading": "beauty_salon",

  // Fitness
  gym: "gym",
  "yoga studio": "gym",
  "pilates studio": "gym",
  "crossfit gym": "gym",
  "martial arts school": "gym",
  "dance studio": "gym",
  "swimming pool": "gym",

  // Retail
  "clothing store": "clothing_store",
  "electronics store": "electronics_store",
  "furniture store": "furniture_store",
  "jewelry store": "jewelry_store",
  bookstore: "book_store",
  "toy store": "store",
  "pet store": "pet_store",
  supermarket: "supermarket",
  florist: "florist",
  "gift shop": "store",

  // Home Services
  plumber: "plumber",
  electrician: "electrician",
  "cleaning service": "general_contractor",
  "interior designer": "interior_goods",
  painter: "painter",
  landscaping: "landscaping",
  "pest control": "general_contractor",
  locksmith: "locksmith",
  "roofing contractor": "roofing_contractor",

  // Professional Services
  lawyer: "lawyer",
  accountant: "accounting",
  "real estate agency": "real_estate_agency",
  "insurance agency": "insurance_agency",
  "financial advisor": "finance",
  "marketing agency": "advertising",
  "travel agency": "travel_agency",
  photographer: "photographer",
  "printing service": "printing",

  // Automotive
  "car dealer": "car_dealer",
  "auto repair shop": "car_repair",
  "car wash": "car_wash",
  "tire shop": "car_repair",
  "auto parts store": "auto_parts_store",
  "motorcycle dealer": "motorcycle_dealer",
  "car detailing": "car_repair",

  // Education
  "tutoring center": "school",
  "driving school": "school",
  "language school": "school",
  "music school": "school",
  "art school": "school",
  preschool: "school",

  // Hospitality
  hotel: "lodging",
  hostel: "lodging",
  "bed and breakfast": "lodging",
  "event venue": "banquet_hall",
  "wedding venue": "banquet_hall",

  // Entertainment
  nightclub: "night_club",
  "movie theater": "movie_theater",
  "bowling alley": "bowling_alley",
  "escape room": "amusement_center",
  arcade: "amusement_center",
  "karaoke bar": "night_club",
};
