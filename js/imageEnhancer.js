/**
 * AI Image Enhancer
 * Note: Requires remove.bg API key for background removal
 * Get free key at: https://remove.bg/api
 */

const ImageEnhancer = {
  // Add your remove.bg API key here (get from https://remove.bg/api)
  REMOVEBG_API_KEY: 'B15pqWdd74VofJGkiCizML6E',
  
  async removeBackground(imageUrl) {
    if (!this.REMOVEBG_API_KEY) {
      Utils.notify('⚠️ Please add remove.bg API key in js/imageEnhancer.js', 'warning', 4000);
      return imageUrl;
    }
    
    try {
      Utils.notify('Removing background...', 'info');
      
      const formData = new FormData();
      formData.append('image_url', imageUrl);
      formData.append('size', 'auto');
      formData.append('bg_color', 'ffffff');
      
      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': this.REMOVEBG_API_KEY
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
      Utils.notify('Background removal failed: ' + error.message, 'error');
      return imageUrl;
    }
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
              <br>
              Edit <code>js/imageEnhancer.js</code> and set <code>REMOVEBG_API_KEY</code>
              <br>
              <a href="https://remove.bg/api" target="_blank" class="underline font-semibold">Get Free API Key →</a>
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
    const processedUrl = await this.removeBackground(originalUrl);
    
    if (processedUrl !== originalUrl) {
      product.galleryImageUrls[imageIndex] = processedUrl;
      ProductManager.updateProduct(productIndex, product);
      closeModal();
    }
  }
};

window.ImageEnhancer = ImageEnhancer;

console.log('✅ ImageEnhancer loaded');

// Add image enhancement support for fetched products
ImageEnhancer.showEnhanceModalFetched = function(productIndex) {
  const product = FetchedManager.fetchedProducts[productIndex];
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
        <button onclick="ImageEnhancer.processImageFetched(${productIndex}, ${i}, 'remove-bg')" 
                class="btn btn-blue btn-sm flex-1">
          <i class="fas fa-magic"></i> Remove BG
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
        <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-4">
          <p class="text-sm text-green-800">
            <i class="fas fa-check-circle"></i>
            <strong>API Key Active:</strong> Background removal is ready to use!
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
};

ImageEnhancer.processImageFetched = async function(productIndex, imageIndex, type) {
  const product = FetchedManager.fetchedProducts[productIndex];
  if (!product) return;
  
  const originalUrl = product.galleryImageUrls[imageIndex];
  const processedUrl = await this.removeBackground(originalUrl);
  
  if (processedUrl !== originalUrl) {
    product.galleryImageUrls[imageIndex] = processedUrl;
    FetchedManager.updateProduct(productIndex, product);
    closeModal();
  }
};

console.log('✅ Image enhancement for fetched products added');
