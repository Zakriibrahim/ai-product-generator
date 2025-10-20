// Configuration
const CONFIG = {
  // Gemini AI
  GEMINI_API_KEY: "AIzaSyBH3Jqa1J231H1bHHVYOkxBsbNIAKxs7p4",
  GEMINI_API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
  
  // ImgBB
  IMGBB_API_KEY: "c6e60c5e34fc9fa54aeb9c605388beb5",
  IMGBB_API_URL: "https://api.imgbb.com/1/upload",
  
  // WooCommerce
  WOO_URL: "https://farhashop.com",
  WOO_CONSUMER_KEY: "ck_aab52a81e7a2aa5bc4714323696f781c3b62c89b",
  WOO_CONSUMER_SECRET: "cs_a5fe650bd337aa30f1f358d86ba24bf6cacbfba4",
  
  // Facebook
  FB_PAGE_ID: "YOUR_PAGE_ID",
  FB_ACCESS_TOKEN: "YOUR_ACCESS_TOKEN",
  
  // CORS Proxies
  PROXIES: [
    "",
    "https://cors.isomorphic-git.org/",
    "https://thingproxy.freeboard.io/fetch/",
    "https://corsproxy.io/?"
  ],
  
  // Image Processing
  IMAGE_MAX_WIDTH: 2048,
  IMAGE_MAX_HEIGHT: 2048,
  IMAGE_QUALITY: 0.85,
  
  // Rate Limiting
  API_DELAY: 1000,
  BATCH_SIZE: 10,
  BATCH_PAUSE: 30000
};
