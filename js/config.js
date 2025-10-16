/**
 * AI Product Generator Pro - Configuration
 * All your API keys and settings in one place
 */

const CONFIG = {
  // ========================================
  // AI & IMAGE SERVICES (Already Configured)
  // ========================================
  GEMINI_API_KEY: "AIzaSyBH3Jqa1J231H1bHHVYOkxBsbNIAKxs7p4",
  GEMINI_API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent",
  
  IMGBB_API_KEY: "c6e60c5e34fc9fa54aeb9c605388beb5",
  IMGBB_API_URL: "https://api.imgbb.com/1/upload",
  
  // ========================================
  // WOOCOMMERCE (Already Configured)
  // ========================================
  WOO_URL: "https://farhashop.com",
  WOO_CONSUMER_KEY: "ck_aab52a81e7a2aa5bc4714323696f781c3b62c89b",
  WOO_CONSUMER_SECRET: "cs_a5fe650bd337aa30f1f358d86ba24bf6cacbfba4",

  // ========================================
  // SOCIAL (Facebook) - New
  // ========================================
  FACEBOOK: {
    // Replace after running the prompts below, or leave as-is and fill in the Social tab UI
    PAGE_ID: "723649720842554",
    PAGE_ACCESS_TOKEN: "EAApLV1Qy41ABPqkm8EEcXZCQVckn0ZBvZClrdWPtLO5WAvIcpfMnIZB5VhhEWchAOEjwFjaemwqBehZBlaJOeWYHFaxzcxIF6neZC7Hi892720aWMcE31N8Gv5n8y6GU0qyEkARgzo86l1ZAdk2UAGd1FUUoX5rmhTdrdX2wz3cEuhwNo2S9ZAPpOa4PzYkjiVAQSsQTr5KZA2HS5HFObeGv1bXPKIZA03RXmeLQZDZD"
  },
  
  // ========================================
  // CORS PROXIES (For API Calls)
  // ========================================
  PROXIES: [
    "", // Direct first
    "https://cors.isomorphic-git.org/",
    "https://corsproxy.io/?"
  ],
  
  // ========================================
  // USER SETTINGS
  // ========================================
  USER_LOGIN: "Zakriibrahim",
  
  // ========================================
  // BATCH PROCESSING SETTINGS
  // ========================================
  BATCH_LIMIT: 10,              // Products per batch
  BATCH_PAUSE_SECONDS: 30,      // Wait time between batches
  API_DELAY_MS: 900,            // Delay between AI calls
  
  // ========================================
  // QUALITY CHECK THRESHOLDS
  // ========================================
  QUALITY: {
    MIN_IMAGE_SIZE: 800,           // Minimum image dimension (px)
    MIN_DESCRIPTION_LENGTH: 50,    // Minimum description characters
    MAX_TITLE_LENGTH: 120,         // Maximum title characters
    MIN_TITLE_LENGTH: 10,          // Minimum title characters
    MIN_PRICE: 10,                 // Minimum price (MAD)
    MAX_PRICE: 999999,             // Maximum price (MAD)
    REQUIRE_CATEGORIES: true,      // Must have at least 1 category
    REQUIRE_IMAGES: true           // Must have at least 1 image
  },
  
  // ========================================
  // SUPPORTED LANGUAGES
  // ========================================
  LANGUAGES: {
    en: { name: "English", code: "en" },
    fr: { name: "Français", code: "fr" },
    ar: { name: "العربية", code: "ar", rtl: true }
  },
  
  // ========================================
  // DEFAULT TEMPLATES
  // ========================================
  DEFAULT_TEMPLATES: [
    {
      id: "tshirt",
      name: "T-Shirt",
      icon: "👕",
      attributes: [
        { name: "Color", options: ["Black", "White", "Red", "Blue"], variation: true },
        { name: "Size", options: ["S", "M", "L", "XL"], variation: true }
      ],
      priceModifier: {
        "Size": { "XL": 10, "XXL": 20 }
      }
    },
    {
      id: "shoes",
      name: "Shoes",
      icon: "👟",
      attributes: [
        { name: "Size", options: ["38", "39", "40", "41", "42", "43"], variation: true },
        { name: "Color", options: ["Black", "White", "Brown"], variation: true }
      ]
    },
    {
      id: "electronics",
      name: "Electronics",
      icon: "📱",
      attributes: [
        { name: "Color", options: ["Black", "Silver", "Gold"], variation: true }
      ]
    }
  ]
};

// Make config globally available
window.CONFIG = CONFIG;

console.log('✅ Configuration loaded for user:', CONFIG.USER_LOGIN);
