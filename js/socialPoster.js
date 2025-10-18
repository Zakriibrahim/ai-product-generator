/**
 * Social Poster - Multi-Image + French Party Hashtags
 */
const SocialPoster = {
  async init() {
    console.log('🎉 Social Poster initialized!');
    this.injectHeaderButton();
    this.injectTab();
    this.bindUI();
  },

  injectHeaderButton() {
    const fetchBtn = document.getElementById('fetchProductsBtn');
    if (!fetchBtn || document.getElementById('postToFacebookBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'postToFacebookBtn';
    btn.className = 'btn btn-blue';
    btn.innerHTML = '<i class="fab fa-facebook"></i> Post to Facebook';
    fetchBtn.insertAdjacentElement('afterend', btn);
    btn.addEventListener('click', () => this.openConfirmModal());
  },

  injectTab() {
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

    if (!document.getElementById('tab-social')) {
      const socialTab = document.createElement('div');
      socialTab.id = 'tab-social';
      socialTab.className = 'tab-content';
      socialTab.innerHTML = `
        <div class="p-4">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-indigo-700">
              <i class="fab fa-facebook"></i> Facebook Auto-Poster 🎉
            </h2>
            <div class="text-sm font-semibold text-green-600">
              ✅ Connected to Farhashop
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-6">
            <div class="bg-white border-2 border-zinc-200 rounded-xl p-6">
              <h3 class="font-semibold text-indigo-700 mb-4">
                <i class="fas fa-pen"></i> Custom Caption (Optional)
              </h3>
              <textarea 
                id="socialCaption" 
                rows="10" 
                class="w-full p-3 border-2 border-zinc-200 rounded-lg focus:border-indigo-500 focus:outline-none resize-none font-mono text-sm" 
                placeholder="Leave empty for auto-viral party captions..."></textarea>
              
              <div class="flex items-center gap-2 mt-3">
                <input id="useComposeCaption" type="checkbox" class="w-4 h-4">
                <label for="useComposeCaption" class="text-sm font-semibold">
                  Use this caption for ALL posts
                </label>
              </div>
              
              <div class="text-xs text-zinc-500 mt-2">
                Characters: <span id="socialCharCount" class="font-bold">0</span>
              </div>

              <div class="flex gap-2 mt-4">
                <button id="socialUseSelectedBtn" class="btn btn-blue btn-sm">
                  <i class="fas fa-magic"></i> Preview Caption
                </button>
                <button id="socialCopyCaptionBtn" class="btn btn-gray btn-sm">
                  <i class="fas fa-copy"></i> Copy
                </button>
              </div>
            </div>

            <div class="space-y-4">
              <div class="bg-gradient-to-br from-pink-50 to-purple-100 border-2 border-pink-300 rounded-xl p-6">
                <h3 class="font-bold text-purple-800 mb-4">
                  <i class="fas fa-rocket"></i> Auto-Viral Features 🎉
                </h3>
                <ul class="space-y-2 text-sm text-purple-900">
                  <li><i class="fas fa-check-circle text-pink-600"></i> <strong>ALL Product Images</strong> - Multi-photo posts</li>
                  <li><i class="fas fa-check-circle text-pink-600"></i> <strong>Direct Product Links</strong> - To your store</li>
                  <li><i class="fas fa-check-circle text-pink-600"></i> <strong>25+ French Hashtags</strong> - #Fete #Anniversaire</li>
                  <li><i class="fas fa-check-circle text-pink-600"></i> <strong>Price in Dirhams</strong> - Clear pricing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      `;
      const mainCard = document.querySelector('.bg-white.rounded-xl.shadow-lg.p-4.mb-6');
      if (mainCard) mainCard.appendChild(socialTab);
    }
  },

  bindUI() {
    const captionEl = document.getElementById('socialCaption');
    const counterEl = document.getElementById('socialCharCount');
    if (captionEl) {
      const update = () => { 
        if (counterEl) counterEl.textContent = captionEl.value.length; 
      };
      captionEl.addEventListener('input', update); 
      update();
    }

    document.getElementById('socialUseSelectedBtn')?.addEventListener('click', () => this.fillFromSelected());
    document.getElementById('socialCopyCaptionBtn')?.addEventListener('click', () => {
      const text = (document.getElementById('socialCaption')?.value || '').trim();
      if (!text) return Utils.notify('Nothing to copy', 'warning');
      navigator.clipboard.writeText(text).then(() => Utils.notify('✓ Copied', 'success'));
    });
  },

  openConfirmModal() {
    const products = this._getTargets();
    if (products.length === 0) {
      return Utils.notify('⚠️ No products to post', 'warning');
    }

    const totalImages = products.reduce((sum, p) => sum + (p.galleryImageUrls?.length || 0), 0);

    const modal = document.getElementById('modalContainer');
    const modalBg = document.getElementById('modalBg');
    
    modal.innerHTML = `
      <div class="modal-card">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-indigo-700">
            <i class="fab fa-facebook"></i> Post to Facebook
          </h2>
          <button onclick="closeModal()" class="text-3xl">×</button>
        </div>
        
        <div class="bg-gradient-to-r from-pink-50 to-purple-50 border-l-4 border-pink-500 p-4 rounded-lg mb-4">
          <p class="text-purple-900 font-semibold">
            <i class="fas fa-gifts"></i> Ready to post <strong class="text-2xl">${products.length}</strong> products
          </p>
          <p class="text-sm text-purple-700">
            <i class="fas fa-images"></i> Total images: <strong>${totalImages}</strong> photos
          </p>
        </div>

        <div class="flex gap-3 justify-end mt-6 pt-6 border-t">
          <button onclick="closeModal()" class="btn btn-gray">Cancel</button>
          <button id="confirmFbPostBtn" class="btn btn-indigo btn-lg">
            <i class="fas fa-rocket"></i> Post Now!
          </button>
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

    let posted = 0;
    let failed = 0;

    try {
      const useCompose = document.getElementById('useComposeCaption')?.checked;
      const composeCaption = (document.getElementById('socialCaption')?.value || '').trim();

      Utils.notify(`🎉 Posting ${products.length} products...`, 'info', 3000);

      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        
        if (btn) btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${i + 1}/${products.length}`;

        try {
          const caption = useCompose ? composeCaption : this.buildPartyCaption(p);
          const imageUrls = p.galleryImageUrls || [];

          if (imageUrls.length === 0) {
            Utils.notify(`⚠️ No images: ${p.title}`, 'warning', 2000);
            continue;
          }

          await this.postToFacebookMultiImages(caption, imageUrls);
          
          posted++;
          Utils.notify(`✅ Posted ${imageUrls.length} images: ${p.title}`, 'success', 2000);
          
          if (i < products.length - 1) await new Promise(r => setTimeout(r, 4000));
          
        } catch (e) {
          failed++;
          Utils.notify(`❌ Failed: ${p.title}`, 'error', 2000);
          console.error('Post error:', e);
        }
      }

      if (failed === 0) {
        Utils.notify(`🎉 Posted all ${posted} products!`, 'success', 7000);
      } else {
        Utils.notify(`Posted ${posted}, Failed ${failed}`, 'warning', 6000);
      }

    } catch (e) {
      Utils.notify(`Error: ${e.message}`, 'error', 5000);
    } finally {
      if (btn) { btn.innerHTML = original; btn.disabled = false; }
    }
  },

  async postToFacebookMultiImages(message, imageUrls) {
    const pageId = CONFIG.FACEBOOK.PAGE_ID;
    const token = CONFIG.FACEBOOK.PAGE_ACCESS_TOKEN;

    if (imageUrls.length === 1) {
      const url = `https://graph.facebook.com/v18.0/${pageId}/photos`;
      const params = new URLSearchParams({
        url: imageUrls[0],
        caption: message,
        access_token: token
      });

      const response = await fetch(url, { method: 'POST', body: params });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }
      return await response.json();
    }

    // Multiple images
    const photoIds = [];
    
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const uploadUrl = `https://graph.facebook.com/v18.0/${pageId}/photos`;
        const uploadParams = new URLSearchParams({
          url: imageUrls[i],
          published: 'false',
          access_token: token
        });

        const uploadResponse = await fetch(uploadUrl, { method: 'POST', body: uploadParams });

        if (uploadResponse.ok) {
          const data = await uploadResponse.json();
          photoIds.push({ media_fbid: data.id });
          if (i < imageUrls.length - 1) await new Promise(r => setTimeout(r, 500));
        }
      } catch (e) {
        console.error(`Failed image ${i + 1}:`, e);
      }
    }

    if (photoIds.length === 0) throw new Error('No images uploaded');

    const publishUrl = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    const publishParams = new URLSearchParams({
      message: message,
      attached_media: JSON.stringify(photoIds),
      access_token: token
    });

    const publishResponse = await fetch(publishUrl, { method: 'POST', body: publishParams });

    if (!publishResponse.ok) {
      const error = await publishResponse.json().catch(() => ({}));
      throw new Error(error.error?.message || `HTTP ${publishResponse.status}`);
    }

    return await publishResponse.json();
  },

  buildPartyCaption(p) {
    const priceText = p.price ? `💰 Prix: ${parseFloat(p.price).toFixed(2)} DH` : '';
    
    const productUrl = this.getProductUrl(p);
    
    const productTags = (p.tags || [])
      .slice(0, 5)
      .map(t => `#${String(t).replace(/\s+/g, '')}`)
      .filter(t => t.length > 2 && t.length < 30)
      .join(' ');
    
    const partyHashtags = [
      '#Fete', '#Anniversaire', '#Party', '#Celebration', '#Evenement',
      '#ArticlesDeFete', '#DecorationFete', '#FeteAnniversaire',
      '#Ballons', '#Decoration', '#FournituresFete', '#AccessoiresFete',
      '#Maroc', '#Casablanca', '#Rabat', '#Fes', '#Marrakech', '#Tanger',
      '#Shopping', '#Promo', '#BonnePrix', '#QualitePremium',
      '#LivraisonRapide', '#CommandezMaintenant', '#ShopOnline',
      '#Mariage', '#BabyShower', '#Bapteme', '#Graduation'
    ].join(' ');
    
    const desc = p.short_description || (p.description ? this._truncate(p.description, 140) : '');
    
    const imageCount = (p.galleryImageUrls || []).length;
    const imageText = imageCount > 1 ? `📸 ${imageCount} photos disponibles` : '';
    
    return [
      `🎉 ${p.title || 'Nouveau Produit'} 🎉`,
      '',
      desc,
      '',
      priceText,
      imageText,
      '',
      '🛒 Commandez maintenant:',
      productUrl,
      '',
      '📦 Livraison rapide partout au Maroc',
      '✅ Qualité garantie',
      '🎈 Parfait pour toutes vos occasions!',
      '',
      productTags,
      '',
      partyHashtags
    ].filter(Boolean).join('\n');
  },

  getProductUrl(product) {
    const baseUrl = CONFIG.WOO_URL || 'https://farhashop.com';
    if (product.permalink) return product.permalink;
    if (product.sku) return `${baseUrl}/product/${product.sku}/`;
    if (product.id || product.wooId) return `${baseUrl}/?p=${product.id || product.wooId}`;
    return `${baseUrl}/shop/`;
  },

  _getTargets() {
    const all = ProductManager?.products || [];
    const sel = ProductManager?.selectedIndices || [];
    return sel.length ? sel.map(i => all[i]).filter(Boolean) : all;
  },

  fillFromSelected() {
    const targets = this._getTargets();
    if (!targets.length) return Utils.notify('No products', 'warning');
    
    const p = targets[0];
    const cap = this.buildPartyCaption(p);
    const capEl = document.getElementById('socialCaption');
    
    if (capEl) capEl.value = cap;
    
    const counterEl = document.getElementById('socialCharCount');
    if (counterEl) counterEl.textContent = cap.length;
    
    Utils.notify(`✓ Preview: ${p.title}`, 'success');
  },

  _truncate(text, maxLength) { 
    return (text && text.length > maxLength) ? text.slice(0, maxLength) + '...' : (text || ''); 
  }
};

document.addEventListener('DOMContentLoaded', () => { SocialPoster.init().catch(console.error); });
console.log('🎉 Social Poster ready!');
