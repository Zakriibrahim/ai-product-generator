/**
 * Social Poster - Webhook/Backend posting
 * - Always uses your default webhook unless you override it in the UI
 * - Adds "Use this caption for all posts" checkbox; avoids stale captions
 * - Posts selected products, or all if none selected
 * - Skips file:/// health check; backend is optional
 */
const SocialPoster = {
  // Your default Make webhook (hardcoded so you never re-enter it)
  DEFAULT_WEBHOOK: "https://hook.eu2.make.com/6fj2x2monxp086wde3qxx39ypbw5vf6y",

  // LocalStorage key to optionally override the webhook
  LS_WEBHOOK_URL: 'socialWebhookUrl',

  // Optional backend autodetect (can ignore if you only use webhook)
  API_CANDIDATES: ['', 'http://localhost:3000'],
  _apiBase: null,

  async init() {
    this.injectHeaderButton();
    this.injectTab();
    this.bindUI();
    await this.detectApiBase();
  },

  // Prefer saved webhook; else the default hardcoded value
  getWebhook() {
    const local = localStorage.getItem(this.LS_WEBHOOK_URL);
    return (local && local.trim()) ? local.trim() : this.DEFAULT_WEBHOOK;
  },

  async detectApiBase() {
    // If opened from file://, skip same-origin candidate to avoid file:///api/health error
    const candidates = (location.protocol === 'file:')
      ? ['http://localhost:3000']
      : this.API_CANDIDATES;

    for (const base of candidates) {
      try {
        const url = base ? `${base}/api/health` : '/api/health';
        const res = await fetch(url, { method: 'GET' });
        if (res.ok) {
          const j = await res.json();
          if (j && j.ok) {
            this._apiBase = base;
            console.log('✅ SocialPoster API base:', this._apiBase || '(same origin)');
            this.updateStatus();
            return;
          }
        }
      } catch {}
    }
    this._apiBase = null;
    console.warn('⚠ No backend detected. Webhook mode will be used.');
    this.updateStatus();
  },

  api(path) {
    return (this._apiBase ? this._apiBase : '') + path;
  },

  // Header button next to "Fetch from Store"
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

  // Social tab with Webhook URL field and a caption toggle
  injectTab() {
    const tabContainer = document.querySelector('.tab-container');
    if (tabContainer && !document.querySelector('.tab-btn[data-tab="social"]')) {
      const btn = document.createElement('button');
      btn.className = 'tab-btn';
      btn.setAttribute('data-tab', 'social');
      btn.innerHTML = '<i class="fas fa-share-alt"></i> Social Posts';
      btn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (window.TabManager) TabManager.switchTab('social'); else if (window.switchTab) switchTab('social');
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
            <h2 class="text-2xl font-bold text-indigo-700"><i class="fas fa-share-alt"></i> Social Posts</h2>
            <div class="text-sm text-zinc-500">Uses your saved webhook by default. Backend is optional.</div>
          </div>

          <div class="grid md:grid-cols-2 gap-6">
            <div class="bg-white border-2 border-zinc-200 rounded-xl p-4">
              <h3 class="font-semibold text-indigo-700 mb-3">Compose (optional)</h3>

              <div class="mb-3">
                <label class="block font-semibold mb-2">Caption</label>
                <textarea id="socialCaption" rows="8" class="w-full p-3 border-2 border-zinc-200 rounded-lg focus:border-indigo-500 focus:outline-none resize-none" placeholder="Write your post caption..."></textarea>
                <div class="flex items-center gap-2 mt-2">
                  <input id="useComposeCaption" type="checkbox" class="w-4 h-4">
                  <label for="useComposeCaption" class="text-sm text-zinc-700">Use this caption for all posts</label>
                </div>
                <div class="text-xs text-zinc-500 mt-1">Characters: <span id="socialCharCount">0 / 2200</span></div>
              </div>

              <div class="mb-3">
                <label class="block font-semibold mb-2">Image URL (optional)</label>
                <input id="socialImageUrl" type="text" placeholder="https://..." class="w-full p-3 border-2 border-zinc-200 rounded-lg focus:border-indigo-500 focus:outline-none">
                <p class="text-xs text-zinc-500 mt-1">If blank, we use each product's first image. Without image, we post text-only.</p>
              </div>

              <div class="flex gap-2">
                <button id="socialUseSelectedBtn" class="btn btn-blue btn-sm"><i class="fas fa-magic"></i> Use Selected Product</button>
                <button id="socialCopyCaptionBtn" class="btn btn-gray btn-sm"><i class="fas fa-copy"></i> Copy Caption</button>
              </div>
            </div>

            <div class="bg-white border-2 border-zinc-200 rounded-xl p-4">
              <h3 class="font-semibold text-indigo-700 mb-3">Webhook / Backend</h3>

              <div class="mb-3">
                <label class="block font-semibold mb-2">Webhook URL (Make/Zapier)</label>
                <input id="socialWebhookUrl" type="text" placeholder="https://hook.integromat.com/..." class="w-full p-3 border-2 border-zinc-200 rounded-lg focus:border-indigo-500 focus:outline-none">
                <div class="flex gap-2 mt-2">
                  <button id="saveWebhookBtn" class="btn btn-indigo btn-sm"><i class="fas fa-save"></i> Save</button>
                  <button id="clearWebhookBtn" class="btn btn-pink btn-sm"><i class="fas fa-eraser"></i> Clear</button>
                </div>
                <p class="text-xs text-zinc-500 mt-2">If empty, we will use the default webhook baked into the app.</p>
              </div>

              <div id="socialBackendStatus" class="text-sm text-zinc-600">Status: ...</div>
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
      const update = () => { if (counterEl) counterEl.textContent = `${captionEl.value.length} / 2200`; };
      captionEl.addEventListener('input', update); update();
    }

    document.getElementById('socialUseSelectedBtn')?.addEventListener('click', () => this.fillFromSelected());
    document.getElementById('socialCopyCaptionBtn')?.addEventListener('click', () => {
      const text = (document.getElementById('socialCaption')?.value || '').trim();
      if (!text) return Utils.notify('Nothing to copy', 'warning');
      navigator.clipboard.writeText(text).then(() => Utils.notify('Caption copied', 'success'));
    });

    // Webhook save/clear
    const urlInput = document.getElementById('socialWebhookUrl');
    const saved = localStorage.getItem(this.LS_WEBHOOK_URL);
    const effective = saved || this.DEFAULT_WEBHOOK;
    if (urlInput) urlInput.value = saved || '';

    document.getElementById('saveWebhookBtn')?.addEventListener('click', () => {
      const url = (document.getElementById('socialWebhookUrl')?.value || '').trim();
      if (!url) return Utils.notify('Enter a webhook URL first', 'warning');
      try { localStorage.setItem(this.LS_WEBHOOK_URL, url); Utils.notify('Webhook saved locally', 'success'); this.updateStatus(); }
      catch { Utils.notify('Could not save webhook URL', 'error'); }
    });
    document.getElementById('clearWebhookBtn')?.addEventListener('click', () => {
      try { localStorage.removeItem(this.LS_WEBHOOK_URL); if (document.getElementById('socialWebhookUrl')) document.getElementById('socialWebhookUrl').value=''; Utils.notify('Webhook cleared (default will be used)', 'success'); this.updateStatus(); }
      catch {}
    });

    this.updateStatus();
  },

  updateStatus() {
    const s = document.getElementById('socialBackendStatus');
    if (!s) return;
    const saved = localStorage.getItem(this.LS_WEBHOOK_URL);
    const effectiveWebhook = this.getWebhook();
    const usingDefault = !saved && !!this.DEFAULT_WEBHOOK;

    const parts = [];
    parts.push(`Webhook: <span class="text-green-700">SET</span> ${usingDefault ? '(default)' : '(custom)'}`);
    parts.push(`Backend: ${this._apiBase !== null ? '<span class="text-green-700">AVAILABLE</span>' : '<span class="text-yellow-700">NOT DETECTED</span>'}`);
    s.innerHTML = parts.join(' • ');
  },

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
            <p class="text-sm text-blue-800">Products to post: <strong>${products.length}</strong> — ${ProductManager.selectedIndices?.length ? 'Selected only' : 'All products'}</p>
            <p class="text-xs text-blue-800 mt-2">We will send to your webhook. Backend is ignored unless no webhook is set.</p>
          </div>
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
      // Build items for webhook/backend
      const useCompose = document.getElementById('useComposeCaption')?.checked;
      const composeCaption = (document.getElementById('socialCaption')?.value || '').trim();
      const forcedImage = (document.getElementById('socialImageUrl')?.value || '').trim();

      const items = products.map(p => {
        const caption = useCompose ? composeCaption : this.buildCaption(p);
        const imageUrl = forcedImage || (p.galleryImageUrls || [])[0] || '';
        return {
          title: p.title || '',
          sku: p.sku || '',
          price: p.price || '',
          permalink: p.permalink || '',
          imageUrl,
          caption
        };
      });

      if (btn) btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Posting ${items.length}...`;

      const webhook = this.getWebhook();
      if (webhook) {
        const res = await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items })
        });
        if (!res.ok) throw new Error(await res.text().catch(()=>'HTTP '+res.status));
        Utils.notify(`🎉 Sent ${items.length} item(s) to webhook`, 'success', 5000);
        return;
      }

      if (this._apiBase !== null) {
        const res = await fetch(this.api('/api/facebook/post-batch'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items })
        });
        if (!res.ok) throw new Error(await res.text().catch(()=>'HTTP '+res.status));
        const data = await res.json().catch(()=>({}));
        const posted = data?.posted ?? items.length;
        const failed = data?.failed ?? 0;
        if (failed === 0) Utils.notify(`🎉 Posted ${posted}/${items.length} via backend`, 'success', 6000);
        else Utils.notify(`⚠ Posted ${posted}, Failed ${failed} via backend`, 'warning', 6000);
        return;
      }

      Utils.notify('No Webhook set and no backend detected. Set a Webhook URL in Social tab (Make/Zapier).', 'error', 7000);
    } catch (e) {
      Utils.notify(`Post failed: ${String(e.message || e).slice(0, 200)}`, 'error', 8000);
      console.error('post-batch error:', e);
    } finally {
      if (btn) { btn.innerHTML = original; btn.disabled = false; }
    }
  },

  buildCaption(p) {
    const priceText = p.price ? `${parseFloat(p.price).toFixed(2)} MAD` : '';
    const tags = (p.tags || []).slice(0, 5).map(t => `#${String(t).replace(/\s+/g, '')}`).join(' ');
    const desc = p.short_description || (p.description ? this._truncate(p.description, 140) : '');
    return [p.title || '', '', desc, '', priceText, tags].filter(Boolean).join('\n');
  },

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

  _truncate(t, n) { return (t && t.length > n) ? t.slice(0, n) + '...' : (t || ''); }
};

document.addEventListener('DOMContentLoaded', () => { SocialPoster.init().catch(console.error); });
console.log('✅ SocialPoster loaded: Webhook posting (default URL + compose toggle)')
