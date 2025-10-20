// Initialize application state
let currentUploadMode = CONFIG.UPLOAD_MODE.SINGLE;

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  setupTabNavigation();
  setupUploadMode();
  setupImageUpload();
  setupActionButtons();
  setupBulkActions();
  setupSearch();
  
  console.log('✅ AI Product Generator initialized');
}

// Tab Navigation
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;

      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`tab-${tabId}`).classList.add('active');
    });
  });
}

// Upload Mode Toggle
function setupUploadMode() {
  const singleBtn = document.getElementById('singleProductBtn');
  const groupBtn = document.getElementById('groupProductBtn');
  const singleSection = document.getElementById('singleProductSection');
  const groupSection = document.getElementById('groupProductSection');
  const modeIndicator = document.getElementById('currentMode');

  singleBtn.addEventListener('click', () => {
    currentUploadMode = CONFIG.UPLOAD_MODE.SINGLE;
    singleSection.style.display = 'block';
    groupSection.style.display = 'none';
    modeIndicator.textContent = 'Single Product';
    singleBtn.classList.add('btn-green');
    groupBtn.classList.remove('btn-orange');
  });

  groupBtn.addEventListener('click', () => {
    currentUploadMode = CONFIG.UPLOAD_MODE.GROUP;
    singleSection.style.display = 'none';
    groupSection.style.display = 'block';
    modeIndicator.textContent = 'Group Product';
    groupBtn.classList.add('btn-orange');
    singleBtn.classList.remove('btn-green');
  });
}

// Image Upload
function setupImageUpload() {
  // Single mode
  const uploadSingle = document.getElementById('imageUploadSingle');
  const dropzoneSingle = document.getElementById('dropzoneSingle');

  uploadSingle.addEventListener('change', (e) => handleImageSelect(e, 'single'));
  setupDropzone(dropzoneSingle, uploadSingle);

  // Group mode
  const uploadGroup = document.getElementById('imageUploadGroup');
  const dropzoneGroup = document.getElementById('dropzoneGroup');

  uploadGroup.addEventListener('change', (e) => handleImageSelect(e, 'group'));
  setupDropzone(dropzoneGroup, uploadGroup);

  // Generate button
  document.getElementById('generateBtn').addEventListener('click', generateProducts);
}

function setupDropzone(dropzone, input) {
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, preventDefaults, false);
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => dropzone.classList.add('drag-over'));
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => dropzone.classList.remove('drag-over'));
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    input.files = files;
    handleImageSelect({ target: input }, dropzone.id.includes('Single') ? 'single' : 'group');
  });
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

async function handleImageSelect(event, mode) {
  const files = Array.from(event.target.files);
  const galleryId = mode === 'single' ? 'imageGallerySingle' : 'imageGalleryGroup';
  const gallery = document.getElementById(galleryId);

  gallery.innerHTML = '';

  for (const file of files) {
    const preview = await createImagePreview(file);
    gallery.appendChild(preview);
  }

  document.getElementById('generateBtn').disabled = files.length === 0;
}

async function createImagePreview(file) {
  const div = document.createElement('div');
  div.className = 'image-preview';

  const img = document.createElement('img');
  img.src = URL.createObjectURL(file);

  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-btn';
  removeBtn.innerHTML = '<i class="fas fa-times"></i>';
  removeBtn.onclick = () => div.remove();

  div.appendChild(img);
  div.appendChild(removeBtn);

  return div;
}

async function generateProducts() {
  const mode = currentUploadMode;
  const inputId = mode === 'single' ? 'imageUploadSingle' : 'imageUploadGroup';
  const files = Array.from(document.getElementById(inputId).files);

  if (files.length === 0) return;

  window.uiManager.showLoading('Generating product data...');

  try {
    let products = [];

    if (mode === CONFIG.UPLOAD_MODE.SINGLE) {
      // Each image = 1 product
      for (let i = 0; i < files.length; i++) {
        window.uiManager.updateProgress(i + 1, files.length);
        const productData = await window.api.analyzeImage(files[i]);
        products.push(productData);
      }
    } else {
      // All images = 1 product
      const productData = await window.api.analyzeMultipleImages(files);
      products.push(productData);
    }

    window.state.addProducts(products);
    window.uiManager.renderResults();
    
    // Switch to results tab
    document.querySelector('[data-tab="results"]').click();

    window.uiManager.hideLoading();
    alert(`✅ Generated ${products.length} product(s)!`);

  } catch (error) {
    window.uiManager.hideLoading();
    window.uiManager.showError(error.message);
  }
}

// Action Buttons
function setupActionButtons() {
  document.getElementById('uploadWooBtn').addEventListener('click', uploadToWooCommerce);
  document.getElementById('postSocialBtn').addEventListener('click', postToSocial);
  document.getElementById('saveSessionBtn').addEventListener('click', saveSession);
  document.getElementById('loadSessionBtn').addEventListener('click', () => {
    document.getElementById('loadSessionFile').click();
  });
  document.getElementById('loadSessionFile').addEventListener('change', loadSession);
  document.getElementById('refreshStoreBtn').addEventListener('click', refreshStore);
}

async function uploadToWooCommerce() {
  const products = window.state.getSelectedProducts('results');
  if (products.length === 0) {
    alert('Please select products to upload');
    return;
  }

  await window.api.uploadToWooCommerce(products);
}

async function postToSocial() {
  const products = window.state.getSelectedProducts('results');
  if (products.length === 0) {
    alert('Please select products to post');
    return;
  }

  await window.socialWebhook.showPlatformSelection(products);
}

function saveSession() {
  const data = {
    products: window.state.products,
    fetchedProducts: window.state.fetchedProducts,
    timestamp: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `session-${Date.now()}.json`;
  a.click();
}

function loadSession(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      window.state.products = data.products || [];
      window.state.fetchedProducts = data.fetchedProducts || [];
      window.uiManager.renderResults();
      window.uiManager.renderFetchedProducts();
      alert('✅ Session loaded successfully!');
    } catch (error) {
      alert('❌ Error loading session');
    }
  };
  reader.readAsText(file);
}

async function refreshStore() {
  await window.api.fetchProductsFromStore();
}

// Bulk Actions
function setupBulkActions() {
  // Fetched products bulk actions
  document.getElementById('fetchedBulkEdit').addEventListener('click', () => bulkEdit('fetched'));
  document.getElementById('fetchedBulkCategory').addEventListener('click', () => bulkAssignCategories('fetched'));
  document.getElementById('fetchedBulkSocial').addEventListener('click', () => bulkPostSocial('fetched'));
  document.getElementById('fetchedBulkUpdate').addEventListener('click', () => bulkUpdateStore('fetched'));
  document.getElementById('fetchedBulkRegenerate').addEventListener('click', () => bulkRegenerate('fetched'));
  document.getElementById('fetchedBulkDelete').addEventListener('click', () => bulkDelete('fetched'));

  // Results bulk actions
  document.getElementById('resultsBulkEdit').addEventListener('click', () => bulkEdit('results'));
  document.getElementById('resultsBulkCategory').addEventListener('click', () => bulkAssignCategories('results'));
  document.getElementById('resultsBulkRegenerate').addEventListener('click', () => bulkRegenerate('results'));
  document.getElementById('resultsBulkDelete').addEventListener('click', () => bulkDelete('results'));
}

function bulkEdit(tab) {
  const products = window.state.getSelectedProducts(tab);
  if (products.length === 0) {
    alert('Please select products to edit');
    return;
  }
  // Implement edit functionality
  alert(`Editing ${products.length} products...`);
}

async function bulkAssignCategories(tab) {
  const products = window.state.getSelectedProducts(tab);
  if (products.length === 0) {
    alert('Please select products to assign categories');
    return;
  }

  await window.categoryModal.show(products);
}

async function bulkPostSocial(tab) {
  const products = window.state.getSelectedProducts(tab);
  if (products.length === 0) {
    alert('Please select products to post');
    return;
  }

  await window.socialWebhook.showPlatformSelection(products);
}

async function bulkUpdateStore(tab) {
  const products = window.state.getSelectedProducts(tab);
  if (products.length === 0) {
    alert('Please select products to update');
    return;
  }

  await window.api.updateProductsInStore(products);
}

async function bulkRegenerate(tab) {
  const products = window.state.getSelectedProducts(tab);
  if (products.length === 0) {
    alert('Please select products to regenerate');
    return;
  }

  // Implement regenerate functionality
  alert(`Regenerating ${products.length} products...`);
}

function bulkDelete(tab) {
  const products = window.state.getSelectedProducts(tab);
  if (products.length === 0) {
    alert('Please select products to delete');
    return;
  }

  if (!confirm(`Delete ${products.length} product(s)?`)) return;

  products.forEach(p => {
    if (tab === 'fetched') {
      window.state.removeFetchedProduct(p.id);
    } else {
      window.state.removeProduct(p.id);
    }
  });

  if (tab === 'fetched') {
    window.uiManager.renderFetchedProducts();
  } else {
    window.uiManager.renderResults();
  }
}

// Search
function setupSearch() {
  document.getElementById('searchFetched').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    filterProducts('fetched', query);
  });
}

function filterProducts(tab, query) {
  const cards = document.querySelectorAll(`#${tab}ProductsList .product-card`);
  cards.forEach(card => {
    const title = card.querySelector('h3').textContent.toLowerCase();
    card.style.display = title.includes(query) ? 'block' : 'none';
  });
}

/* =========================
   Theme Toggle
   ========================= */
function toggleTheme() {
  const html = document.documentElement;
  const icon = document.getElementById('themeIcon');
  const currentTheme = html.getAttribute('data-theme');
  
  if (currentTheme === 'dark') {
    html.removeAttribute('data-theme');
    icon.className = 'fas fa-moon';
    localStorage.setItem('theme', 'light');
  } else {
    html.setAttribute('data-theme', 'dark');
    icon.className = 'fas fa-sun';
    localStorage.setItem('theme', 'dark');
  }
}

// Load saved theme on page load
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = 'fas fa-sun';
  }
});

window.toggleTheme = toggleTheme;

// Refresh Store Products
document.getElementById('refreshStoreBtn').addEventListener('click', () => {
  window.api.fetchProductsFromStore();
});
