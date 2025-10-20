// Application State
const state = {
  uploadedImages: [],
  fetchedProducts: [],
  generatedProducts: [],
  storeCategories: [],
  selectedFetched: new Set(),
  selectedResults: new Set(),
  currentTab: 'upload'
};

// State Management Functions
function addUploadedImage(imageData) {
  state.uploadedImages.push(imageData);
  updateUI();
}

function removeUploadedImage(index) {
  state.uploadedImages.splice(index, 1);
  updateUI();
}

function setFetchedProducts(products) {
  state.fetchedProducts = products;
  updateUI();
}

function addGeneratedProduct(product) {
  state.generatedProducts.push(product);
  updateUI();
}

function updateGeneratedProduct(index, product) {
  state.generatedProducts[index] = product;
  updateUI();
}

function toggleFetchedSelection(productId) {
  if (state.selectedFetched.has(productId)) {
    state.selectedFetched.delete(productId);
  } else {
    state.selectedFetched.add(productId);
  }
  updateUI();
}

function toggleResultSelection(index) {
  if (state.selectedResults.has(index)) {
    state.selectedResults.delete(index);
  } else {
    state.selectedResults.add(index);
  }
  updateUI();
}

function clearSelections() {
  state.selectedFetched.clear();
  state.selectedResults.clear();
  updateUI();
}

function updateUI() {
  document.getElementById('fetchedCount').textContent = state.fetchedProducts.length;
  document.getElementById('resultsCount').textContent = state.generatedProducts.length;
  document.getElementById('generateBtn').disabled = state.uploadedImages.length === 0;
  document.getElementById('uploadWooBtn').disabled = state.generatedProducts.length === 0;
  document.getElementById('postFacebookBtn').disabled = state.generatedProducts.length === 0;
  
  // Update bulk action visibility
  const fetchedBulk = document.getElementById('fetchedBulkActions');
  const resultsBulk = document.getElementById('resultsBulkActions');
  
  if (state.selectedFetched.size > 0) {
    fetchedBulk.classList.remove('hidden');
    document.getElementById('fetchedSelectedCount').textContent = state.selectedFetched.size;
  } else {
    fetchedBulk.classList.add('hidden');
  }
  
  if (state.selectedResults.size > 0) {
    resultsBulk.classList.remove('hidden');
    document.getElementById('resultsSelectedCount').textContent = state.selectedResults.size;
  } else {
    resultsBulk.classList.add('hidden');
  }
}
