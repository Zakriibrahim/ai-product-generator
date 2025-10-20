const CONFIG = {
  // WooCommerce API Configuration
  WOOCOMMERCE: {
    URL: 'https://your-store.com',
    CONSUMER_KEY: 'ck_your_consumer_key',
    CONSUMER_SECRET: 'cs_your_consumer_secret'
  },

  // Social Media Webhook (Make.com)
  SOCIAL_WEBHOOK: {
    URL: 'https://hook.eu2.make.com/ajtkr8a2aci5uuxc303ub9mlgjtvjsxj',
    PLATFORMS: ['facebook', 'instagram', 'telegram'] // Add more as needed
  },

  // OpenAI Configuration
  OPENAI: {
    API_KEY: 'your_openai_api_key',
    MODEL: 'gpt-4-vision-preview',
    MAX_TOKENS: 2000
  },

  // Image Processing
  IMAGE: {
    MAX_SIZE: 2048,
    QUALITY: 0.85,
    FORMAT: 'image/jpeg'
  },

  // Upload Mode
  UPLOAD_MODE: {
    SINGLE: 'single', // 1 image = 1 product
    GROUP: 'group'    // multiple images = 1 product
  }
};

window.CONFIG = CONFIG;
