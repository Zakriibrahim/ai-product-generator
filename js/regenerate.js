/**
 * Regenerate Products with AI
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
      
      const images = base64s.map((b64, i) => ({
        url: product.galleryImageUrls[i],
        file: null
      }));
      
      const { product: newData } = await AIProcessor.generateProduct(images, product.note || '');
      const translations = await AIProcessor.translateProduct(newData, 'fr');
      const category_ar = await AIProcessor.getArabicCategory(newData.categories, base64s, product.note || '');
      const selectedCategories = CategoryManager.autoSelectCategories(newData.categories, category_ar);
      
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
      console.error('Regeneration error:', error);
    }
  }
};

window.RegenerateProducts = RegenerateProducts;

console.log('✅ RegenerateProducts loaded');

// Add regenerate support for fetched products
RegenerateProducts.regenerateFetched = async function(index) {
  const product = FetchedManager.fetchedProducts[index];
  if (!product) return;
  
  if (!confirm(`Regenerate "${product.title}" with AI?\n\nThis will:\n• Re-analyze images\n• Update title & descriptions\n• Refresh categories\n• Keep existing images`)) {
    return;
  }
  
  try {
    Utils.notify('Regenerating fetched product with AI...', 'info');
    
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
    
    const images = base64s.map((b64, i) => ({
      url: product.galleryImageUrls[i],
      file: null
    }));
    
    const { product: newData } = await AIProcessor.generateProduct(images, product.note || '');
    const translations = await AIProcessor.translateProduct(newData, 'fr');
    const category_ar = await AIProcessor.getArabicCategory(newData.categories, base64s, product.note || '');
    const selectedCategories = CategoryManager.autoSelectCategories(newData.categories, category_ar);
    
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
    
    FetchedManager.updateProduct(index, updatedProduct);
    Utils.notify('✓ Fetched product regenerated!', 'success');
    
  } catch (error) {
    Utils.notify('Regeneration failed: ' + error.message, 'error');
    console.error('Regeneration error:', error);
  }
};

console.log('✅ Regenerate for fetched products added');
