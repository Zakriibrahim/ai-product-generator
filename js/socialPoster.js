/**
 * Social Poster - Facebook posting + Social tab
 * - Header "Post to Facebook" button next to Upload to WooCommerce
 * - Posts selected products, or all if none selected
 * - Photo post with caption (uses first image), text-only fallback
 * - Uses CONFIG.FACEBOOK, but can override with values saved in localStorage (kept on your machine)
 * - Auto-resolves Page token from a User token via /me/accounts
 * - Friendly handling of expired tokens (code 190/subcode 463)
 */
const SocialPoster = {
  GRAPH_VERSION: 'v19.0',
  LS_PAGE_ID: 'fbPageId',
  LS_PAGE_TOKEN: 'fbPageToken',

  init() {
    this.injectTab();
    this.injectHeaderButton();
    this.bindUI();
    this.prefillFromConfig();
  },

  // Header button (next to Fetch)
  injectHeaderButton() {
    const fetchBtn = document.getElementById('fetchProductsBtn');
    if (!fetchBtn) return;
    if (document.getElementById('postToFacebookBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'postToFacebookBtn';
    btn.className = 'btn btn-blue';
    btn.innerHTML = '<i class="fab fa-facebook"></i> Post to Facebook';
    fetchBtn.insertAdjacentElement('afterend', btn);
    btn.addEventListener('click', () => this.openConfirmModal());
  },

  // Tab injection (inside main card for clean layout)
  injectTab() {
    const tabContainer = document.querySelector('.tab-container');
    if (tabContainer && !document.querySelector('.tab-btn[data-tab="social"]')) {
      const btn = document.createElement('button');
      btn.className = 'tab-btn';
      btn.setAttribute('data-tab', 'social');
      btn.innerHTML = '<i class="fas fa-share-alt"></i> Social Posts';
      btn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (window.TabManager) TabManager.switchTab('social');
        else if (window.switchTab) switchTab('social');
      });
      tabContainer.appendChild(btn);
    }

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
              One-click post via the header button. Manage your Page ID/Token here if needed.
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
                <p class="text-xs text-zinc-500 mt-1">Tip: Posting will automatically use the first image of each product.</p>
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

              <div class="mb-2">
                <label class="block font-semibold mb-2">Page Access Token or User Token</label>
                <input id="fbPageToken" type="password" placeholder="EAAG..."
                      class="w-full p-3 border-2 border-zinc-200 rounded-lg focus:border-indigo-500 focus:outline-none">
              </div>
              <div class="flex gap-2 mb-3">
                <button id="saveFbCredsBtn" class="btn btn-indigo btn-sm">
                  <i class="fas fa-save"></i> Save Token Locally
                </button>
                <button id="clearFbCredsBtn" class="btn btn-pink btn-sm">
                  <i class="fas fa-eraser"></i> Clear Saved Token
                </button>
              </div>

              <div class="bg-zinc-50 border rounded p-3 text-sm text-zinc-600">
                <p><strong>Tip:</strong> You can paste a User token here; we’ll auto-resolve your Page token using /me/accounts for your Page ID.</p>
                <p class="mt-1">If your token expires, you’ll be prompted to paste a fresh one.</p>
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
    const captionEl = document.getElementById('socialCaption');
    const counterEl = document.getElementById('socialCharCount');
    if (captionEl) {
      const update = () => { counterEl && (counterEl.textContent = `${captionEl.value.length} / 2200`); };
      captionEl.addEventListener('input', update); update();
    }

    document.getElementById('socialUseSelectedBtn')?.addEventListener('click', () => this.fillFromSelected());

    document.getElementById('socialCopyCaptionBtn')?.addEventListener('click', () => {
      const text = (document.getElementById('socialCaption')?.value || '').trim();
      if (!text) return Utils.notify('Nothing to copy', 'warning');
      navigator.clipboard.writeText(text).then(() => Utils.notify('Caption copied', 'success'));
    });

    document.getElementById('saveFbCredsBtn')?.addEventListener('click', () => {
      const id = (document.getElementById('fbPageId')?.value || '').trim();
      const tok = (document.getElementById('fbPageToken')?.value || '').trim();
      if (!id || !tok) return Utils.notify('Enter Page ID and a token first', 'warning');
      try {
        localStorage.setItem(this.LS_PAGE_ID, id);
        localStorage.setItem(this.LS_PAGE_TOKEN, tok);
        Utils.notify('Saved locally', 'success');
      } catch { Utils.notify('Could not save locally', 'error'); }
    });

    document.getElementById('clearFbCredsBtn')?.addEventListener('click', () => {
      try {
        localStorage.removeItem(this.LS_PAGE_ID);
        localStorage.removeItem(this.LS_PAGE_TOKEN);
        Utils.notify('Cleared local token', 'success');
      } catch {}
    });
  },

  prefillFromConfig() {
    const cfg = (window.CONFIG && window.CONFIG.FACEBOOK) ? window.CONFIG.FACEBOOK : {};
    const idFromLS = localStorage.getItem(this.LS_PAGE_ID);
    const tokFromLS = localStorage.getItem(this.LS_PAGE_TOKEN);

    const idEl = document.getElementById('fbPageId');
    const tokEl = document.getElementById('fbPageToken');

    const pageId = idFromLS || cfg.PAGE_ID || '';
    const token = tokFromLS || cfg.PAGE_ACCESS_TOKEN || '';

    if (idEl && pageId) idEl.value = pageId;
    if (tokEl && token) tokEl.value = token;
  },

  // Confirm and batch post
  openConfirmModal() {
    const products = this._getTargets();
    if (products.length === 0) return Utils.notify('No products to post. Generate or fetch first.', 'warning');

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
              Products to post: <strong>${products.length}</strong><br>
              Mode: <strong>${ProductManager.selectedIndices?.length ? 'Selected only' : 'All products'}</strong>
            </p>
          </div>
          <p class="text-sm text-zinc-600">We will use your Page ID and Token from the Social tab (or CONFIG). If you pasted a User token, we’ll attempt to auto-resolve the Page token.</p>
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
    const btn = document.getElementById('postToFacebookBtn');
    const original = btn ? btn.innerHTML : '';
    if (btn) btn.disabled = true;

    try {
      // Resolve a good token before starting (handles user token -> page token, and basic validity check)
      const { pageId, token } = await this.validateAndResolveToken();

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
          const friendly = this._friendlyError(e);
          Utils.notify(`✗ Failed: ${p.title} — ${friendly}`, 'error', 6000);
          console.error('Facebook post error:', e);
          // If token expired mid-run, stop and prompt refresh
          if (this._isExpiredError(e)) {
            Utils.notify('Your token expired. Paste a fresh token in Social tab.', 'warning', 6000);
            break;
          }
        }
        await this._sleep(650);
      }

      if (fail === 0) {
        Utils.notify(`🎉 Posted ${ok}/${products.length} products successfully!`, 'success', 5000);
      } else {
        Utils.notify(`⚠ Posted ${ok}, Failed ${fail}. See console for details.`, 'warning', 6000);
      }
    } finally {
      if (btn) { btn.innerHTML = original; btn.disabled = false; }
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

  async validateAndResolveToken() {
    // Prefer saved values in the Social tab; fallback to CONFIG
    const pageIdInput = (document.getElementById('fbPageId')?.value || '').trim();
    const tokenInput  = (document.getElementById('fbPageToken')?.value || '').trim();
    const pageId = pageIdInput || (CONFIG?.FACEBOOK?.PAGE_ID || '').trim();
    const token  = tokenInput || (CONFIG?.FACEBOOK?.PAGE_ACCESS_TOKEN || '').trim();

    if (!pageId || !token) {
      if (window.switchTab) switchTab('social');
      throw new Error('Missing Facebook Page ID or Access Token');
    }

    // Quick sanity check: is token valid at all?
    try {
      // This will work for both user token and page token; we only check that it’s not expired/invalid.
      const meRes = await fetch(`https://graph.facebook.com/${this.GRAPH_VERSION}/me?fields=id,name&access_token=${encodeURIComponent(token)}`);
      if (!meRes.ok) throw await meRes.text();
      // If it's a user token, resolve the Page token via /me/accounts
      const me = await meRes.json();
      if (me && me.id && String(me.id) !== String(pageId)) {
        // Likely a user token; attempt to fetch page tokens and pick the configured Page
        const accountsRes = await fetch(`https://graph.facebook.com/${this.GRAPH_VERSION}/me/accounts?access_token=${encodeURIComponent(token)}`);
        if (accountsRes.ok) {
          const data = await accountsRes.json();
          const match = (data?.data || []).find(p => String(p.id) === String(pageId));
          if (match?.access_token) {
            return { pageId, token: match.access_token };
          }
        }
      }
      // Otherwise assume token is a valid Page token (or at least not expired)
      return { pageId, token };
    } catch (e) {
      // If this fails, the token is invalid/expired
      if (window.switchTab) switchTab('social');
      throw new Error('Token invalid or expired. Generate a fresh token in Graph API Explorer and paste it in Social tab.');
    }
  },

  async postPhoto(pageId, token, imageUrl, caption) {
    const url = `https://graph.facebook.com/${this.GRAPH_VERSION}/${encodeURIComponent(pageId)}/photos`;
    const fd = new FormData();
    fd.append('url', imageUrl);
    if (caption) fd.append('caption', caption);
    fd.append('access_token', token);
    const res = await fetch(url, { method: 'POST', body: fd });
    await this._ensureOk(res);
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
    await this._ensureOk(res);
    const json = await res.json();
    if (!json || !json.id) throw new Error('No post ID returned');
    return json;
  },

  async _ensureOk(res) {
    if (res.ok) return;
    let text = '';
    try { text = await res.text(); } catch {}
    throw new Error(text || `HTTP ${res.status}`);
  },

  _friendlyError(e) {
    const msg = String(e?.message || e);
    try {
      const j = JSON.parse(msg);
      if (j?.error?.message) return j.error.message;
    } catch {}
    if (msg.includes('code":190')) return 'Token expired. Generate a new token and paste it in Social tab.';
    return msg.slice(0, 300);
  },

  _isExpiredError(e) {
    const msg = String(e?.message || e);
    return /"code":\s*190/.test(msg);
  },

  // Targets and helpers
  _getTargets() {
    const all = ProductManager?.products || [];
    const sel = ProductManager?.selectedIndices || [];
    return sel.length ? sel.map(i => all[i]).filter(Boolean) : all;
  },

  fillFromSelected() {
    const targets = this._getTargets();
    if (!targets.length) return Utils.notify('No products selected/found', 'warning');
    const p = targets[0];
    const cap = this.buildCaption(p);
    const img = (p.galleryImageUrls || [])[0] || '';
    const capEl = document.getElementById('socialCaption');
    const imgEl = document.getElementById('socialImageUrl');
    if (capEl) capEl.value = cap;
    if (imgEl) imgEl.value = img;
    const counterEl = document.getElementById('socialCharCount');
    if (counterEl) counterEl.textContent = `${capEl.value.length} / 2200`;
    Utils.notify(`Filled from product: ${p.title}`, 'success');
  },

  _sleep(ms) { return new Promise(r => setTimeout(r, ms)); },
  _truncate(t, n) { return (t && t.length > n) ? t.slice(0, n) + '...' : (t || ''); }
};

document.addEventListener('DOMContentLoaded', () => {
  try { SocialPoster.init(); } catch (e) { console.error('SocialPoster init failed:', e); }
});
console.log('✅ SocialPoster loaded: Facebook posting with token auto-resolution and expiry handling');
