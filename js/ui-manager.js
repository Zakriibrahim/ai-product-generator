class UIManager {
  constructor() {
    this.loadingDiv = document.getElementById('loading');
    this.loadingMessage = document.getElementById('loadingMessage');
    this.progressBarContainer = document.getElementById('progressBarContainer');
    this.progressFill = document.getElementById('progressFill');
    this.progressText = document.getElementById('progressText');
    this.errorDiv = document.getElementById('error');
    this.errorText = document.getElementById('errorText');
  }

  showLoading(message = "Loading...") {
    this.loadingMessage.textContent = message;
    this.loadingDiv.classList.remove('hidden');
  }

  hideLoading() {
    this.loadingDiv.classList.add('hidden');
    this.progressBarContainer.classList.add('hidden');
  }

  updateProgress(current, total) {
    this.progressBarContainer.classList.remove('hidden');
    const percentage = Math.round((current / total) * 100);
    this.progressFill.style.width = `${percentage}%`;
    this.progressText.textContent = `${current} / ${total}`;
  }

  showError(message) {
    this.errorText.textContent = message;
    this.errorDiv.classList.remove('hidden');
  }

  hideError() {
    this.errorDiv.classList.add('hidden');
  }

  renderResults() {
    const contentDiv = document.getElementById('resultsList');
    const emptyState = document.getElementById('emptyState');
    
    if (window.state.products.length === 0) {
      contentDiv.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }
    
    contentDiv.style.display = 'block';
    emptyState.style.display = 'none';
    contentDiv.innerHTML = '';
    
    window.state.products.forEach((product, index) => {
      const card = this.createProductCard(product, index);
      contentDiv.appendChild(card);
    });
  }

  createProductCard(product, index) {
    const card = document.createElement('div');
    card.className = 'product-card fade-in';
    card.innerHTML = `
      <div class="flex gap-4">
        <img src="${product.galleryImageUrls[0]}" class="w-32 h-32 object-cover rounded-lg" alt="${product.title}">
        <div class="flex-1">
          <h3 class="font-bold text-xl mb-2">${product.title}</h3>
          <p class="text-sm text-zinc-600 mb-2">${product.short_description || ''}</p>
          <p class="text-green-600 font-bold text-xl mb-3">${product.price} MAD</p>
          <div class="flex gap-2">
            <button class="btn btn-blue text-sm" onclick="window.productManager.editProduct(${index})">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-gray text-sm" onclick="window.productManager.deleteProduct(${index})">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `;
    return card;
  }

  renderFetchedProducts() {
    const container = document.getElementById('fetchedProductsList');
    const emptyState = document.getElementById('fetchedEmptyState');
    
    if (window.state.fetchedProducts.length === 0) {
      container.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }
    
    container.style.display = 'grid';
    emptyState.style.display = 'none';
    container.innerHTML = '';
    
    window.state.fetchedProducts.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <img src="${product.images[0]?.src || ''}" class="w-full h-48 object-cover rounded-lg mb-3" alt="${product.name}">
        <h3 class="font-bold text-lg mb-2">${product.name}</h3>
        <p class="text-green-600 font-bold text-xl mb-3">${product.price} MAD</p>
        <div class="flex gap-2">
          <button class="btn btn-blue text-sm flex-1" onclick="window.productManager.editFetchedProduct(${product.id})">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn btn-gray text-sm flex-1" onclick="window.productManager.deleteFetchedProduct(${product.id})">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  updateCounts() {
    document.getElementById('fetchedCount').textContent = window.state.fetchedProducts.length;
    document.getElementById('resultsCount').textContent = window.state.products.length;
  }
}

window.uiManager = new UIManager();
