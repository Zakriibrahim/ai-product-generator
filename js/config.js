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
  // SOCIAL (Facebook) - Simplified
  // ========================================
  FACEBOOK: {
    PAGE_ID: "874049099120161",
    PAGE_ACCESS_TOKEN: "EAAMAZCPO9IcwBPmKJnciwrlHpxZCp0S4HyZA6GAmxA9RyzlwwAXTcdJfiyi3mZBtJYAZBm94CK76CCf0DhbbEA7jWcqRkpqIzOWEDooSwaqJk6Hpd4cQ6jBKCFXm7sUS6b5FyE7M75iOXv3O0OXpHdkGmHnK7ikD9KA4FMd9MN2YgZASKxBHoJjzDafeuKZBTXlqgiVdpQpKe98z72Ub6vmMPpmVhhZAild0ao5aLy4ZD",
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
  }
};
