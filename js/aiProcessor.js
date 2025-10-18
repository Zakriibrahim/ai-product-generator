/**
 * AI Processor
 * Handles all Gemini AI API calls
 */

const AIProcessor = {
  abortController: new AbortController(),
  
  /**
   * Make API call to Gemini
   */
  async makeApiCall(payload) {
    const url = `${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`;
    
    await new Promise(r => setTimeout(r, CONFIG.API_DELAY_MS));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: this.abortController.signal
    });
    
    if (!response.ok) {
      let errorBody = '';
      try { 
        errorBody = await response.json(); 
      } catch(e) {}
      
      const message = errorBody?.error?.message || response.statusText;
      throw new Error(`Gemini API error: ${message}`);
    }
    
    return await response.json();
  },
  
  /**
   * Generate product data from images
   */
  async generateProduct(images, note = '') {
    const base64s = [];
    
    for (const imgObj of images) {
      let b64;
      if (imgObj.file && imgObj.file instanceof File) {
        b64 = await ImageHandler.fileToBase64(imgObj.file);
      } else if (imgObj.preview && imgObj.preview.startsWith('data:image')) {
        b64 = imgObj.preview.split(',')[1];
      } else if (imgObj.url) {
        b64 = await ImageHandler.urlToBase64(imgObj.url);
      } else {
        throw new Error('Image has no valid source');
      }
      base64s.push(b64);
    }
    
    const prompt = `You are an e-commerce expert for WooCommerce. Analyze ALL provided images as ONE product.

RULES FOR VARIATIONS:
- Only create Color variations if different images show DIFFERENT color variants
- If one image shows a mixed-color pack, DO NOT create color variations from that alone
- Use the user note to confirm available options (colors/sizes)
- If variations exist (Color, Size, etc.), list EACH valid combination with price and image_index (0-based)
- If no real variations exist, return: attributes: [] and variations: []

RETURN ONLY THIS JSON FORMAT:
{
  "title": "Short product title",
  "short_description": "1-2 sentence summary",
  "description": "Detailed product description",
  "tags": ["tag1", "tag2", "tag3"],
  "categories": ["Category1", "Category2"],
  "sku": "UNIQUE-SKU-CODE",
  "price": "99.00",
  "attributes": [
    { "name": "Color", "options": ["Red", "Blue"], "visible": true, "variation": true },
    { "name": "Size", "options": ["S", "M", "L"], "visible": true, "variation": true }
  ],
  "variations": [
    {
      "attributes": [{"name": "Color", "option": "Red"}, {"name": "Size", "option": "M"}],
      "price": "99.00",
      "sku": "SKU-RED-M",
      "image_index": 1
    }
  ],
  "default_attributes": [
    {"name": "Color", "option": "Red"},
    {"name": "Size", "option": "M"}
  ]
}

NOTES:
- First image (index 0) is featured image
- Use MAD (درهم) for prices
- Estimate realistic prices based on product type
- SKU should be unique and descriptive

USER NOTE: "${note || 'None'}"

RETURN ONLY THE JSON, NO MARKDOWN, NO EXTRA TEXT.`;
    
    const parts = [{ text: prompt }];
    base64s.forEach(b64 => parts.push({
      inlineData: { mimeType: "image/jpeg", data: b64 }
    }));
    
    const payload = {
      contents: [{ parts }],
      generationConfig: { responseMimeType: "application/json" }
    };
    
    const response = await this.makeApiCall(payload);
    const aiText = response.candidates[0].content.parts[0].text;
    
    let product = Utils.parseJSON(aiText, null);
    if (!product || !product.title) {
      throw new Error("AI did not return valid product data");
    }
    
    product.tags = Array.isArray(product.tags) ? product.tags : [product.tags || ''];
    product.categories = Array.isArray(product.categories) ? product.categories : [product.categories || ''];
    product.attributes = Array.isArray(product.attributes) ? product.attributes : [];
    product.variations = Array.isArray(product.variations) ? product.variations : [];
    product.default_attributes = Array.isArray(product.default_attributes) ? product.default_attributes : [];
    product.short_description = product.short_description || '';
    product.description = product.description || '';
    product.sku = product.sku || `SKU-${Date.now()}`;
    product.price = String(product.price || '0').replace(/[^\d.]/g, '');
    
    return { product, base64s };
  },
  
  /**
   * Translate product to language
   */
  async translateProduct(product, targetLang) {
    if (targetLang === 'en') return product;
    
    const prompt = `Translate this WooCommerce product to ${CONFIG.LANGUAGES[targetLang].name} (${targetLang}).

RETURN ONLY THIS JSON:
{
  "title": {"en": "${product.title}", "${targetLang}": "..."},
  "short_description": {"en": "${product.short_description}", "${targetLang}": "..."},
  "description": {"en": "${product.description}", "${targetLang}": "..."},
  "tags": {"en": ${JSON.stringify(product.tags)}, "${targetLang}": [...]},
  "categories": {"en": ${JSON.stringify(product.categories)}, "${targetLang}": [...]}
}

RETURN ONLY JSON, NO MARKDOWN.`;
    
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    };
    
    const response = await this.makeApiCall(payload);
    const translations = Utils.parseJSON(
      response.candidates[0].content.parts[0].text,
      {}
    );
    
    return translations;
  },
  
  /**
   * Get Arabic category
   */
  async getArabicCategory(categories, base64s, note) {
    const prompt = `For this WooCommerce product, translate these categories to Arabic ONLY.
If user note requests a specific category, prioritize it.

Categories: ${JSON.stringify(categories)}
User Note: "${note || ''}"

Return ONLY the Arabic category name as plain text, no JSON, no quotes.`;
    
    const parts = [{ text: prompt }];
    base64s.forEach(b64 => parts.push({
      inlineData: { mimeType: "image/jpeg", data: b64 }
    }));
    
    const payload = {
      contents: [{ parts }],
      generationConfig: { responseMimeType: "text/plain" }
    };
    
    const response = await this.makeApiCall(payload);
    const arabicCategory = response.candidates[0].content.parts[0].text.trim();
    
    return arabicCategory.replace(/["']/g, '');
  },
  
  /**
   * Abort current generation
   */
  abort() {
    this.abortController.abort();
    this.abortController = new AbortController();
  }
};

window.AIProcessor = AIProcessor;

console.log('✅ AIProcessor loaded');
