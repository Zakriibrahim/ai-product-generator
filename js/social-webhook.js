class SocialWebhookManager {
  constructor() {
    this.webhookURL = CONFIG.SOCIAL_WEBHOOK.URL;
    this.platforms = CONFIG.SOCIAL_WEBHOOK.PLATFORMS;
  }

  async postToSocial(products, selectedPlatforms = ['facebook']) {
    try {
      window.uiManager.showLoading('Posting to social media...');

      const payload = {
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          shortDescription: p.short_description,
          price: p.price,
          images: p.images,
          categories: p.categories,
          tags: p.tags
        })),
        platforms: selectedPlatforms,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(this.webhookURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to post to social media');
      }

      const result = await response.json();
      
      window.uiManager.hideLoading();
      alert(`✅ Successfully posted to ${selectedPlatforms.join(', ')}!`);
      
      return result;
    } catch (error) {
      window.uiManager.hideLoading();
      window.uiManager.showError('Error posting to social media: ' + error.message);
      throw error;
    }
  }

  async showPlatformSelection(products) {
    const modalContent = `
      <h3 class="text-2xl font-bold mb-4 text-indigo-700">
        <i class="fas fa-share-alt"></i> Select Social Media Platforms
      </h3>
      <div class="space-y-3 mb-6">
        ${this.platforms.map(platform => `
          <label class="flex items-center gap-3 p-3 border-2 border-zinc-200 rounded-lg cursor-pointer hover:border-indigo-400 transition">
            <input type="checkbox" name="platform" value="${platform}" class="w-5 h-5" checked>
            <span class="flex items-center gap-2 text-lg">
              <i class="fab fa-${platform} text-2xl"></i>
              <span class="font-semibold capitalize">${platform}</span>
            </span>
          </label>
        `).join('')}
      </div>
      <div class="flex gap-3 justify-end">
        <button onclick="window.socialWebhook.closeModal()" class="btn btn-gray">
          Cancel
        </button>
        <button onclick="window.socialWebhook.confirmPost()" class="btn btn-blue">
          <i class="fas fa-paper-plane"></i> Post Now
        </button>
      </div>
    `;

    this.currentProducts = products;
    document.getElementById('modalCard').innerHTML = modalContent;
    document.getElementById('modalBg').style.display = 'flex';
  }

  confirmPost() {
    const checkboxes = document.querySelectorAll('input[name="platform"]:checked');
    const selectedPlatforms = Array.from(checkboxes).map(cb => cb.value);

    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }

    this.closeModal();
    this.postToSocial(this.currentProducts, selectedPlatforms);
  }

  closeModal() {
    document.getElementById('modalBg').style.display = 'none';
    document.getElementById('modalCard').innerHTML = '';
    this.currentProducts = null;
  }
}

window.socialWebhook = new SocialWebhookManager();
