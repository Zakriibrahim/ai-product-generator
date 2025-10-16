/**
 * Fetch Products from WooCommerce - robust with CORS fallback
 * - Works from file:// by trying direct + proxy URLs
 * - Binds the "Fetch from Store" button even if scripts load out of order
 */

const FetchProducts = {
  async fetchFromStore(filters = {}) {
    Utils.notify("Fetching products from WooCommerce...", "info");
    const params = new URLSearchParams({ per_page: filters.limit || 20, page: filters.page || 1 });
    if (filters.search) params.append("search", filters.search);
    if (filters.sku) params.append("sku", filters.sku);
    const baseUrl =
      `${CONFIG.WOO_URL}/wp-json/wc/v3/products?` +
      `${params}&consumer_key=${CONFIG.WOO_CONSUMER_KEY}` +
      `&consumer_secret=${CONFIG.WOO_CONSUMER_SECRET}`;
    const candidates = [ baseUrl, `https://cors.isomorphic-git.org/${baseUrl}`, `https://corsproxy.io/?${encodeURIComponent(baseUrl)}` ];
    for (const url of candidates) {
      try {
        const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
        if (!res.ok) { let t=""; try{t=await res.text()}catch{}; console.warn("[Woo Fetch] Non-OK:", res.status, t); continue; }
        const data = await res.json();
        if (Array.isArray(data)) { Utils.notify(`✓ Fetched ${data.length} products`, "success"); return data; }
      } catch (err) { console.warn("[Woo Fetch] Error:", err); }
    }
    Utils.notify("Failed to fetch products (CORS or API error). Try a different keyword/SKU.", "error", 5000);
    return [];
  },
  convertToLocalFormat(wooProduct) {
    return {
      id: wooProduct.id,
      title: wooProduct.name,
      description: wooProduct.description,
      short_description: wooProduct.short_description,
      price: wooProduct.price || wooProduct.regular_price || "0",
      sku: wooProduct.sku || "N/A",
      tags: wooProduct.tags?.map((t) => t.name) || [],
      categories: wooProduct.categories?.map((c) => c.name) || [],
      selectedCategories: wooProduct.categories?.map((c) => c.id) || [],
      galleryImageUrls: wooProduct.images?.map((img) => img.src) || [],
      variations: [],
      attributes: wooProduct.attributes || [],
      default_attributes: wooProduct.default_attributes || [],
      mode: "fetched",
      woocommerceId: wooProduct.id,
      permalink: wooProduct.permalink,
    };
  },
  showFetchModal() {
    const modal = document.getElementById("modalContainer");
    const modalBg = document.getElementById("modalBg");
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
            <label class="block font-semibold mb-2">Search by Name</label>
            <input type="text" id="fetch-search" placeholder="e.g., T-shirt, Phone..."
                   class="w-full p-3 border-2 border-zinc-200 rounded-lg focus:border-indigo-500 focus:outline-none">
          </div>
          <div>
            <label class="block font-semibold mb-2">Or Search by SKU</label>
            <input type="text" id="fetch-sku" placeholder="Enter exact SKU"
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
              <strong>Store:</strong> ${CONFIG.WOO_URL}<br>
              <strong>Tip:</strong> Leave search empty to fetch all products
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
      </div>`;
    modal.classList.remove("hidden");
    modalBg.classList.remove("hidden");
  },
  async executeFetch() {
    const search = document.getElementById("fetch-search")?.value.trim() || "";
    const sku = document.getElementById("fetch-sku")?.value.trim() || "";
    const limit = parseInt(document.getElementById("fetch-limit")?.value || "20");
    const page = parseInt(document.getElementById("fetch-page")?.value || "1");
    closeModal();
    const filters = { limit, page };
    if (search) filters.search = search;
    if (sku) filters.sku = sku;
    const products = await this.fetchFromStore(filters);
    if (products.length === 0) { Utils.notify("No products found. Try a different keyword or SKU.", "warning", 5000); return; }
    products.forEach((wooProduct) => {
      const localProduct = this.convertToLocalFormat(wooProduct);
      FetchedManager.addProduct(localProduct);
    });
    switchTab("fetched");
    Utils.notify(`✓ Added ${products.length} products to Fetched Products tab!`, "success", 5000);
  },
};
window.FetchProducts = FetchProducts;
console.log("✅ FetchProducts loaded (CORS fallback + robust binding)");
(function ensureFetchButtonClickable() {
  const bind = () => {
    const btn = document.getElementById("fetchProductsBtn");
    if (!btn) return false;
    if (!btn.dataset.fetchBound) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        FetchProducts.showFetchModal();
      });
      btn.dataset.fetchBound = "true";
      console.log("✓ Fetch button bound");
    }
    return true;
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { bind(); });
  } else {
    if (!bind()) {
      const timer = setInterval(() => { if (bind()) clearInterval(timer); }, 300);
      setTimeout(() => clearInterval(timer), 5000);
    }
  }
})();
