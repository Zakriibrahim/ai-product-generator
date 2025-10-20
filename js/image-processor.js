// Image Processing Functions
const imageProcessor = {
  async processImage(file) {
    const base64 = await this.fileToBase64(file);
    const optimized = await this.optimizeImage(base64);
    
    return {
      original: file,
      base64: optimized.base64,
      preview: optimized.preview,
      optimized: true,
      uploading: false,
      url: null
    };
  },

  async optimizeImage(base64Data) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > CONFIG.IMAGE_MAX_WIDTH || height > CONFIG.IMAGE_MAX_HEIGHT) {
          const ratio = Math.min(CONFIG.IMAGE_MAX_WIDTH / width, CONFIG.IMAGE_MAX_HEIGHT / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        const optimizedBase64 = canvas.toDataURL('image/jpeg', CONFIG.IMAGE_QUALITY);
        const base64Only = optimizedBase64.split(',')[1];

        resolve({
          base64: base64Only,
          preview: optimizedBase64,
          width,
          height
        });
      };
      img.onerror = reject;
      img.src = `data:image/jpeg;base64,${base64Data}`;
    });
  },

  async enhanceWithAI(base64Data) {
    const prompt = `Analyze this product image and provide enhancement instructions in JSON format:
{
  "needs_background_removal": true/false,
  "crop_suggestion": "description of optimal cropping",
  "lighting_adjustment": "description",
  "quality_issues": ["issue1", "issue2"]
}`;

    try {
      const result = await api.callGemini(prompt, [base64Data]);
      return JSON.parse(result);
    } catch (e) {
      console.error('AI enhancement analysis failed:', e);
      return null;
    }
  },

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  }
};
