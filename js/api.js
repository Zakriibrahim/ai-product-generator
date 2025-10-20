// API Functions
const api = {
  // CORS Helper
  async proxiedFetch(url, options = {}) {
    let lastError;
    for (const proxy of CONFIG.PROXIES) {
      const finalUrl = proxy ? (proxy.endsWith('?') ? proxy + encodeURIComponent(url) : proxy + url) : url;
      try {
        const response = await fetch(finalUrl, options);
        if (response.ok) return response;
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError || new Error("All proxies failed");
  },

  // Gemini AI Call
  async callGemini(prompt, images = []) {
    const parts = [{ text: prompt }];
    
    for (const imageData of images) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageData
        }
      });
    }

    const payload = {
      contents: [{
        parts: parts
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    await new Promise(r => setTimeout(r, CONFIG.API_DELAY));

    const response = await fetch(`${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody?.error?.message || response.statusText);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  },

  // WooCommerce - Fetch Products
  async fetchWooProducts() {
    const url = `${CONFIG.WOO_URL}/wp-json/wc/v3/products?per_page=100&consumer_key=${encodeURIComponent(CONFIG.WOO_CONSUMER_KEY)}&consumer_secret=${encodeURIComponent(CONFIG.WOO_CONSUMER_SECRET)}`;
    const response = await this.proxiedFetch(url);
    return await response.json();
  },

  // WooCommerce - Fetch Categories
  async fetchWooCategories() {
    const url = `${CONFIG.WOO_URL}/wp-json/wc/v3/products/categories?per_page=100&consumer_key=${encodeURIComponent(CONFIG.WOO_CONSUMER_KEY)}&consumer_secret=${encodeURIComponent(CONFIG.WOO_CONSUMER_SECRET)}`;
    const response = await this.proxiedFetch(url);
    return await response.json();
  },

  // WooCommerce - Create Product
  async createWooProduct(productData) {
    const url = `${CONFIG.WOO_URL}/wp-json/wc/v3/products?consumer_key=${encodeURIComponent(CONFIG.WOO_CONSUMER_KEY)}&consumer_secret=${encodeURIComponent(CONFIG.WOO_CONSUMER_SECRET)}`;
    const response = await this.proxiedFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    return await response.json();
  },

  // WooCommerce - Delete Product
  async deleteWooProduct(productId) {
    const url = `${CONFIG.WOO_URL}/wp-json/wc/v3/products/${productId}?force=true&consumer_key=${encodeURIComponent(CONFIG.WOO_CONSUMER_KEY)}&consumer_secret=${encodeURIComponent(CONFIG.WOO_CONSUMER_SECRET)}`;
    const response = await this.proxiedFetch(url, { method: 'DELETE' });
    return await response.json();
  },

  // ImgBB Upload
  async uploadToImgBB(base64Data, filename) {
    const formData = new FormData();
    formData.append('key', CONFIG.IMGBB_API_KEY);
    formData.append('image', base64Data);
    formData.append('name', filename);

    const response = await fetch(CONFIG.IMGBB_API_URL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('ImgBB upload failed');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'ImgBB upload failed');
    }

    return data.data.url;
  }
};

async fetchProductsFromStore() {
  try {
    window.uiManager.showLoading('Fetching products from WooCommerce...');
    
    const auth = btoa(`${CONFIG.WOOCOMMERCE.CONSUMER_KEY}:${CONFIG.WOOCOMMERCE.CONSUMER_SECRET}`);
    const response = await fetch(
      `${CONFIG.WOOCOMMERCE.URL}/wp-json/wc/v3/products?per_page=50`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }
    );
    
    if (!response.ok) throw new Error('Failed to fetch products');
    
    const products = await response.json();
    window.state.fetchedProducts = products;
    window.uiManager.renderFetchedProducts();
    window.uiManager.updateCounts();
    window.uiManager.hideError();
  } catch (error) {
    window.uiManager.showError('Failed to fetch products: ' + error.message);
  }
  
  window.uiManager.hideLoading();
}
