/**
 * Social Poster - Facebook posting + Social tab
 * - Injects a "Post to Facebook" button next to Upload to WooCommerce
 * - One-click: post selected products, or all if none selected
 * - Photo post (with caption) when an image exists; text-only fallback
 * - Uses CONFIG.FACEBOOK.PAGE_ID and PAGE_ACCESS_TOKEN
 * - Clean confirm modal and progress notifications
 */
const SocialPoster = {
  GRAPH_VERSION: 'v19.0',

  init() {
    // Inject tab (inside main card) and header button
    this.injectTab();
    this.injectHeaderButton();
    // Bind any static UI handlers (tab area)
    this.bindUI();
    // Prefill page/token into tab inputs, if present
    this.prefillFromConfig();
  },

  // --------------------------
  // Header button
  // --------------------------
  injectHeaderButton() {
    // Find the existing header actions by locating the Fetch button
    const fetchBtn = document.getElementById('fetchProductsBtn');
    if (!fetchBtn) return;

    // Avoid duplicates
    if (document.getElementById('postToFacebookBtn')) return;

    // Create the new button
    const btn = document.createElement('button');
    btn.id = 'postToFacebookBtn';
    btn.className = 'btn btn-blue';
    btn.innerHTML = '<i class="fab fa-facebook"></i> Post to Facebook';

    // Insert right after Fetch from Store
    fetchBtn.insertAdjacentElement('afterend', btn);

    // Bind click
    btn.addEventListener('click', () => this.openConfirmModal());
  },

  // --------------------------
  // Tab injection (layout fix)
  // --------------------------
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

    // 2) Add the tab content if missing (append inside main card for clean layout)
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
              Compose a caption or post directly using your configured Page.
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
                <p class="text-xs text-zinc-500 mt-1">Tip: The Post button will auto-use the first image of each product.</p>
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
                <p class="text-xs text-zinc-500 mt-1">Kept client-side; use with caution. Prefer server or cURL for production.</p>
              </div>

              <div class="bg-zinc-50 border rounded p-3 text-sm text-zinc-600 mb-3">
                <p><strong>One‑click Post:</strong> Use the header "Post to Facebook" button. It posts selected products (or all if none selected).</p>
              </div>
            </div>
          </div>
        </div>
      `;
      const mainCard = document.querySelector('.bg-white.rounded-xl.shadow-lg.p-4.mb-6');
      if (mainCard) mainCard.appendChild(socialTab); else document.body.appendChild(socialTab);
    }
  },

  bindUI() {
    // Compose helpers in the Social tab
    const captionEl = document.getElementById('socialCaption');
    const counterEl = document.getElementById('socialCharCount');
    if (captionEl) {
      const update = () => { counterEl && (counterEl.textContent = `${captionEl.value.length} / 2200`); };
      captionEl.addEventListener('input', update);
      update();
    }

    const useSelBtn = document.getElementById('socialUseSelectedBtn');
    if (useSelBtn) useSelBtn.addEventListener('click', () => this.fillFromSelected());

    const copyCapBtn = document.getElementById('socialCopyCaptionBtn');
    if (copyCapBtn) copyCapBtn.addEventListener('click', () => {
      const text = (document.getElementById('socialCaption')?.value || '').trim();
      if (!text) return Utils.notify('Nothing to copy', 'warning');
      navigator.clipboard.writeText(text).then(() => Utils.notify('Caption copied', 'success'));
    });
  },

  prefillFromConfig() {
    const cfg = (window.CONFIG && window.CONFIG.FACEBOOK) ? window.CONFIG.FACEBOOK : {};
    const idEl = document.getElementById('fbPageId');
    const tokEl = document.getElementById('fbPageToken');
    if (idEl && cfg.PAGE_ID) idEl.value = cfg.PAGE_ID;
    if (tokEl && cfg.PAGE_ACCESS_TOKEN) tokEl.value = cfg.PAGE_ACCESS_TOKEN;
  },

  // --------------------------
  // Confirm + Batch post
  // --------------------------
  openConfirmModal() {
    const products = this._getTargets();
    if (products.length === 0) {
      Utils.notify('No products to post. Generate or fetch first.', 'warning');
      return;
    }
    const { pageId, token } = this._getPageCreds();
    if (!pageId || !token) {
      Utils.notify('Missing Facebook Page ID or Access Token. Fill them in Social Posts tab or CONFIG.', 'error', 5000);
      if (window.switchTab) switchTab('social');
      return;
    }

    const modal = document.getElementById('modalContainer');
    const modalBg = document.getElementById('modalBg');
    modal.innerHTML = `
      <div class="modal-card">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-indigo-700"><i class="fab fa-facebook"></i> Post to Facebook</h2>
          <button onclick="closeModal()" class="text-3xl text-zinc-400 hover:text-zinc-600"><i class="fas fa-times"></i></button>
        </div>
        <div class="space-y-4">
          <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p class="text-sm text-blue-800">
              Target Page: <strong>${this._escape(pageId)}</strong><br>
              Products: <strong>${products.length}</strong><br>
              Mode: <strong>${ProductManager.selectedIndices?.length ? 'Selected only' : 'All products'}</strong>
            </p>
          </div>
          <p class="text-sm text-zinc-600">This will post each product one-by-one. If a product has an image, we post it as a photo with caption; otherwise as a text post.</p>
        </div>
        <div class="flex gap-3 justify-end mt-6 pt-6 border-t">
          <button onclick="closeModal()" class="btn btn-gray"><i class="fas fa-times"></i> Cancel</button>
          <button id="confirmFbPostBtn" class="btn btn-indigo"><i class="fas fa-paper-plane"></i> Start Posting</button>
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
    modalBg.classList.remove('hidden');

    document.getElementById('confirmFbPostBtn')?.addEventListener('click', async () => {
      closeModal();
      await this.postBatch(products);
    });
  },

  async postBatch(products) {
    const { pageId, token } = this._getPageCreds();
    const btn = document.getElementById('postToFacebookBtn');
    const original = btn ? btn.innerHTML : '';
    if (btn) btn.disabled = true;

    let ok = 0, fail = 0;
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (btn) btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Posting ${i + 1}/${products.length}...`;
      try {
        const caption = this.buildCaption(p);
        const imageUrl = (p.galleryImageUrls || [])[0] || '';
        if (imageUrl) {
          await this.postPhoto(pageId, token, imageUrl, caption);
        } else {
          await this.postText(pageId, token, caption);
        }
        ok++;
        Utils.notify(`✓ Posted: ${p.title}`, 'success', 2000);
      } catch (e) {
        fail++;
        Utils.notify(`✗ Failed: ${p.title} — ${e.message}`, 'error', 4000);
        console.error('Facebook post error:', e);
      }
      // Small delay to avoid rate limits
      await this._sleep(600);
    }

    if (btn) { btn.innerHTML = original; btn.disabled = false; }
    if (fail === 0) {
      Utils.notify(`🎉 Posted ${ok}/${products.length} products successfully!`, 'success', 5000);
    } else {
      Utils.notify(`⚠ Posted ${ok}, Failed ${fail}. See console for details.`, 'warning', 6000);
    }
  },

  buildCaption(product) {
    const baseCaption = (document.getElementById('socialCaption')?.value || '').trim();
    if (baseCaption) return baseCaption;

    const priceText = product.price ? `${parseFloat(product.price).toFixed(2)} MAD` : '';
    const tags = (product.tags || []).slice(0, 5).map(t => `#${String(t).replace(/\s+/g, '')}`).join(' ');
    const desc = product.short_description || (product.description ? this._truncate(product.description, 140) : '');
    return [product.title || '', '', desc, '', priceText, tags].filter(Boolean).join('\n');
  },

  async postPhoto(pageId, token, imageUrl, caption) {
    const url = `https://graph.facebook.com/${this.GRAPH_VERSION}/${encodeURIComponent(pageId)}/photos`;
    const fd = new FormData();
    fd.append('url', imageUrl);
    if (caption) fd.append('caption', caption);
    fd.append('access_token', token);
    const res = await fetch(url, { method: 'POST', body: fd });
    if (!res.ok) {
      let text = '';
      try { text = await res.text(); } catch {}
      throw new Error(text || `HTTP ${res.status}`);
    }
    const json = await res.json();
    if (!json || !json.id) throw new Error('No photo ID returned');
    return json;
  },

  async postText(pageId, token, message) {
    const url = `https://graph.facebook.com/${this.GRAPH_VERSION}/${encodeURIComponent(pageId)}/feed`;
    const fd = new FormData();
    fd.append('message', message || '');
    fd.append('access_token', token);
    const res = await fetch(url, { method: 'POST', body: fd });
    if (!res.ok) {
      let text = '';
      try { text = await res.text(); } catch {}
      throw new Error(text || `HTTP ${res.status}`);
    }
    const json = await res.json();
    if (!json || !json.id) throw new Error('No post ID returned');
    return json;
  },

  // --------------------------
  // Helpers
  // --------------------------
  _getTargets() {
    const all = ProductManager?.products || [];
    const selectedIdx = ProductManager?.selectedIndices || [];
    if (selectedIdx.length > 0) {
      return selectedIdx.map(i => all[i]).filter(Boolean);
    }
    return all;
  },

  _getPageCreds() {
    // Prefer the Social tab values if present; else CONFIG
    const pageId = (document.getElementById('fbPageId')?.value || CONFIG?.FACEBOOK?.PAGE_ID || '').trim();
    const token  = (document.getElementById('fbPageToken')?.value || CONFIG?.FACEBOOK?.PAGE_ACCESS_TOKEN || '').trim();
    return { pageId, token };
  },

  fillFromSelected() {
    const targets = this._getTargets();
    if (targets.length === 0) return Utils.notify('No products selected/found', 'warning');
    const p = targets[0];
    const caption = this.buildCaption(p);
    const img = (p.galleryImageUrls || [])[0] || '';
    const capEl = document.getElementById('socialCaption');
    const imgEl = document.getElementById('socialImageUrl');
    if (capEl) capEl.value = caption;
    if (imgEl) imgEl.value = img;
    Utils.notify(`Filled from product: ${p.title}`, 'success');
  },

  _sleep(ms) { return new Promise(r => setTimeout(r, ms)); },
  _truncate(text, len) { return (text && text.length > len) ? text.slice(0, len) + '...' : (text || ''); },
  _escape(s) { return (s || '').replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
};

document.addEventListener('DOMContentLoaded', () => {
  try { SocialPoster.init(); } catch (e) { console.error('SocialPoster init failed:', e); }
});
console.log('✅ SocialPoster loaded: Facebook posting enabled');
