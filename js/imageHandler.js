/**
 * Image Handler
 * Handles image upload and processing
 */

const ImageHandler = {
  // Enable/disable optimization
  optimizationEnabled: true,
  
  /**
   * Convert File to Base64
   */
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  },
  
  /**
   * Convert Blob to Base64
   */
  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  },
  
  /**
   * Convert URL to Base64 (for loaded sessions)
   */
  async urlToBase64(url) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const blob = await response.blob();
        const reader = new FileReader();
        
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      } catch (error) {
        reject(error);
      }
    });
  },
  
  /**
   * Upload image to ImgBB
   */
  async uploadToImgbb(base64, filename) {
    const formData = new FormData();
    formData.append("key", CONFIG.IMGBB_API_KEY);
    formData.append("image", base64);
    formData.append("name", filename);
    
    const response = await fetch(CONFIG.IMGBB_API_URL, {
      method: "POST",
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`ImgBB upload failed (status ${response.status})`);
    }
    
    const data = await response.json();
    if (!data.success || !data.data || !data.data.url) {
      throw new Error("ImgBB upload failed: " + (data?.error?.message || "No URL returned"));
    }
    
    return data.data.url;
  },
  
  /**
   * Validate image file
   */
  validateImage(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!validTypes.includes(file.type)) {
      throw new Error(`Invalid file type: ${file.type}. Please use JPG, PNG, or WebP.`);
    }
    
    if (file.size > maxSize) {
      throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum is 10MB.`);
    }
    
    return true;
  },
  
  /**
   * Get image dimensions
   */
  async getImageDimensions(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }
};

window.ImageHandler = ImageHandler;

console.log('✅ ImageHandler loaded');
