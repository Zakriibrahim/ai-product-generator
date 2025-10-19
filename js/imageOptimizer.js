/**
 * Advanced Image Optimizer
 * Handles image optimization, background removal, resizing, and compression
 */

const ImageOptimizer = {
  // WooCommerce recommended dimensions
  WOOCOMMERCE_SIZE: 1000,
  
  // Quality settings
  JPEG_QUALITY: 0.9,
  WEBP_QUALITY: 0.85,
  
  // Optimization state
  currentOptimization: null,
  
  /**
   * Process image with all optimizations
   */
  async optimizeImage(file, options = {}) {
    const {
      removeBackground = false,
      resize = true,
      targetSize = this.WOOCOMMERCE_SIZE,
      compress = true,
      format = 'webp', // 'webp' or 'jpeg'
      autoCrop = true
    } = options;
    
    try {
      // Load image
      const img = await this.loadImage(file);
      
      // Create canvas for processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: true });
      
      // Step 1: Auto-crop if enabled
      let processedImg = img;
      if (autoCrop) {
        processedImg = await this.autoCropImage(img);
      }
      
      // Step 2: Resize to WooCommerce dimensions (square)
      if (resize) {
        const size = targetSize;
        canvas.width = size;
        canvas.height = size;
        
        // Calculate scaling to fit image while maintaining aspect ratio
        const scale = Math.max(size / processedImg.width, size / processedImg.height);
        const scaledWidth = processedImg.width * scale;
        const scaledHeight = processedImg.height * scale;
        const offsetX = (size - scaledWidth) / 2;
        const offsetY = (size - scaledHeight) / 2;
        
        // Fill background with white (or transparent if removing background)
        if (!removeBackground) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, size, size);
        }
        
        // Draw image centered
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(processedImg, offsetX, offsetY, scaledWidth, scaledHeight);
      } else {
        canvas.width = processedImg.width;
        canvas.height = processedImg.height;
        ctx.drawImage(processedImg, 0, 0);
      }
      
      // Step 3: Enhance image quality (sharpen)
      await this.enhanceQuality(canvas, ctx);
      
      // Step 4: Remove background if requested
      if (removeBackground) {
        const bgRemovedCanvas = await this.removeBackgroundClient(canvas);
        return bgRemovedCanvas;
      }
      
      return canvas;
      
    } catch (error) {
      console.error('Image optimization failed:', error);
      throw error;
    }
  },
  
  /**
   * Load image from file
   */
  async loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  },
  
  /**
   * Auto-crop image to focus on main product
   * Uses edge detection to find content boundaries
   */
  async autoCropImage(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: true });
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const bounds = this.findContentBounds(imageData);
    
    // Add some padding (5%)
    const padding = Math.min(
      Math.floor(bounds.width * 0.05),
      Math.floor(bounds.height * 0.05)
    );
    
    const cropX = Math.max(0, bounds.x - padding);
    const cropY = Math.max(0, bounds.y - padding);
    const cropW = Math.min(canvas.width - cropX, bounds.width + padding * 2);
    const cropH = Math.min(canvas.height - cropY, bounds.height + padding * 2);
    
    // Create cropped canvas
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d', { alpha: true });
    croppedCanvas.width = cropW;
    croppedCanvas.height = cropH;
    
    croppedCtx.drawImage(
      canvas,
      cropX, cropY, cropW, cropH,
      0, 0, cropW, cropH
    );
    
    // Return as image
    return new Promise((resolve) => {
      const croppedImg = new Image();
      croppedImg.onload = () => resolve(croppedImg);
      croppedImg.src = croppedCanvas.toDataURL();
    });
  },
  
  /**
   * Find content boundaries using edge detection
   */
  findContentBounds(imageData) {
    const { data, width, height } = imageData;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    
    // Threshold for detecting content (vs white/transparent background)
    const threshold = 240;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // Check if pixel is not white/transparent
        const isContent = (r < threshold || g < threshold || b < threshold) && a > 10;
        
        if (isContent) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    // If no content found, return full bounds
    if (minX >= maxX || minY >= maxY) {
      return { x: 0, y: 0, width, height };
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  },
  
  /**
   * Enhance image quality with sharpening
   */
  async enhanceQuality(canvas, ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const sharpened = this.sharpenImage(imageData);
    ctx.putImageData(sharpened, 0, 0);
  },
  
  /**
   * Apply sharpening filter
   */
  sharpenImage(imageData) {
    const { data, width, height } = imageData;
    const output = new ImageData(width, height);
    
    // Sharpening kernel
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let r = 0, g = 0, b = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const i = ((y + ky) * width + (x + kx)) * 4;
            const weight = kernel[(ky + 1) * 3 + (kx + 1)];
            r += data[i] * weight;
            g += data[i + 1] * weight;
            b += data[i + 2] * weight;
          }
        }
        
        const i = (y * width + x) * 4;
        output.data[i] = Math.max(0, Math.min(255, r));
        output.data[i + 1] = Math.max(0, Math.min(255, g));
        output.data[i + 2] = Math.max(0, Math.min(255, b));
        output.data[i + 3] = data[i + 3]; // Keep alpha
      }
    }
    
    // Copy edges
    for (let x = 0; x < width; x++) {
      for (let edge = 0; edge < 4; edge++) {
        const i = x * 4;
        const iLast = ((height - 1) * width + x) * 4;
        output.data[i + edge] = data[i + edge];
        output.data[iLast + edge] = data[iLast + edge];
      }
    }
    
    for (let y = 0; y < height; y++) {
      for (let edge = 0; edge < 4; edge++) {
        const i = (y * width) * 4;
        const iLast = (y * width + width - 1) * 4;
        output.data[i + edge] = data[i + edge];
        output.data[iLast + edge] = data[iLast + edge];
      }
    }
    
    return output;
  },
  
  /**
   * Remove background using client-side processing
   * Fallback to simple algorithm if no external library available
   */
  async removeBackgroundClient(canvas) {
    // Check if @imgly/background-removal-js is available
    if (window.removeBackground) {
      try {
        const blob = await new Promise(resolve => canvas.toBlob(resolve));
        const result = await removeBackground(blob);
        const url = URL.createObjectURL(result);
        
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });
        
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = canvas.width;
        outputCanvas.height = canvas.height;
        const outputCtx = outputCanvas.getContext('2d', { alpha: true });
        outputCtx.drawImage(img, 0, 0);
        
        URL.revokeObjectURL(url);
        return outputCanvas;
      } catch (error) {
        console.warn('External background removal failed, using fallback:', error);
      }
    }
    
    // Fallback: Simple color-based background removal
    return this.simpleBackgroundRemoval(canvas);
  },
  
  /**
   * Simple background removal (fallback)
   */
  simpleBackgroundRemoval(canvas) {
    const ctx = canvas.getContext('2d', { alpha: true });
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data } = imageData;
    
    // Sample corner colors to detect background
    const samples = [
      { x: 0, y: 0 },
      { x: canvas.width - 1, y: 0 },
      { x: 0, y: canvas.height - 1 },
      { x: canvas.width - 1, y: canvas.height - 1 }
    ];
    
    const bgColors = samples.map(({ x, y }) => {
      const i = (y * canvas.width + x) * 4;
      return { r: data[i], g: data[i + 1], b: data[i + 2] };
    });
    
    // Average background color
    const avgBg = {
      r: bgColors.reduce((sum, c) => sum + c.r, 0) / bgColors.length,
      g: bgColors.reduce((sum, c) => sum + c.g, 0) / bgColors.length,
      b: bgColors.reduce((sum, c) => sum + c.b, 0) / bgColors.length
    };
    
    // Remove pixels similar to background
    const threshold = 30;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const diff = Math.sqrt(
        Math.pow(r - avgBg.r, 2) +
        Math.pow(g - avgBg.g, 2) +
        Math.pow(b - avgBg.b, 2)
      );
      
      if (diff < threshold) {
        data[i + 3] = 0; // Make transparent
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  },
  
  /**
   * Convert canvas to compressed blob
   */
  async canvasToBlob(canvas, format = 'webp', quality = 0.85) {
    const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        mimeType,
        quality
      );
    });
  },
  
  /**
   * Show optimization preview modal
   */
  async showPreviewModal(file, options = {}) {
    try {
      Utils.notify('🔄 Processing image...', 'info');
      
      // Process image
      const canvas = await this.optimizeImage(file, options);
      const blob = await this.canvasToBlob(
        canvas,
        options.format || 'webp',
        options.format === 'webp' ? this.WEBP_QUALITY : this.JPEG_QUALITY
      );
      
      const optimizedUrl = URL.createObjectURL(blob);
      const originalUrl = URL.createObjectURL(file);
      
      const originalSize = (file.size / 1024).toFixed(2);
      const optimizedSize = (blob.size / 1024).toFixed(2);
      const savings = ((1 - blob.size / file.size) * 100).toFixed(1);
      
      // Get dimensions
      const img = await this.loadImage(file);
      
      const modal = document.getElementById('modalContainer');
      const modalBg = document.getElementById('modalBg');
      
      modal.innerHTML = `
        <div class="modal-card max-w-5xl">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-indigo-700">
              <i class="fas fa-wand-magic-sparkles"></i> Image Optimization Preview
            </h2>
            <button onclick="closeModal()" class="text-3xl text-zinc-400 hover:text-zinc-600">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 class="font-semibold text-lg mb-3 text-zinc-700">
                <i class="fas fa-image"></i> Original
              </h3>
              <img src="${originalUrl}" class="w-full rounded-lg border-2 border-zinc-200 mb-3" alt="Original">
              <div class="text-sm text-zinc-600">
                <p><strong>Size:</strong> ${originalSize} KB</p>
                <p><strong>Dimensions:</strong> ${img.width} × ${img.height}px</p>
              </div>
            </div>
            
            <div>
              <h3 class="font-semibold text-lg mb-3 text-green-700">
                <i class="fas fa-check-circle"></i> Optimized
              </h3>
              <img src="${optimizedUrl}" class="w-full rounded-lg border-2 border-green-200 mb-3" alt="Optimized">
              <div class="text-sm text-zinc-600">
                <p><strong>Size:</strong> ${optimizedSize} KB <span class="text-green-600 font-semibold">(-${savings}%)</span></p>
                <p><strong>Dimensions:</strong> ${canvas.width} × ${canvas.height}px</p>
                <p><strong>Format:</strong> ${options.format || 'webp'}</p>
              </div>
            </div>
          </div>
          
          <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
            <h4 class="font-semibold text-blue-900 mb-2">
              <i class="fas fa-info-circle"></i> Optimizations Applied:
            </h4>
            <ul class="text-sm text-blue-800 space-y-1">
              ${options.autoCrop ? '<li>✓ Auto-cropped to focus on product</li>' : ''}
              ${options.resize ? '<li>✓ Resized to WooCommerce standard (' + (options.targetSize || this.WOOCOMMERCE_SIZE) + 'x' + (options.targetSize || this.WOOCOMMERCE_SIZE) + 'px)</li>' : ''}
              <li>✓ Enhanced quality with sharpening</li>
              ${options.removeBackground ? '<li>✓ Background removed</li>' : '<li>✓ Centered on white background</li>'}
              <li>✓ Smart compression with ${options.format || 'WebP'} format</li>
            </ul>
          </div>
          
          <div class="flex gap-3 justify-end pt-6 border-t">
            <button onclick="closeModal()" class="btn btn-gray">
              <i class="fas fa-times"></i> Cancel
            </button>
            <button onclick="ImageOptimizer.acceptOptimization()" class="btn btn-green">
              <i class="fas fa-check"></i> Accept & Use Optimized
            </button>
          </div>
        </div>
      `;
      
      modal.classList.remove('hidden');
      modalBg.classList.remove('hidden');
      
      // Store for later use
      this.currentOptimization = {
        blob,
        canvas,
        file,
        options,
        originalUrl,
        optimizedUrl
      };
      
      Utils.notify('✓ Optimization complete!', 'success');
      
    } catch (error) {
      Utils.notify('❌ Optimization failed: ' + error.message, 'error');
      console.error('Optimization error:', error);
    }
  },
  
  /**
   * Accept optimized image
   */
  acceptOptimization() {
    if (!this.currentOptimization) {
      closeModal();
      return;
    }
    
    const { blob, file } = this.currentOptimization;
    
    // Create a new File object from the blob
    const optimizedFile = new File(
      [blob],
      file.name.replace(/\.[^.]+$/, '.webp'),
      { type: blob.type }
    );
    
    // Clean up URLs
    if (this.currentOptimization.originalUrl) {
      URL.revokeObjectURL(this.currentOptimization.originalUrl);
    }
    if (this.currentOptimization.optimizedUrl) {
      URL.revokeObjectURL(this.currentOptimization.optimizedUrl);
    }
    
    // Trigger custom event with optimized file
    const event = new CustomEvent('imageOptimized', {
      detail: { originalFile: file, optimizedFile, blob }
    });
    document.dispatchEvent(event);
    
    this.currentOptimization = null;
    closeModal();
    Utils.notify('✓ Using optimized image', 'success');
  },
  
  /**
   * Show optimization settings modal for batch processing
   */
  showSettingsModal(callback) {
    const modal = document.getElementById('modalContainer');
    const modalBg = document.getElementById('modalBg');
    
    const savedSettings = JSON.parse(localStorage.getItem('imageOptSettings') || '{}');
    const defaults = {
      removeBackground: false,
      resize: true,
      targetSize: this.WOOCOMMERCE_SIZE,
      compress: true,
      format: 'webp',
      autoCrop: true
    };
    
    const settings = { ...defaults, ...savedSettings };
    
    modal.innerHTML = `
      <div class="modal-card max-w-2xl">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-indigo-700">
            <i class="fas fa-cog"></i> Image Optimization Settings
          </h2>
          <button onclick="closeModal()" class="text-3xl text-zinc-400 hover:text-zinc-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="space-y-4 mb-6">
          <label class="flex items-center gap-3 p-4 bg-zinc-50 rounded-lg cursor-pointer hover:bg-zinc-100">
            <input type="checkbox" id="opt-autocrop" ${settings.autoCrop ? 'checked' : ''} class="w-5 h-5">
            <div>
              <div class="font-semibold text-zinc-800">Auto-Crop</div>
              <div class="text-sm text-zinc-600">Automatically crop to focus on product</div>
            </div>
          </label>
          
          <label class="flex items-center gap-3 p-4 bg-zinc-50 rounded-lg cursor-pointer hover:bg-zinc-100">
            <input type="checkbox" id="opt-resize" ${settings.resize ? 'checked' : ''} class="w-5 h-5">
            <div>
              <div class="font-semibold text-zinc-800">Resize for WooCommerce</div>
              <div class="text-sm text-zinc-600">Resize to recommended dimensions</div>
            </div>
          </label>
          
          <div class="p-4 bg-zinc-50 rounded-lg">
            <label class="font-semibold text-zinc-800 mb-2 block">Target Size (px)</label>
            <select id="opt-size" class="w-full p-2 border-2 border-zinc-200 rounded-lg">
              <option value="800" ${settings.targetSize === 800 ? 'selected' : ''}>800 × 800</option>
              <option value="1000" ${settings.targetSize === 1000 ? 'selected' : ''}>1000 × 1000 (Recommended)</option>
              <option value="1200" ${settings.targetSize === 1200 ? 'selected' : ''}>1200 × 1200</option>
            </select>
          </div>
          
          <label class="flex items-center gap-3 p-4 bg-zinc-50 rounded-lg cursor-pointer hover:bg-zinc-100">
            <input type="checkbox" id="opt-bg-remove" ${settings.removeBackground ? 'checked' : ''} class="w-5 h-5">
            <div>
              <div class="font-semibold text-zinc-800">Remove Background</div>
              <div class="text-sm text-zinc-600">Clean, transparent background</div>
            </div>
          </label>
          
          <div class="p-4 bg-zinc-50 rounded-lg">
            <label class="font-semibold text-zinc-800 mb-2 block">Output Format</label>
            <select id="opt-format" class="w-full p-2 border-2 border-zinc-200 rounded-lg">
              <option value="webp" ${settings.format === 'webp' ? 'selected' : ''}>WebP (Best compression)</option>
              <option value="jpeg" ${settings.format === 'jpeg' ? 'selected' : ''}>JPEG (Universal)</option>
            </select>
          </div>
          
          <label class="flex items-center gap-3 p-4 bg-zinc-50 rounded-lg cursor-pointer hover:bg-zinc-100">
            <input type="checkbox" id="opt-compress" ${settings.compress ? 'checked' : ''} class="w-5 h-5">
            <div>
              <div class="font-semibold text-zinc-800">Smart Compression</div>
              <div class="text-sm text-zinc-600">Reduce file size without quality loss</div>
            </div>
          </label>
        </div>
        
        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-6">
          <p class="text-sm text-yellow-800">
            <i class="fas fa-lightbulb"></i>
            <strong>Tip:</strong> These settings will be saved and applied to all future uploads.
          </p>
        </div>
        
        <div class="flex gap-3 justify-end pt-6 border-t">
          <button onclick="closeModal()" class="btn btn-gray">
            <i class="fas fa-times"></i> Cancel
          </button>
          <button onclick="ImageOptimizer.saveSettings()" class="btn btn-green">
            <i class="fas fa-check"></i> Save Settings
          </button>
        </div>
      </div>
    `;
    
    modal.classList.remove('hidden');
    modalBg.classList.remove('hidden');
    
    // Store callback
    this._settingsCallback = callback;
  },
  
  /**
   * Save optimization settings
   */
  saveSettings() {
    const settings = {
      autoCrop: document.getElementById('opt-autocrop').checked,
      resize: document.getElementById('opt-resize').checked,
      targetSize: parseInt(document.getElementById('opt-size').value),
      removeBackground: document.getElementById('opt-bg-remove').checked,
      format: document.getElementById('opt-format').value,
      compress: document.getElementById('opt-compress').checked
    };
    
    localStorage.setItem('imageOptSettings', JSON.stringify(settings));
    
    if (this._settingsCallback) {
      this._settingsCallback(settings);
      this._settingsCallback = null;
    }
    
    closeModal();
    Utils.notify('✓ Settings saved!', 'success');
  },
  
  /**
   * Get saved optimization settings
   */
  getSettings() {
    const saved = JSON.parse(localStorage.getItem('imageOptSettings') || '{}');
    return {
      removeBackground: false,
      resize: true,
      targetSize: this.WOOCOMMERCE_SIZE,
      compress: true,
      format: 'webp',
      autoCrop: true,
      ...saved
    };
  }
};

window.ImageOptimizer = ImageOptimizer;
console.log('✅ ImageOptimizer loaded');
