/**
 * AI Image Enhancer
 * Remove backgrounds, enhance quality
 */

const ImageEnhancer = {
  async removeBackground(imageUrl) {
    try {
      Utils.notify('Removing background...', 'info');
      
      // Using remove.bg API (you'll need API key)
      const REMOVEBG_API_KEY = 'YOUR_REMOVE_BG_KEY'; // Get from remove.bg
      
      const formData = new FormData();
      formData.append('image_url', imageUrl);
      formData.append('size', 'auto');
      formData.append('bg_color', 'ffffff'); // White background
      
      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': REMOVEBG_API_KEY
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Background removal failed');
      }
      
      const blob = await response.blob();
      const processedUrl = URL.createObjectURL(blob);
      
      Utils.notify('✓ Background removed!', 'success');
      return processedUrl;
      
    } catch (error) {
      Utils.notify('Background removal not available (needs API key)', 'warning');
      return imageUrl;
    }
  },
  
  async enhanceImage(imageUrl) {
    // For now, return original
    // Can integrate with APIs like:
    // - DeepAI Image Enhancement
    // - Cloudinary AI
    // - Let's Enhance API
    
    Utils.notify('Image enhancement coming soon!', 'info');
    return imageUrl;
  },
  
  showEnhanceModal(productIndex) {
    const product = ProductManager.getProduct(productIndex);
    if (!product || !product.galleryImageUrls?.length) {
      Utils.notify('No images to enhance', 'warning');
      return;
    }
    
    const modal = document.getElementById('modalContainer');
    const modalBg = document.getElementById('modalBg');
    
    const imagesHtml = product.galleryImageUrls.map((url, i) => `
      <div class="border-2 border-zinc-200 rounded-lg p-3">
        <img src="${url}" class="w-full h-40 object-cover rounded mb-3" alt="Image ${i}">
        <div class="flex gap-2">
          <button onclick="ImageEnhancer.processImage(${productIndex}, ${i}, 'remove-bg')" 
                  class="btn btn-blue btn-sm flex-1">
            <i class="fas fa-magic"></i> Remove BG
          </button>
          <button onclick="ImageEnhancer.processImage(${productIndex}, ${i}, 'enhance')" 
                  class="btn btn-indigo btn-sm flex-1">
            <i class="fas fa-sparkles"></i> Enhance
          </button>
        </div>
      </div>
    `).join('');
    
    modal.innerHTML = `
      <div class="modal-card">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-indigo-700">
            <i class="fas fa-wand-magic-sparkles"></i> AI Image Enhancement
          </h2>
          <button onclick="closeModal()" class="text-3xl text-zinc-400 hover:text-zinc-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="mb-6">
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-4">
            <p class="text-sm text-yellow-800">
              <i class="fas fa-key"></i>
              <strong>API Key Required:</strong> Background removal requires remove.bg API key. 
              Edit <code>js/imageEnhancer.js</code> to add your key.
              <a href="https://remove.bg/api" target="_blank" class="underline ml-2">Get API Key</a>
            </p>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          ${imagesHtml}
        </div>
        
        <div class="flex gap-3 justify-end mt-6 pt-6 border-t">
          <button onclick="closeModal()" class="btn btn-gray">
            <i class="fas fa-times"></i> Close
          </button>
        </div>
      </div>
    `;
    
    modal.classList.remove('hidden');
    modalBg.classList.remove('hidden');
  },
  
  async processImage(productIndex, imageIndex, type) {
    const product = ProductManager.getProduct(productIndex);
    if (!product) return;
    
    const originalUrl = product.galleryImageUrls[imageIndex];
    let processedUrl;
    
    if (type === 'remove-bg') {
      processedUrl = await this.removeBackground(originalUrl);
    } else if (type === 'enhance') {
      processedUrl = await this.enhanceImage(originalUrl);
    }
    
    // Update product image
    product.galleryImageUrls[imageIndex] = processedUrl;
    ProductManager.updateProduct(productIndex, product);
  }
};

window.ImageEnhancer = ImageEnhancer;

console.log('✅ ImageEnhancer loaded');
