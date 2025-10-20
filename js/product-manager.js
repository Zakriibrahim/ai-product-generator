// Product Management
const productManager = {
  async generateProductData(imageData) {
    const prompt = `Tu es un expert e-commerce. Analyse cette image de produit et génère des données complètes en français pour WooCommerce.

Retourne UNIQUEMENT un JSON avec cette structure exacte:
{
  "title": "titre du produit",
  "short_description": "description courte (1-2 phrases)",
  "description": "description détaillée",
  "price": "prix estimé en MAD (nombre uniquement)",
  "tags": ["tag1", "tag2", "tag3"],
  "suggested_category": "catégorie suggérée",
  "sku": "SKU-XXX"
}

Sois précis et professionnel. Prix en Dirhams marocains (MAD).`;

    const aiResponse = await api.callGemini(prompt, [imageData.base64]);
    const productData = JSON.parse(aiResponse);
    
    return {
      ...productData,
      images: [imageData.url],
      base64Images: [imageData.base64],
      category_id: null,
      optimized: true
    };
  },

  async uploadToWooCommerce(product) {
    const wooProduct = {
      name: product.title,
      type: 'simple',
      regular_price: product.price.toString(),
      description: product.description,
      short_description: product.short_description,
      sku: product.sku,
      images: product.images.map(url => ({ src: url })),
      tags: product.tags.map(tag => ({ name: tag })),
      categories: product.category_id ? [{ id: product.category_id }] : []
    };

    return await api.createWooProduct(wooProduct);
  },

  async bulkUploadToWoo() {
    uiManager.showLoading('Upload vers WooCommerce...');
    
    let uploaded = 0;
    const total = state.generatedProducts.length;

    for (let i = 0; i < total; i++) {
      try {
        await this.uploadToWooCommerce(state.generatedProducts[i]);
        uploaded++;
        uiManager.showProgress(uploaded, total);
        
        // Rate limiting
        if ((i + 1) % CONFIG.BATCH_SIZE === 0 && i + 1 < total) {
          await new Promise(r => setTimeout(r, CONFIG.BATCH_PAUSE));
        }
      } catch (e) {
        console.error(`Failed to upload product ${i + 1}:`, e);
      }
    }

    uiManager.hideLoading();
    alert(`✅ ${uploaded}/${total} produits uploadés avec succès!`);
  },

  async bulkAssignCategory() {
    const categoryId = prompt('Enter category ID:');
    if (!categoryId) return;

    state.selectedResults.forEach(index => {
      state.generatedProducts[index].category_id = parseInt(categoryId);
    });

    clearSelections();
    uiManager.renderResults();
  },

  async bulkChangePrice() {
    const newPrice = prompt('Enter new price (MAD):');
    if (!newPrice) return;

    state.selectedResults.forEach(index => {
      state.generatedProducts[index].price = newPrice;
    });

    clearSelections();
    uiManager.renderResults();
  }
};
