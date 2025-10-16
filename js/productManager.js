/**
 * Product Manager
 * Handles product data, rendering, and CRUD operations
 */

const ProductManager = {
  products: [],
  selectedIndices: [],
  
  /**
   * Add product to store
   */
  addProduct(product) {
    this.products.push(product);
    this.updateUI();
  },
  
  /**
   * Update product
   */
  updateProduct(index, product) {
    if (index >= 0 && index < this.products.length) {
      this.products[index] = product;
      this.updateUI();
    }
  },
  
  /**
   * Delete product
   */
  deleteProduct(index) {
    if (index >= 0 && index < this.products.length) {
      this.products.splice(index, 1);
      this.selectedIndices = this.selectedIndices.filter(i => i !== index);
      this.updateUI();
    }
  },
  
  /**
   * Delete multiple products
   */
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
  
  /**
   * Get product by index
   */
  getProduct(index) {
    return this.products[index] || null;
  },
  
  /**
   * Clear all products
   */
  clearAll() {
    this.products = [];
    this.selectedIndices = [];
    this.updateUI();
  },
  
  /**
   * Update UI
   */
  updateUI() {
    document.getElementById('productCount').textContent = this.products.length;
    document.getElementById('uploadBtn').disabled = this.products.length === 0;
    this.renderProducts();
    this.updateEmptyState();
    this.updateBulkActionsBar();
  },
  
  /**
   * Render all products
   */
  renderProducts() {
    const container = document.getElementById('content');
    
    if (this.products.length === 0) {
      container.innerHTML = '';
      return;
    }
    
    container.innerHTML = this.products.map((p, i) => this.renderProductCard(p, i)).join('');
  },
  
  /**
   * Render single product card
   */
  renderProductCard(product, index) {
    const isSelected = this.selectedIndices.includes(index);
    const isVariable = product.variations && product.variations.length > 0;
    const hasCategories = product.selectedCategories && product.selectedCategories.length > 0;
    
    // Status badge
    let statusBadge = '';
    if (hasCategories) {
      statusBadge = '<span class="status-badge status-ready"><i class="fas fa-check-circle"></i> Ready</span>';
    } else {
      statusBadge = '<span class="status-badge status-warning"><i class="fas fa-exclamation-triangle"></i> No Categories</span>';
    }
    
    if (isVariable) {
      statusBadge += ' <span class="status-badge status-variable"><i class="fas fa-sitemap"></i> Variable</span>';
    }
    
    // Categories display
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
    
    // Gallery images
    const galleryHtml = (product.galleryImageUrls || []).slice(0, 4).map((url, i) => `
      <div class="relative">
        <img src="${url}" class="img-thumb" title="Image ${i}" alt="Product image ${i}">
        <div class="absolute bottom-1 left-1 bg-indigo-600 text-white text-xs font-bold rounded px-1.5 py-0.5">${i}</div>
      </div>
    `).join('');
    
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
              <span><i class="fas fa-${product.mode === 'single' ? 'box' : 'layer-group'}"></i> 
                ${product.mode === 'single' ? 'Single' : 'Multi-Image'}
              </span>
            </div>
            
            <p class="text-zinc-600 mb-3 line-clamp-2">${Utils.escapeHtml(product.short_description)}</p>
            
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
        
        <div class="flex gap-2 justify-end pt-4 border-t">
          <button onclick="ProductManager.editProduct(${index})" class="btn btn-blue btn-sm">
            <i class="fas fa-pen"></i> Edit
          </button>
          <button onclick="ProductManager.duplicateProduct(${index})" class="btn btn-indigo btn-sm">
            <i class="fas fa-copy"></i> Duplicate
          </button>
          <button onclick="ProductManager.deleteProduct(${index})" class="btn btn-pink btn-sm">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `;
  },
  
  /**
   * Toggle product selection
   */
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
  
  /**
   * Update bulk actions bar
   */
  updateBulkActionsBar() {
    const bar = document.getElementById('bulkActionsBar');
    const count = document.getElementById('bulkSelectedCount');
    const selectAll = document.getElementById('selectAllCheckbox');
    
    if (this.selectedIndices.length > 0) {
      bar.classList.remove('hidden');
      count.textContent = this.selectedIndices.length;
      selectAll.checked = this.selectedIndices.length === this.products.length;
    } else {
      bar.classList.add('hidden');
      selectAll.checked = false;
    }
  },
  
  /**
   * Update empty state
   */
  updateEmptyState() {
    const content = document.getElementById('content');
    const empty = document.getElementById('emptyState');
    
    if (this.products.length === 0) {
      content.style.display = 'none';
      empty.style.display = 'block';
    } else {
      content.style.display = 'grid';
      empty.style.display = 'none';
    }
  },
  
  /**
   * Edit product (open modal)
   */
  editProduct(index) {
    const product = this.getProduct(index);
    if (!product) return;
    
    // TODO: Open edit modal
    Utils.notify('Edit modal coming soon! Use bulk edit for now.', 'info');
  },
  
  /**
   * Duplicate product
   */
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

// Global functions for inline onclick handlers
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

console.log('✅ ProductManager loaded');
