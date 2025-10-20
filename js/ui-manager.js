// UI Management
const uiManager = {
  showLoading(message = "Chargement...") {
    document.getElementById('loadingMessage').textContent = message;
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('progressBarContainer').classList.add('hidden');
  },

  hideLoading() {
    document.getElementById('loading').classList.add('hidden');
  },

  showProgress(current, total) {
    const container = document.getElementById('progressBarContainer');
    const fill = document.getElementById('progressFill');
    const text = document.getElementById('progressText');
    
    container.classList.remove('hidden');
    const percent = Math.round((current / total) * 100);
    fill.style.width = `${percent}%`;
    text.textContent = `${current} / ${total}`;
  },

  showError(message) {
    document.getElementById('errorText').textContent = message;
    document.getElementById('error').classList.remove('hidden');
  },

  hideError() {
    document.getElementById('error').classList.add('hidden');
  },

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      }
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    state.currentTab = tabName;
  },

  renderImageGallery() {
    const gallery = document.getElementById('imageGallery');
    
    if (state.uploadedImages.length === 0) {
      gallery.innerHTML = '';
      return;
    }

    gallery.innerHTML = state.uploadedImages.map((img, index) => `
      <div class="image-item ${img.uploading ? 'uploading' : ''}">
        <img src="${img.preview}" alt="Upload ${index + 1}">
        ${img.uploading ? '<div class="status-badge">Uploading...</div>' : ''}
        ${img.optimized && !img.uploading ? '<div class="status-badge">Optimized</div>' : ''}
        <button class="delete-btn" onclick="handleRemoveImage(${index})">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `).join('');
  },

  renderFetchedProducts(searchTerm = '') {
    const container = document.getElementById('fetchedProductsList');
    
    let products = state.fetchedProducts;
    if (searchTerm) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (products.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Aucun produit trouvé</p></div>';
      return;
    }

    container.innerHTML = products.map(product => `
      <div class="product-card ${state.selectedFetched.has(product.id) ? 'selected' : ''}" 
           onclick="handleToggleFetched(${product.id})">
        <img src="${product.images[0]?.src || 'https://via.placeholder.com/200'}" alt="${product.name}">
        <div class="product-title">${product.name}</div>
        <div class="product-price">${product.price} MAD</div>
      </div>
    `).join('');
  },

  renderResults() {
    const container = document.getElementById('resultsList');
    const emptyState = document.getElementById('emptyState');

    if (state.generatedProducts.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    container.innerHTML = state.generatedProducts.map((product, index) => this.renderProductCard(product, index)).join('');
  },

  renderProductCard(product, index) {
    const isSelected = state.selectedResults.has(index);
    
    return `
      <div class="product-card ${isSelected ? 'selected' : ''}" data-index="${index}">
        <div class="flex gap-4">
          <input type="checkbox" 
                 class="w-5 h-5 accent-indigo-600" 
                 ${isSelected ? 'checked' : ''}
                 onchange="handleToggleResult(${index})">
          
          <div class="flex-1">
            <img src="${product.images[0]}" alt="${product.title}" class="w-32 h-32 object-cover rounded-lg mb-3">
            
            <h3 class="text-xl font-bold text-indigo-700 mb-2">${product.title}</h3>
            
            <div class="space-y-2 text-sm">
              <div><strong>Prix:</strong> <span class="text-green-600 text-lg font-bold">${product.price} MAD</span></div>
              <div><strong>Description courte:</strong> ${product.short_description}</div>
              <div><strong>Description:</strong> ${product.description}</div>
              <div><strong>Tags:</strong> ${product.tags.join(', ')}</div>
              <div><strong>Catégorie suggérée:</strong> ${product.suggested_category}</div>
              <div><strong>Catégories du store:</strong> 
                <select class="modal-input" onchange="handleCategoryChange(${index}, this.value)">
                  <option value="">Sélectionner...</option>
                  ${state.storeCategories.map(cat => `
                    <option value="${cat.id}" ${product.category_id === cat.id ? 'selected' : ''}>
                      ${cat.name}
                    </option>
                  `).join('')}
                </select>
              </div>
            </div>

            <div class="mt-4 flex gap-2">
              <button class="btn btn-blue" onclick="handleEditProduct(${index})">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button class="btn btn-yellow" onclick="handleRegenerateProduct(${index})">
                <i class="fas fa-sync"></i> Regenerate
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  openModal(content) {
    document.getElementById('modalCard').innerHTML = content;
    document.getElementById('modalBg').style.display = 'flex';
  },

  closeModal() {
    document.getElementById('modalBg').style.display = 'none';
  }
};

// Attach to window for inline handlers
window.uiManager = uiManager;
