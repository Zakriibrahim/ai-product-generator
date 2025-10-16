/**
 * Fetch Products from WooCommerce
 */

const FetchProducts = {
  async fetchFromStore(filters = {}) {
    try {
      Utils.notify('Fetching products from WooCommerce...', 'info');
      
      const params = new URLSearchParams({
        per_page: filters.limit || 100,
        page: filters.page || 1,
        consumer_key: CONFIG.WOO_CONSUMER_KEY,
        consumer_secret: CONFIG.WOO_CONSUMER_SECRET
      });
      
      if (filters.search) params.append('search', filters.search);
      if (filters.sku) params.append('sku', filters.sku);
      
      const url = `${CONFIG.WOO_URL}/wp-json/wc/v3/products?${params}`;
      const response = await this.proxiedFetch(url);
      const products = await response.json();
      
      if (!Array.isArray(products)) {
        throw new Error('Invalid response from WooCommerce');
      }
      
      Utils.notify(`✓ Fetched ${products.length} products`, 'success');
      return products;
      
    } catch (error) {
      Utils.notify('Failed to fetch products: ' + error.message, 'error');
      return [];
    }
  },
  
  async proxiedFetch(url) {
    for (const proxy of CONFIG.PROXIES) {
      const finalUrl = proxy ? (proxy.endsWith('?') ? proxy + encodeURIComponent(url) : proxy + url) : url;
      
      try {
        const response = await fetch(finalUrl);
        if (response.ok) return response;
      } catch (e) {
        console.error('Proxy failed:', proxy, e);
      }
    }
    throw new Error('All proxies failed');
  },
  
  convertToLocalFormat(wooProduct) {
    return {
      id: wooProduct.id,
      title: wooProduct.name,
      description: wooProduct.description,
      short_description: wooProduct.short_description,
      price: wooProduct.price || '0',
      sku: wooProduct.sku,
      tags: wooProduct.tags?.map(t => t.name) || [],
      categories: wooProduct.categories?.map(c => c.name) || [],
      selectedCategories: wooProduct.categories?.map(c => c.id) || [],
      galleryImageUrls: wooProduct.images?.map(img => img.src) || [],
      variations: [],
      attributes: wooProduct.attributes || [],
      default_attributes: wooProduct.default_attributes || [],
      mode: 'fetched',
      woocommerceId: wooProduct.id,
      permalink: wooProduct.permalink
    };
  },
  
  showFetchModal() {
    const modal = document.getElementById('modalContainer');
    const modalBg = document.getElementById('modalBg');
    
    modal.innerHTML = `
      <div class="modal-card">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-indigo-700">
            <i class="fas fa-download"></i> Fetch Products from WooCommerce
          </h2>
          <button onclick="closeModal()" class="text-3xl text-zinc-400 hover:text-zinc-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block font-semibold mb-2">Search Products</label>
            <input type="text" id="fetch-search" placeholder="Search by name, SKU, or keyword..."
                   class="w-full p-3 border-2 border-zinc-200 rounded-lg focus:border-indigo-500 focus:outline-none">
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold mb-2">Limit</label>
              <select id="fetch-limit" class="w-full p-3 border-2 border-zinc-200 rounded-lg">
                <option value="10">10 products</option>
                <option value="20" selected>20 products</option>
                <option value="50">50 products</option>
                <option value="100">100 products</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold mb-2">Page</label>
              <input type="number" id="fetch-page" value="1" min="1"
                     class="w-full p-3 border-2 border-zinc-200 rounded-lg focus:border-indigo-500 focus:outline-none">
            </div>
          </div>
          
          <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p class="text-sm text-blue-800">
              <i class="fas fa-info-circle"></i>
              <strong>Note:</strong> Fetched products will be added to your workspace. You can edit them and re-upload to update your store.
            </p>
          </div>
        </div>
        
        <div class="flex gap-3 justify-end mt-6 pt-6 border-t">
          <button onclick="closeModal()" class="btn btn-gray">
            <i class="fas fa-times"></i> Cancel
          </button>
          <button onclick="FetchProducts.executeFetch()" class="btn btn-indigo">
            <i class="fas fa-download"></i> Fetch Products
          </button>
        </div>
      </div>
    `;
    
    modal.classList.remove('hidden');
    modalBg.classList.remove('hidden');
  },
  
  async executeFetch() {
    const search = document.getElementById('fetch-search')?.value || '';
    const limit = parseInt(document.getElementById('fetch-limit')?.value || '20');
    const page = parseInt(document.getElementById('fetch-page')?.value || '1');
    
    closeModal();
    
    const products = await this.fetchFromStore({ search, limit, page });
    
    if (products.length === 0) {
      Utils.notify('No products found', 'warning');
      return;
    }
    
    products.forEach(wooProduct => {
      const localProduct = this.convertToLocalFormat(wooProduct);
      FetchedManager.addProduct(localProduct);
    });
    
    switchTab("fetched");
    Utils.notify(`✓ Added ${products.length} products from store!`, 'success');
  }
};

window.FetchProducts = FetchProducts;

console.log('✅ FetchProducts loaded');
