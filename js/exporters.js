/**
 * Exporters
 * Handles WooCommerce upload and CSV export
 */

const Exporters = {
  /**
   * Upload products to WooCommerce
   */
  async uploadToWooCommerce(products, lang = 'en') {
    if (!products || products.length === 0) {
      Utils.notify('No products to upload', 'warning');
      return;
    }
    
    const uploadBtn = document.getElementById('uploadBtn');
    const originalText = uploadBtn.innerHTML;
    uploadBtn.disabled = true;
    
    let uploaded = 0;
    let failed = 0;
    const errors = [];
    
    try {
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        
        uploadBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Uploading ${i + 1}/${products.length}...`;
        
        try {
          await this.uploadSingleProduct(product, lang);
          uploaded++;
          Utils.notify(`✓ Uploaded: ${product.title}`, 'success', 2000);
        } catch (error) {
          failed++;
          errors.push(`${product.title}: ${error.message}`);
          Utils.notify(`✗ Failed: ${product.title}`, 'error', 2000);
        }
        
        // Rate limiting
        if ((i + 1) % CONFIG.BATCH_LIMIT === 0 && i + 1 < products.length) {
          uploadBtn.innerHTML = `<i class="fas fa-clock"></i> Pausing ${CONFIG.BATCH_PAUSE_SECONDS}s...`;
          await new Promise(r => setTimeout(r, CONFIG.BATCH_PAUSE_SECONDS * 1000));
        } else {
          await new Promise(r => setTimeout(r, 500));
        }
      }
      
      // Summary
      if (failed === 0) {
        Utils.notify(`🎉 All ${uploaded} products uploaded successfully!`, 'success', 5000);
      } else {
        Utils.notify(`⚠ Uploaded ${uploaded}, Failed ${failed}. Check console for errors.`, 'warning', 5000);
        console.error('Upload errors:', errors);
      }
      
    } catch (error) {
      Utils.notify('Upload failed: ' + error.message, 'error');
    } finally {
      uploadBtn.innerHTML = originalText;
      uploadBtn.disabled = false;
    }
  },
  
  /**
   * Upload single product to WooCommerce
   */
  async uploadSingleProduct(product, lang) {
    const isVariable = product.variations && product.variations.length > 0;
    
    // Prepare product data
    const productData = {
      name: product.translations?.title?.[lang] || product.title,
      type: isVariable ? 'variable' : 'simple',
      sku: product.sku,
      description: product.translations?.description?.[lang] || product.description,
      short_description: product.translations?.short_description?.[lang] || product.short_description,
      categories: (product.selectedCategories || []).map(id => ({ id })),
      images: (product.galleryImageUrls || []).map((url, idx) => ({
        src: url,
        position: idx
      })),
      tags: ((product.translations?.tags?.[lang] || product.tags) || []).map(tag => ({ name: tag }))
    };
    
    // Add price for simple products
    if (!isVariable) {
      productData.regular_price = String(product.price || '0');
    } else {
      productData.attributes = product.attributes;
      productData.default_attributes = product.default_attributes || [];
    }
    
    // Create product
    const url = `${CONFIG.WOO_URL}/wp-json/wc/v3/products?consumer_key=${encodeURIComponent(CONFIG.WOO_CONSUMER_KEY)}&consumer_secret=${encodeURIComponent(CONFIG.WOO_CONSUMER_SECRET)}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Upload failed');
    }
    
    const created = await response.json();
    
    // Create variations if needed
    if (isVariable && product.variations) {
      const createdImages = created.images || [];
      
      for (let i = 0; i < product.variations.length; i++) {
        const variation = product.variations[i];
        
        const variationData = {
          regular_price: String(variation.price || product.price || '0'),
          sku: variation.sku || `${product.sku}-${i + 1}`,
          attributes: (variation.attributes || []).map(a => ({
            name: a.name,
            option: a.option
          }))
        };
        
        // Assign image if specified
        if (typeof variation.image_index === 'number' && createdImages[variation.image_index]) {
          variationData.image = { id: createdImages[variation.image_index].id };
        }
        
        const varUrl = `${CONFIG.WOO_URL}/wp-json/wc/v3/products/${created.id}/variations?consumer_key=${encodeURIComponent(CONFIG.WOO_CONSUMER_KEY)}&consumer_secret=${encodeURIComponent(CONFIG.WOO_CONSUMER_SECRET)}`;
        
        const varResponse = await fetch(varUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(variationData)
        });
        
        if (!varResponse.ok) {
          console.error('Variation upload failed:', await varResponse.text());
        }
        
        await new Promise(r => setTimeout(r, 250));
      }
    }
    
    return created;
  },
  
  /**
   * Export products to CSV
   */
  exportToCSV(products) {
    if (!products || products.length === 0) {
      Utils.notify('No products to export', 'warning');
      return;
    }
    
    const headers = [
      'Title',
      'Description',
      'Short Description',
      'Price',
      'SKU',
      'Categories',
      'Tags',
      'Images',
      'Type',
      'Variations Count'
    ];
    
    const rows = products.map(p => [
      p.title || '',
      p.description || '',
      p.short_description || '',
      p.price || '0',
      p.sku || '',
      (p.categories || []).join('; '),
      (p.tags || []).join('; '),
      (p.galleryImageUrls || []).join('; '),
      (p.variations && p.variations.length > 0) ? 'Variable' : 'Simple',
      p.variations ? p.variations.length : 0
    ]);
    
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const filename = `products-export-${new Date().toISOString().slice(0, 10)}.csv`;
    Utils.downloadFile(csv, filename, 'text/csv');
    Utils.notify(`✓ Exported ${products.length} products to CSV`, 'success');
  }
};

window.Exporters = Exporters;

console.log('✅ Exporters loaded');
