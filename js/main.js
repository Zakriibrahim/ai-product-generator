// Main Application
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize
  await initializeApp();
  setupEventListeners();
});

async function initializeApp() {
  uiManager.showLoading('Chargement des produits...');
  
  try {
    // Fetch store products on startup
    const products = await api.fetchWooProducts();
    setFetchedProducts(products);
    
    // Fetch categories
    const categories = await api.fetchWooCategories();
    state.storeCategories = categories;
    
    uiManager.renderFetchedProducts();
    uiManager.hideError();
  } catch (e) {
    uiManager.showError('Erreur lors du chargement: ' + e.message);
  }
  
  uiManager.hideLoading();
}

function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      uiManager.switchTab(btn.dataset.tab);
    });
  });

  // Image upload
  const imageUpload = document.getElementById('imageUpload');
  const dropzone = document.getElementById('dropzone');

  imageUpload.addEventListener('change', handleImageUpload);
  
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });
  
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('drag-over');
  });
  
  dropzone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    await handleImageUpload({ target: { files: e.dataTransfer.files } });
  });

  // Generate button
  document.getElementById('generateBtn').addEventListener('click', handleGenerate);

  // Search
  document.getElementById('searchFetched').addEventListener('input', (e) => {
    uiManager.renderFetchedProducts(e.target.value);
  });

  // Refresh store
  document.getElementById('refreshStoreBtn').addEventListener('click', initializeApp);

  // Bulk actions
  document.getElementById('fetchedBulkDelete').addEventListener('click', handleBulkDeleteFetched);
  document.getElementById('resultsBulkCategory').addEventListener('click', () => productManager.bulkAssignCategory());
  document.getElementById('resultsBulkPrice').addEventListener('click', () => productManager.bulkChangePrice());

  // Upload to WooCommerce
  document.getElementById('uploadWooBtn').addEventListener('click', () => productManager.bulkUploadToWoo());

  // Post to Facebook
  document.getElementById('postFacebookBtn').addEventListener('click', () => facebookManager.bulkPostToFacebook());

  // Session management
  document.getElementById('saveSessionBtn').addEventListener('click', handleSaveSession);
  document.getElementById('loadSessionBtn').addEventListener('click', () => {
    document.getElementById('loadSessionFile').click();
  });
  document.getElementById('loadSessionFile').addEventListener('change', handleLoadSession);

  // Modal close
  document.getElementById('modalBg').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalBg')) {
      uiManager.closeModal();
    }
  });
}

async function handleImageUpload(event) {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  uiManager.showLoading('Traitement des images...');

  for (const file of files) {
    try {
      // Process image
      const imageData = await imageProcessor.processImage(file);
      addUploadedImage(imageData);
      uiManager.renderImageGallery();

      // Upload to ImgBB
      imageData.uploading = true;
      uiManager.renderImageGallery();
      
      imageData.url = await api.uploadToImgBB(imageData.base64, file.name);
      imageData.uploading = false;
      uiManager.renderImageGallery();
      
    } catch (e) {
      uiManager.showError('Erreur upload image: ' + e.message);
    }
  }

  uiManager.hideLoading();
  event.target.value = '';
}

async function handleGenerate() {
  if (state.uploadedImages.length === 0) return;

  uiManager.showLoading('Génération des données produits...');
  uiManager.switchTab('results');

  const total = state.uploadedImages.length;
  
  for (let i = 0; i < total; i++) {
    try {
      uiManager.showProgress(i + 1, total);
      const productData = await productManager.generateProductData(state.uploadedImages[i]);
      addGeneratedProduct(productData);
      uiManager.renderResults();
    } catch (e) {
      console.error('Generation failed:', e);
      uiManager.showError(`Erreur produit ${i + 1}: ${e.message}`);
    }
  }

  uiManager.hideLoading();
  
  // Clear uploaded images after generation
  state.uploadedImages = [];
  uiManager.renderImageGallery();
}

async function handleBulkDeleteFetched() {
  if (!confirm(`Supprimer ${state.selectedFetched.size} produit(s)?`)) return;

  uiManager.showLoading('Suppression...');

  for (const productId of state.selectedFetched) {
    try {
      await api.deleteWooProduct(productId);
    } catch (e) {
      console.error('Delete failed:', e);
    }
  }

  clearSelections();
  await initializeApp();
  uiManager.hideLoading();
}

function handleSaveSession() {
  const session = {
    generatedProducts: state.generatedProducts,
    storeCategories: state.storeCategories,
    timestamp: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-products-session-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleLoadSession(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const session = JSON.parse(e.target.result);
      state.generatedProducts = session.generatedProducts || [];
      state.storeCategories = session.storeCategories || state.storeCategories;
      uiManager.renderResults();
      updateUI();
      alert('Session chargée avec succès!');
    } catch (e) {
      uiManager.showError('Erreur chargement session: ' + e.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// Global handlers for inline events
window.handleRemoveImage = (index) => {
  removeUploadedImage(index);
  uiManager.renderImageGallery();
};

window.handleToggleFetched = (productId) => {
  toggleFetchedSelection(productId);
  uiManager.renderFetchedProducts();
};

window.handleToggleResult = (index) => {
  toggleResultSelection(index);
  uiManager.renderResults();
};

window.handleCategoryChange = (index, categoryId) => {
  state.generatedProducts[index].category_id = parseInt(categoryId);
};

window.handleEditProduct = (index) => {
  const product = state.generatedProducts[index];
  
  const modalContent = `
    <div class="modal-close" onclick="uiManager.closeModal()">
      <i class="fas fa-times"></i>
    </div>
    <div class="modal-title">Modifier le produit</div>
    
    <div class="modal-section">
      <label class="modal-label">Titre</label>
      <input type="text" class="modal-input" id="editTitle" value="${product.title}">
    </div>
    
    <div class="modal-section">
      <label class="modal-label">Description courte</label>
      <textarea class="modal-textarea" id="editShort">${product.short_description}</textarea>
    </div>
    
    <div class="modal-section">
      <label class="modal-label">Description</label>
      <textarea class="modal-textarea" id="editDesc">${product.description}</textarea>
    </div>
    
    <div class="modal-section">
      <label class="modal-label">Prix (MAD)</label>
      <input type="text" class="modal-input" id="editPrice" value="${product.price}">
    </div>
    
    <div class="modal-section">
      <label class="modal-label">Tags (séparés par virgule)</label>
      <input type="text" class="modal-input" id="editTags" value="${product.tags.join(', ')}">
    </div>
    
    <div class="flex gap-3 mt-6">
      <button class="btn btn-green" onclick="saveProductEdit(${index})">
        <i class="fas fa-save"></i> Sauvegarder
      </button>
      <button class="btn btn-gray" onclick="uiManager.closeModal()">
        Annuler
      </button>
    </div>
  `;
  
  uiManager.openModal(modalContent);
};

window.saveProductEdit = (index) => {
  const product = state.generatedProducts[index];
  
  product.title = document.getElementById('editTitle').value;
  product.short_description = document.getElementById('editShort').value;
  product.description = document.getElementById('editDesc').value;
  product.price = document.getElementById('editPrice').value;
  product.tags = document.getElementById('editTags').value.split(',').map(t => t.trim());
  
  updateGeneratedProduct(index, product);
  uiManager.renderResults();
  uiManager.closeModal();
};

window.handleRegenerateProduct = async (index) => {
  uiManager.showLoading('Régénération...');
  
  try {
    const imageData = {
      base64: state.generatedProducts[index].base64Images[0],
      url: state.generatedProducts[index].images[0]
    };
    
    const newData = await productManager.generateProductData(imageData);
    updateGeneratedProduct(index, newData);
    uiManager.renderResults();
  } catch (e) {
    uiManager.showError('Erreur régénération: ' + e.message);
  }
  
  uiManager.hideLoading();
};
