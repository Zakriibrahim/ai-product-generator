/**
 * Social Poster - Social Posts tab (modernized) + Facebook cURL helper
 * - Injects a new "Social Posts" tab dynamically (no manual HTML edits)
 * - Lets you compose a caption from selected product
 * - Generates a ready-to-run cURL to post to a Facebook Page
 *   Note: Browser posting to Graph API is often blocked by CORS; use the cURL in your terminal.
 */

const SocialPoster = {
  init() {
    this.injectTab();
    this.bindUI();
    this.prefillFromConfig();
    this.updateCounter();
  },

  injectTab() {
    // 1) Add a new tab button if missing
    const tabContainer = document.querySelector('.tab-container');
    if (tabContainer && !document.querySelector('.tab-btn[data-tab="social"]')) {
      const btn = document.createElement('button');
      btn.className = 'tab-btn';
      btn.setAttribute('data-tab', 'social');
      btn.innerHTML = '<i class="fas fa-share-alt"></i> Social Posts';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.TabManager) TabManager.switchTab('social');
        else if (window.switchTab) switchTab('social');
      });
      tabContainer.appendChild(btn);
    }

    // 2) Add the tab content if missing
    if (!document.getElementById('tab-social')) {
      const socialTab = document.createElement('div');
      socialTab.id = 'tab-social';
      socialTab.className = 'tab-content';
      socialTab.innerHTML = `
        <div class="p-4">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-indigo-700">
              <i class="fas fa-share-alt"></i> Social Posts
            </h2>
            <div class="text-sm text-gray-500">
              Create and share posts easily.
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-6">
            <div class="bg-white border-2 border-gray-300 rounded-xl p-4">
              <h3 class="font-semibold text-indigo-700 mb-3">Compose Post</h3>

              <div class="mb-3">
                <label class="block font-semibold mb-2">Caption</label>
                <textarea id="socialCaption" rows="8"
                  class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none resize-none"
                  placeholder="Write your post caption..."></textarea>
                <div class="text-xs text-gray-500 mt-1">Characters: <span id="socialCharCount">0 / 2200</span></div>
              </div>

              <div class="mb-3">
                <label class="block font-semibold mb-2">Image URL</label>
                <input id="socialImageUrl" type="text" placeholder="https://..."
                  class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none">
                <p class="text-xs text-gray-500 mt-1">Add a valid image URL.</p>
              </div>

              <div class="flex gap-2 flex-wrap">
                <button id="socialUseSelectedBtn" class="btn btn-blue btn-sm">
                  <i class="fas fa-magic"></i> Use Selected Product
                </button>
                <button id="socialGenerateCurlBtn" class="btn btn-green btn-sm">
                  <i class="fas fa-terminal"></i> Generate cURL
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(socialTab);
    }
  },

  bindUI() {
    // Bind events for the buttons
    const generateCurlBtn = document.getElementById('socialGenerateCurlBtn');
    if (generateCurlBtn) {
      generateCurlBtn.addEventListener('click', () => {
        const caption = document.getElementById('socialCaption').value;
        const imageUrl = document.getElementById('socialImageUrl').value;
        const curlCommand = `curl -X POST "https://graph.facebook.com/v19.0/${CONFIG.FACEBOOK.PAGE_ID}/photos" -F "url=${imageUrl}" -F "caption=${caption}" -F "access_token=${CONFIG.FACEBOOK.PAGE_ACCESS_TOKEN}"`;
        navigator.clipboard.writeText(curlCommand).then(() => {
          alert('cURL command copied to clipboard!');
        });
      });
    }
  },

  prefillFromConfig() {
    // Prefill values from the config
    const captionField = document.getElementById('socialCaption');
    if (captionField) captionField.value = 'Check out this amazing product!';
  },

  updateCounter() {
    const captionField = document.getElementById('socialCaption');
    const charCounter = document.getElementById('socialCharCount');
    if (captionField && charCounter) {
      captionField.addEventListener('input', () => {
        const charCount = captionField.value.length;
        charCounter.textContent = `${charCount} / 2200`;
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  SocialPoster.init();
});
