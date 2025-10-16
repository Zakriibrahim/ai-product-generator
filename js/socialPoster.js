/**
 * Social Poster - Social Posts tab (dynamic) + Facebook cURL helper
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
            <div class="text-sm text-zinc-500">
              Compose social captions and copy a ready cURL to post to your Facebook Page.
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-6">
            <div class="bg-white border-2 border-zinc-200 rounded-xl p-4">
              <h3 class="font-semibold text-indigo-700 mb-3">Compose</h3>

              <div class="mb-3">
                <label class="block font-semibold mb-2">Caption</label>
                <textarea id="socialCaption" rows="8"
                  class="w-full p-3 border-2 border-zinc-200 rounded-lg focus:border-indigo-500 focus:outline-none resize-none"
                  placeholder="Write your post caption..."></textarea>
                <div class="text-xs text-zinc-500 mt-1">Characters: <span id="socialCharCount">0 / 2200</span></div>
              </div>

              <div class="mb-3">
                <label class="block font-semibold mb-2">Image URL (optional)</label>
                <input id="socialImageUrl" type="text" placeholder="https://..."
                      class="w-full p-3 border-2 border-zinc-200 rounded-lg focus:border-indigo-500 focus:outline-none">
                <p class="text-xs text-zinc-500 mt-1">Tip: Use the first image from a product card.</p>
              </div>

              <div class="flex gap-2 flex-wrap">
                <button id="socialUseSelectedBtn" class="btn btn-blue btn-sm">
                  <i class="fas fa-magic"></i> Use Selected Product
                </button>
                <button id="socialCopyCaptionBtn" class="btn btn-gray btn-sm">
                  <i class="fas fa-copy"></i> Copy Caption
                </button>
              </div>
            </div>

            <div class="bg-white border-2 border-zinc-200 rounded-xl p-4">
              <h3 class="font-semibold text-indigo-700 mb-3">Facebook Page</h3>

              <div class="mb-3">
                <label class="block font-semibold mb-2">Page ID</label>
                <input id="fbPageId" type="text" placeholder="1234567890"
                      class="w-full p-3 border-2 border-zinc-200 rounded-lg focus:border-indigo-500 focus:outline-none">
              </div>

              <div class="mb-3">
                <label class="block font-semibold mb-2">Page Access Token</label>
                <input id="fbPageToken" type="password" placeholder="EAAG...."
                      class="w-full p-3 border-2 border-zinc-200 rounded-lg focus:border-indigo-500 focus:outline-none">
                <p class="text-xs text-zinc-500 mt-1">Keep this private. Use the cURL below to post from your terminal.</p>
              </div>

              <div class="bg-zinc-50 border rounded p-3 text-sm text-zinc-600 mb-3">
                <p><strong>How to post:</strong> Click "Copy cURL" and run it in your terminal.</p>
                <p>Direct posting from the browser may be blocked by CORS.</p>
              </div>

              <div class="flex gap-2 flex-wrap">
                <button id="socialCopyCurlBtn" class="btn btn-indigo btn-sm">
                  <i class="fas fa-terminal"></i> Copy cURL
                </button>
                <button id="socialClearBtn" class="btn btn-pink btn-sm">
                  <i class="fas fa-eraser"></i> Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      const container = document.querySelector('.bg-white.rounded-xl.shadow-lg.p-4.mb-6');
      if (container) container.appendChild(socialTab);
      else document.body.appendChild(socialTab);
    }
  },

  bindUI() {
    document.getElementById('socialUseSelectedBtn')?.addEventListener('click', () => this.useSelectedProduct());
    document.getElementById('socialCopyCaptionBtn')?.addEventListener('click', () => this.copyCaption());
    document.getElementById('socialCopyCurlBtn')?.addEventListener('click', () => this.copyCurl());
    document.getElementById('socialClearBtn')?.addEventListener('click', () => this.clearForm());
    document.getElementById('socialCaption')?.addEventListener('input', () => this.updateCounter());
  },

  prefillFromConfig() {
    const cfg = (window.CONFIG && window.CONFIG.FACEBOOK) ? window.CONFIG.FACEBOOK : {};
    if (cfg.PAGE_ID) {
      const el = document.getElementById('fbPageId');
      if (el) el.value = cfg.PAGE_ID;
    }
    if (cfg.PAGE_ACCESS_TOKEN) {
      const el = document.getElementById('fbPageToken');
      if (el) el.value = cfg.PAGE_ACCESS_TOKEN;
    }
  },

  useSelectedProduct() {
    if (!window.ProductManager || !ProductManager.products.length) {
      Utils.notify('No products. Generate or fetch first.', 'warning'); return;
    }
    const indices = ProductManager.selectedIndices || [];
    const idx = indices.length ? indices[0] : 0;
    const p = ProductManager.products[idx] || ProductManager.products[0];
    if (!p) { Utils.notify('No product selected.', 'warning'); return; }

    const priceText = p.price ? `${parseFloat(p.price).toFixed(2)} MAD` : '';
    const tags = (p.tags || []).slice(0, 5).map(t => `#${String(t).replace(/\s+/g, '')}`).join(' ');
    const caption = [
      p.title || '',
      '',
      (p.short_description || Utils.truncate(p.description, 140) || ''),
      '',
      priceText,
      tags
    ].filter(Boolean).join('\n');

    const img = (p.galleryImageUrls || [])[0] || '';

    document.getElementById('socialCaption').value = caption;
    document.getElementById('socialImageUrl').value = img;
    this.updateCounter();

    Utils.notify(`Filled from product: ${p.title}`, 'success');
  },

  updateCounter() {
    const caption = document.getElementById('socialCaption')?.value || '';
    const el = document.getElementById('socialCharCount');
    if (el) {
      el.textContent = `${caption.length} / 2200`;
      el.style.color = caption.length > 2200 ? '#ef4444' : '#6b7280';
    }
  },

  copyCaption() {
    const caption = document.getElementById('socialCaption')?.value || '';
    if (!caption) { Utils.notify('Nothing to copy', 'warning'); return; }
    navigator.clipboard.writeText(caption).then(() => {
      Utils.notify('Caption copied to clipboard', 'success');
    }).catch(() => Utils.notify('Copy failed', 'error'));
  },

  buildCurl() {
    const pageId = (document.getElementById('fbPageId')?.value || '').trim();
    const token = (document.getElementById('fbPageToken')?.value || '').trim();
    const caption = (document.getElementById('socialCaption')?.value || '').trim();
    const imageUrl = (document.getElementById('socialImageUrl')?.value || '').trim();

    if (!pageId || !token) throw new Error('Page ID and Page Access Token are required');

    if (imageUrl) {
      return `curl -X POST "https://graph.facebook.com/v19.0/${pageId}/photos" \
  -F "url=${imageUrl}" \
  -F "caption=${caption.replace(/"/g, '\\"')}" \
  -F "access_token=${token}"`;
    }
    return `curl -X POST "https://graph.facebook.com/v19.0/${pageId}/feed" \
  -F "message=${caption.replace(/"/g, '\\"')}" \
  -F "access_token=${token}"`;
  },

  copyCurl() {
    try {
      const cmd = this.buildCurl();
      navigator.clipboard.writeText(cmd).then(() => {
        Utils.notify('cURL copied. Paste it in your terminal to post.', 'success', 5000);
      });
    } catch (e) {
      Utils.notify(e.message, 'error', 5000);
    }
  },

  clearForm() {
    ['fbPageId','fbPageToken','socialCaption','socialImageUrl'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    this.updateCounter();
  }
};

(function bootstrapSocialPoster(){
  const start = () => { try { SocialPoster.init(); } catch (e) { console.error('SocialPoster init failed:', e); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
console.log('✅ SocialPoster loaded');
