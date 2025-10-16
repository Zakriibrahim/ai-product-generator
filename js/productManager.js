/**
 * Product Manager - FIXED VERSION
 */

const ProductManager = {
  products: [],
  selectedIndices: [],
  
  addProduct(product) {
    this.products.push(product);
    this.updateUI();
  },
  
  updateProduct(index, product) {
    if (index >= 0 && index < this.products.length) {
      this.products[index] = product;
      this.updateUI();
    }
  },
  
  deleteProduct(index) {
    if (!confirm('Delete this product?')) return;
    if (index >= 0 && index < this.products.length) {
      this.products.splice(index, 1);
      this.selectedIndices = this.selectedIndices.filter(i => i !== index);
      this.updateUI();
      Utils.notify('✓ Product deleted', 'success');
    }
  },
  
  deleteProducts(indices) {
    const sorted = [...indices].sort((a, b) => b - a);
    sorted.forEach(i => {
      if (i >= 0 && i < this.products.length) {
        this.products.splice(i, 1);
      }
    });
    this.selectedIndices = [];
    this.updateUI();
  },
  
  getProduct(index) {
    return this.products[index] || null;
  },
  
  clearAll() {
    if (!confirm('Clear all products?')) return;
    this.products = [];
    this.selectedIndices = [];
    this.updateUI();
  },
  
  updateUI() {
    document.getElementById('productCount').textContent = this.products.length;
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) uploadBtn.disabled = this.products.length === 0;
    this.renderProducts();
    this.updateEmptyState();
    this.updateBulkActionsBar();
  },
  
  renderProducts() {
    const container = document.getElementById('content');
    
    if (this.products.length === 0) {
      container.innerHTML = '';
      return;
    }
    
    container.innerHTML = this.products.map((p, i) => this.renderProductCard(p, i)).join('');
  },
  
  renderProductCard(product, index) {
    const isSelected = this.selectedIndices.includes(index);
    const isVariable = product.variations && product.variations.length > 0;
    const hasCategories = product.selectedCategories && product.selectedCategories.length > 0;
    const isFetched = product.mode === 'fetched';
    
    let statusBadge = '';
    if (hasCategories) {
      statusBadge = '<span class="status-badge status-ready"><i class="fas fa-check-circle"></i> Ready</span>';
    } else {
      statusBadge = '<span class="status-badge status-warning"><i class="fas fa-exclamation-triangle"></i> No Categories</span>';
    }
    
    if (isVariable) {
      statusBadge += ' <span class="status-badge status-variable"><i class="fas fa-sitemap"></i> Variable</span>';
    }
    
    if (isFetched) {
      statusBadge += ' <span class="status-badge" style="background:#dbeafe;color:#1e40af;"><i class="fas fa-cloud-download-alt"></i> From Store</span>';
    }
    
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
        <div class="absolute bottom-1 left-1 bg-indigo-600 text-white text-xs font-bold rounded px-1.5 py-0.5">${i}</div>
      </div>
    `).join('');
    
    const shortDesc = product.short_description || '';
    const descPreview = shortDesc.length > 100 ? shortDesc.substring(0, 100) + '...' : shortDesc;
    
    return `
      <div class="product-card fade-in ${isSelected ? 'product-card-selected' : ''}" data-index="${index}">
        <div class="flex gap-4 items-start mb-4">
          <input type="checkbox" 
                 class="product-checkbox w-5 h-5 mt-1" 
                 ${isSelected ? 'checked' : ''}
                 onchange="ProductManager.toggleSelection(${index}, this.checked)"
                 style="accent-color: #6366f1;">
          
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2 flex-wrap">
              <h3 class="font-bold text-xl text-indigo-700">
                ${Utils.escapeHtml(product.title)}
              </h3>
              ${statusBadge}
            </div>
            
            <div class="flex items-center gap-3 mb-3 text-sm text-zinc-500">
              <span><i class="fas fa-barcode"></i> ${Utils.escapeHtml(product.sku)}</span>
              <span>•</span>
              <span><i class="fas fa-${product.mode === 'single' ? 'box' : product.mode === 'fetched' ? 'cloud' : 'layer-group'}"></i> 
                ${product.mode === 'single' ? 'Single' : product.mode === 'fetched' ? 'Fetched' : 'Multi-Image'}
              </span>
            </div>
            
            <div class="mb-3">
              <p class="text-zinc-600" id="desc-preview-${index}">${Utils.escapeHtml(descPreview)}</p>
              <p class="text-zinc-600 hidden" id="desc-full-${index}">${Utils.escapeHtml(shortDesc)}</p>
              ${shortDesc.length > 100 ? `
                <button onclick="ProductManager.toggleDescription(${index})" 
                        class="text-indigo-600 text-sm font-semibold hover:text-indigo-800 mt-1">
                  <span id="desc-toggle-${index}">Show more <i class="fas fa-chevron-down"></i></span>
                </button>
              ` : ''}
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
            
            ${product.category_ar ? `
              <div class="mb-3">
                <span class="arabic-category">${Utils.escapeHtml(product.category_ar)}</span>
              </div>
            ` : ''}
            
            <div class="flex gap-2 flex-wrap">
              ${galleryHtml}
            </div>
          </div>
        </div>
        
        <div class="flex gap-2 justify-end pt-4 border-t flex-wrap">
          <button onclick="ProductManager.editProduct(${index})" class="btn btn-blue btn-sm">
            <i class="fas fa-pen"></i> Edit
          </button>
          ${!isFetched ? `
            <button onclick="RegenerateProducts.regenerate(${index})" class="btn btn-purple btn-sm" title="Re-analyze with AI">
              <i class="fas fa-sync-alt"></i> Regenerate
            </button>
          ` : ''}
          <button onclick="ImageEnhancer.showEnhanceModal(${index})" class="btn btn-yellow btn-sm" title="AI Image Enhancement">
            <i class="fas fa-wand-magic-sparkles"></i> Enhance
          </button>
          <button onclick="ProductManager.duplicateProduct(${index})" class="btn btn-green btn-sm">
            <i class="fas fa-copy"></i> Duplicate
          </button>
          <button onclick="ProductManager.deleteProduct(${index})" class="btn btn-pink btn-sm">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `;
  },
  
  toggleDescription(index) {
    const preview = document.getElementById(`desc-preview-${index}`);
    const full = document.getElementById(`desc-full-${index}`);
    const toggle = document.getElementById(`desc-toggle-${index}`);
    
    if (preview && full && toggle) {
      if (preview.classList.contains('hidden')) {
        preview.classList.remove('hidden');
        full.classList.add('hidden');
        toggle.innerHTML = 'Show more <i class="fas fa-chevron-down"></i>';
      } else {
        preview.classList.add('hidden');
        full.classList.remove('hidden');
        toggle.innerHTML = 'Show less <i class="fas fa-chevron-up"></i>';
      }
    }
  },
  
  toggleSelection(index, selected) {
    if (selected) {
      if (!this.selectedIndices.includes(index)) {
        this.selectedIndices.push(index);
      }
    } else {
      this.selectedIndices = this.selectedIndices.filter(i => i !== index);
    }
    this.updateBulkActionsBar();
    this.renderProducts();
  },
  
  updateBulkActionsBar() {
    const bar = document.getElementById('bulkActionsBar');
    const count = document.getElementById('bulkSelectedCount');
    const selectAll = document.getElementById('selectAllCheckbox');
    
    if (this.selectedIndices.length > 0) {
      bar.classList.remove('hidden');
      count.textContent = this.selectedIndices.length;
      if (selectAll) selectAll.checked = this.selectedIndices.length === this.products.length;
    } else {
      bar.classList.add('hidden');
      if (selectAll) selectAll.checked = false;
    }
  },
  
  updateEmptyState() {
    const content = document.getElementById('content');
    const empty = document.getElementById('emptyState');
    
    if (this.products.length === 0) {
      if (content) content.style.display = 'none';
      if (empty) empty.style.display = 'block';
    } else {
      if (content) content.style.display = 'grid';
      if (empty) empty.style.display = 'none';
    }
  },
  
  editProduct(index) {
    const product = this.getProduct(index);
    if (!product) return;
    
    const modal = document.getElementById('modalContainer');
    const modalBg = document.getElementById('modalBg');
    
    modal.innerHTML = `
      <div class="modal-card" style="max-height: 90vh; overflow-y: auto;">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-indigo-700">
            <i class="fas fa-edit"></i> Edit Product
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
          
          <div>
            <label class="block font-semibold mb-2">Product Images</label>
            <div class="flex gap-2 flex-wrap p-3 border-2 border-zinc-200 rounded-lg">
              ${(product.galleryImageUrls || []).map((url, i) => `
                <div class="relative">
                  <img src="${url}" class="img-thumb" alt="Image ${i}">
                  <div class="absolute bottom-1 left-1 bg-indigo-600 text-white text-xs font-bold rounded px-1.5 py-0.5">${i}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        
        <div class="flex gap-3 justify-end mt-6 pt-6 border-t">
          <button onclick="closeModal()" class="btn btn-gray">
            <i class="fas fa-times"></i> Cancel
          </button>
          <button onclick="ProductManager.saveEdit(${index})" class="btn btn-indigo">
            <i class="fas fa-save"></i> Save Changes
          </button>
        </div>
      </div>
    `;
    
    modal.classList.remove('hidden');
    modalBg.classList.remove('hidden');
  },
  
  saveEdit(index) {
    const product = this.getProduct(index);
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
    Utils.notify('✓ Product updated successfully!', 'success');
  },
  
  duplicateProduct(index) {
    const product = this.getProduct(index);
    if (!product) return;
    
    const duplicate = Utils.deepClone(product);
    duplicate.title = product.title + ' (Copy)';
    duplicate.sku = product.sku + '-COPY-' + Date.now();
    
    this.addProduct(duplicate);
    Utils.notify('✓ Product duplicated', 'success');
  }
};

window.ProductManager = ProductManager;

window.toggleSelectAll = function(checkbox) {
  if (checkbox.checked) {
    ProductManager.selectedIndices = ProductManager.products.map((_, i) => i);
  } else {
    ProductManager.selectedIndices = [];
  }
  ProductManager.renderProducts();
  ProductManager.updateBulkActionsBar();
};

window.clearSelection = function() {
  ProductManager.selectedIndices = [];
  ProductManager.renderProducts();
  ProductManager.updateBulkActionsBar();
};

console.log('✅ ProductManager loaded (FIXED VERSION v2.1.1)');
