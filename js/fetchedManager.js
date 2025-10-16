/**
 * Fetched Products Manager
 * Separate manager for products fetched from WooCommerce
 */

const FetchedManager = {
  fetchedProducts: [],
  selectedIndices: [],
  
  addProduct(product) {
    this.fetchedProducts.push(product);
    this.updateUI();
  },
  
  updateProduct(index, product) {
    if (index >= 0 && index < this.fetchedProducts.length) {
      this.fetchedProducts[index] = product;
      this.updateUI();
    }
  },
  
  deleteProduct(index) {
    if (!confirm('Remove this fetched product?')) return;
    if (index >= 0 && index < this.fetchedProducts.length) {
      this.fetchedProducts.splice(index, 1);
      this.updateUI();
      Utils.notify('✓ Product removed', 'success');
    }
  },
  
  clearAll() {
    if (!confirm('Clear all fetched products?')) return;
    this.fetchedProducts = [];
    this.selectedIndices = [];
    this.updateUI();
    Utils.notify('✓ All fetched products cleared', 'success');
  },
  
  updateUI() {
    document.getElementById('fetchedProductCount').textContent = this.fetchedProducts.length;
    this.render();
    this.updateEmptyState();
  },
  
  render() {
    const container = document.getElementById('fetched-content');
    
    if (this.fetchedProducts.length === 0) {
      container.innerHTML = '';
      return;
    }
    
    container.innerHTML = this.fetchedProducts.map((p, i) => this.renderCard(p, i)).join('');
  },
  
  renderCard(product, index) {
    const hasCategories = product.selectedCategories && product.selectedCategories.length > 0;
    
    let statusBadge = '';
    if (hasCategories) {
      statusBadge = '<span class="status-badge status-ready"><i class="fas fa-check-circle"></i> Ready</span>';
    } else {
      statusBadge = '<span class="status-badge status-warning"><i class="fas fa-exclamation-triangle"></i> No Categories</span>';
    }
    
    statusBadge += ' <span class="status-badge" style="background:#dbeafe;color:#1e40af;"><i class="fas fa-cloud"></i> From Store</span>';
    
    let categoriesHtml = '';
    if (hasCategories) {
      const catNames = product.selectedCategories
        .map(id => CategoryManager.getCategoryName(id))
        .slice(0, 3);
      categoriesHtml = catNames.map(name => 
        `<span class="cat-badge">${Utils.escapeHtml(name)}</span>`
      ).join('');
      if (product.selectedCategories.length > 3) {
        categoriesHtml += `<span class="text-xs text-zinc-500">+${product.selectedCategories.length - 3} more</span>`;
      }
    }
    
    const galleryHtml = (product.galleryImageUrls || []).slice(0, 4).map((url, i) => `
      <div class="relative">
        <img src="${url}" class="img-thumb" title="Image ${i}" alt="Product image ${i}">
        <div class="absolute bottom-1 left-1 bg-purple-600 text-white text-xs font-bold rounded px-1.5 py-0.5">${i}</div>
      </div>
    `).join('');
    
    const shortDesc = product.short_description || '';
    const descPreview = shortDesc.length > 100 ? shortDesc.substring(0, 100) + '...' : shortDesc;
    
    return `
      <div class="product-card fade-in" data-index="${index}">
        <div class="flex gap-4 items-start mb-4">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2 flex-wrap">
              <h3 class="font-bold text-xl text-purple-700">
                ${Utils.escapeHtml(product.title)}
              </h3>
              ${statusBadge}
            </div>
            
            <div class="flex items-center gap-3 mb-3 text-sm text-zinc-500">
              <span><i class="fas fa-barcode"></i> ${Utils.escapeHtml(product.sku)}</span>
              <span>•</span>
              <span><i class="fas fa-hashtag"></i> WooCommerce ID: ${product.woocommerceId || 'N/A'}</span>
            </div>
            
            <div class="mb-3">
              <p class="text-zinc-600">${Utils.escapeHtml(descPreview)}</p>
            </div>
            
            <div class="flex items-center gap-2 mb-3">
              <span class="text-2xl font-bold text-green-600">${product.price} MAD</span>
              ${product.tags && product.tags.length > 0 ? 
                `<span class="text-xs text-zinc-400">• ${product.tags.slice(0, 3).join(', ')}</span>` : ''}
            </div>
            
            ${categoriesHtml ? `
              <div class="flex flex-wrap gap-2 mb-3">
                ${categoriesHtml}
              </div>
            ` : ''}
            
            <div class="flex gap-2 flex-wrap">
              ${galleryHtml}
            </div>
          </div>
        </div>
        
        <div class="flex gap-2 justify-end pt-4 border-t flex-wrap">
          <button onclick="FetchedManager.editProduct(${index})" class="btn btn-blue btn-sm">
            <i class="fas fa-pen"></i> Edit
          </button>
          <button onclick="RegenerateProducts.regenerateFetched(${index})" class="btn btn-purple btn-sm">
            <i class="fas fa-sync-alt"></i> Regenerate
          </button>
          <button onclick="ImageEnhancer.showEnhanceModalFetched(${index})" class="btn btn-yellow btn-sm">
            <i class="fas fa-wand-magic-sparkles"></i> Enhance
          </button>
          <button onclick="FetchedManager.moveToGenerated(${index})" class="btn btn-green btn-sm">
            <i class="fas fa-arrow-right"></i> Move to Products
          </button>
          <button onclick="FetchedManager.deleteProduct(${index})" class="btn btn-pink btn-sm">
            <i class="fas fa-trash"></i> Remove
          </button>
        </div>
      </div>
    `;
  },
  
  updateEmptyState() {
    const content = document.getElementById('fetched-content');
    const empty = document.getElementById('fetched-empty');
    
    if (this.fetchedProducts.length === 0) {
      if (content) content.style.display = 'none';
      if (empty) empty.style.display = 'block';
    } else {
      if (content) content.style.display = 'grid';
      if (empty) empty.style.display = 'none';
    }
  },
  
  editProduct(index) {
    const product = this.fetchedProducts[index];
    if (!product) return;
    
    // Use same edit modal as ProductManager
    const modal = document.getElementById('modalContainer');
    const modalBg = document.getElementById('modalBg');
    
    modal.innerHTML = `
      <div class="modal-card" style="max-height: 90vh; overflow-y: auto;">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-purple-700">
            <i class="fas fa-edit"></i> Edit Fetched Product
          </h2>
          <button onclick="closeModal()" class="text-3xl text-zinc-400 hover:text-zinc-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block font-semibold mb-2">Title</label>
            <input type="text" id="edit-title" value="${Utils.escapeHtml(product.title)}" 
                   class="w-full p-3 border-2 border-zinc-200 rounded-lg focus:border-indigo-500 focus:outline-none">
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold mb-2">Price (MAD)</label>
              <input type="number" id="edit-price" value="${product.price}" step="0.01"
                     class="w-full p-3 border-2 border-zinc-200 rounded-lg focus:border-indigo-500 focus:outline-none">
            </div>
            <div>
              <label class="block font-semibold mb-2">SKU</label>
              <input type="text" id="edit-sku" value="${Utils.escapeHtml(product.sku)}"
                     class="w-full p-3 border-2 border-zinc-200 rounded-lg focus:border-indigo-500 focus:outline-none">
            </div>
          </div>
          
          <div>
            <label class="block font-semibold mb-2">Short Description</label>
            <textarea id="edit-short-desc" rows="3"
                      class="w-full p-3 border-2 border-zinc-200 rounded-lg focus:border-indigo-500 focus:outline-none resize-none">${Utils.escapeHtml(product.short_description || '')}</textarea>
          </div>
          
          <div>
            <label class="block font-semibold mb-2">Full Description</label>
            <textarea id="edit-desc" rows="5"
                      class="w-full p-3 border-2 border-zinc-200 rounded-lg focus:border-indigo-500 focus:outline-none resize-none">${Utils.escapeHtml(product.description || '')}</textarea>
          </div>
          
          <div>
            <label class="block font-semibold mb-2">Tags (comma separated)</label>
            <input type="text" id="edit-tags" value="${(product.tags || []).join(', ')}"
                   class="w-full p-3 border-2 border-zinc-200 rounded-lg focus:border-indigo-500 focus:outline-none">
          </div>
          
          <div>
            <label class="block font-semibold mb-2">Categories</label>
            <div id="edit-categories" class="max-h-48 overflow-y-auto p-3 border-2 border-zinc-200 rounded-lg">
              ${CategoryManager.renderCategoryTree(product.selectedCategories || [])}
            </div>
          </div>
        </div>
        
        <div class="flex gap-3 justify-end mt-6 pt-6 border-t">
          <button onclick="closeModal()" class="btn btn-gray">
            <i class="fas fa-times"></i> Cancel
          </button>
          <button onclick="FetchedManager.saveEdit(${index})" class="btn btn-indigo">
            <i class="fas fa-save"></i> Save Changes
          </button>
        </div>
      </div>
    `;
    
    modal.classList.remove('hidden');
    modalBg.classList.remove('hidden');
  },
  
  saveEdit(index) {
    const product = this.fetchedProducts[index];
    if (!product) return;
    
    product.title = document.getElementById('edit-title').value;
    product.price = document.getElementById('edit-price').value;
    product.sku = document.getElementById('edit-sku').value;
    product.short_description = document.getElementById('edit-short-desc').value;
    product.description = document.getElementById('edit-desc').value;
    product.tags = document.getElementById('edit-tags').value.split(',').map(s => s.trim()).filter(Boolean);
    
    const selectedCats = Array.from(document.querySelectorAll('#edit-categories .category-checkbox:checked'))
      .map(cb => parseInt(cb.value));
    product.selectedCategories = selectedCats;
    
    this.updateProduct(index, product);
    closeModal();
    Utils.notify('✓ Fetched product updated!', 'success');
  },
  
  moveToGenerated(index) {
    const product = this.fetchedProducts[index];
    if (!product) return;
    
    if (!confirm(`Move "${product.title}" to Products tab?`)) return;
    
    ProductManager.addProduct(product);
    this.fetchedProducts.splice(index, 1);
    this.updateUI();
    
    Utils.notify('✓ Product moved to Products tab!', 'success');
  },
  
  async uploadSelected() {
    if (this.fetchedProducts.length === 0) {
      Utils.notify('No fetched products to upload', 'warning');
      return;
    }
    
    if (!confirm(`Update ${this.fetchedProducts.length} products in WooCommerce store?`)) return;
    
    Utils.notify('Uploading updates to WooCommerce...', 'info');
    // Use existing exporter
    await Exporters.uploadToWooCommerce(this.fetchedProducts, 'en');
  }
};

window.FetchedManager = FetchedManager;

console.log('✅ FetchedManager loaded');
