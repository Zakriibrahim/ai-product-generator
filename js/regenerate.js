/**
 * Regenerate Products
 * Re-analyze products with AI
 */

const RegenerateProducts = {
  async regenerate(index) {
    const product = ProductManager.getProduct(index);
    if (!product) return;
    
    if (!confirm(`Regenerate "${product.title}" with AI?\n\nThis will:\n• Re-analyze images\n• Update title & descriptions\n• Refresh categories\n• Keep existing images`)) {
      return;
    }
    
    try {
      Utils.notify('Regenerating product with AI...', 'info');
      
      // Get base64 from existing images
      const base64s = [];
      for (const url of product.galleryImageUrls || []) {
        try {
          const b64 = await ImageHandler.urlToBase64(url);
          base64s.push(b64);
        } catch (e) {
          console.error('Failed to convert image:', e);
        }
      }
      
      if (base64s.length === 0) {
        throw new Error('No images available to analyze');
      }
      
      // Build image objects
      const images = base64s.map((b64, i) => ({
        url: product.galleryImageUrls[i],
        file: null
      }));
      
      // Generate new data
      const { product: newData } = await AIProcessor.generateProduct(images, product.note || '');
      
      // Get translations
      const translations = await AIProcessor.translateProduct(newData, 'fr');
      
      // Get Arabic category
      const category_ar = await AIProcessor.getArabicCategory(newData.categories, base64s, product.note || '');
      
      // Auto-select categories
      const selectedCategories = CategoryManager.autoSelectCategories(newData.categories, category_ar);
      
      // Update product (keep existing images and ID)
      const updatedProduct = {
        ...product,
        title: newData.title,
        description: newData.description,
        short_description: newData.short_description,
        tags: newData.tags,
        categories: newData.categories,
        selectedCategories: selectedCategories.length > 0 ? selectedCategories : product.selectedCategories,
        category_ar,
        translations,
        attributes: newData.attributes,
        variations: newData.variations,
        default_attributes: newData.default_attributes
      };
      
      ProductManager.updateProduct(index, updatedProduct);
      Utils.notify('✓ Product regenerated successfully!', 'success');
      
    } catch (error) {
      Utils.notify('Regeneration failed: ' + error.message, 'error');
    }
  }
};

window.RegenerateProducts = RegenerateProducts;

console.log('✅ RegenerateProducts loaded');
