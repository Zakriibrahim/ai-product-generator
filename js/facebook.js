// Facebook Integration
const facebookManager = {
  async postToFacebook(product) {
    // Simple Facebook post - you'll need to implement proper FB Graph API integration
    const message = `🎉 Nouveau produit: ${product.title}\n\n${product.short_description}\n\nPrix: ${product.price} MAD\n\n#ecommerce #nouveauté`;
    
    const url = `https://graph.facebook.com/v18.0/${CONFIG.FB_PAGE_ID}/photos`;
    
    const formData = new FormData();
    formData.append('message', message);
    formData.append('url', product.images[0]);
    formData.append('access_token', CONFIG.FB_ACCESS_TOKEN);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Facebook post failed');
      }

      return await response.json();
    } catch (e) {
      throw new Error(`Facebook error: ${e.message}`);
    }
  },

  async bulkPostToFacebook() {
    uiManager.showLoading('Publication sur Facebook...');
    
    let posted = 0;
    const total = state.generatedProducts.length;

    for (let i = 0; i < total; i++) {
      try {
        await this.postToFacebook(state.generatedProducts[i]);
        posted++;
        uiManager.showProgress(posted, total);
        
        // Delay between posts
        await new Promise(r => setTimeout(r, 5000));
      } catch (e) {
        console.error(`Failed to post product ${i + 1}:`, e);
      }
    }

    uiManager.hideLoading();
    alert(`✅ ${posted}/${total} produits publiés sur Facebook!`);
  }
};
