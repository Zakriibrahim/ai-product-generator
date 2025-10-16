/**
 * Main Application
 * Initializes and coordinates all modules
 */

// Global state
let appState = {
  singleBatches: [],
  productGroups: [],
  batchCounter: 0,
  groupCounter: 0,
  isGenerating: false
};

// Batch processing state
let batchState = {
  tasks: [],
  current: 0,
  running: false,
  autoResumeTimer: null
};

/**
 * Initialize application
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initializing AI Product Generator Pro...');
  
  // Initialize modules
  Utils.updateClock();
  AIAssistant.init();
  Templates.load();
  Templates.init();
  CategoryManager.fetchCategories();
  
  // Render initial empty states
  renderSingleBatches();
  renderGroups();
  ProductManager.updateUI();
  
  // Setup event listeners
  setupEventListeners();
  
  console.log('✅ Application ready!');
  Utils.notify('Welcome back, ' + CONFIG.USER_LOGIN + '! 👋', 'success');
});

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });
  
  // Upload section buttons
  document.getElementById('addSingleBatchBtn').addEventListener('click', addSingleBatch);
  document.getElementById('addGroupBtn').addEventListener('click', addProductGroup);
  document.getElementById('syncCategoriesBtn').addEventListener('click', () => CategoryManager.fetchCategories());
  document.getElementById('loadTemplateBtn').addEventListener('click', () => switchTab('templates'));
  
  // Action buttons
  document.getElementById('generateBtn').addEventListener('click', startGeneration);
  document.getElementById('uploadBtn').addEventListener('click', uploadProducts);
  document.getElementById('exportCsvBtn').addEventListener('click', exportCsv);
  document.getElementById('stopBtn').addEventListener('click', stopGeneration);
  
  // Session management
  document.getElementById('saveSessionBtn').addEventListener('click', saveSession);
  document.getElementById('loadSessionBtn').addEventListener('click', () => document.getElementById('loadSessionFile').click());
  document.getElementById('loadSessionFile').addEventListener('change', loadSession);
  
  // Quality check
  document.getElementById('runQualityCheck').addEventListener('click', () => QualityCheck.run());
  
  // Templates
  document.getElementById('createTemplateBtn').addEventListener('click', () => Templates.create());
  
  // Bulk edit
  document.getElementById('bulkFindReplaceBtn').addEventListener('click', () => BulkEdit.findReplace());
  document.getElementById('bulkPriceBtn').addEventListener('click', () => BulkEdit.adjustPrices());
  document.getElementById('bulkAddTagsBtn').addEventListener('click', () => BulkEdit.addTags());
  document.getElementById('bulkCategoriesBtn').addEventListener('click', () => BulkEdit.assignCategories());
  
  // Bulk actions bar
  document.getElementById('bulkDeleteBtn').addEventListener('click', () => BulkEdit.deleteSelected());
  document.getElementById('bulkCategoryAssignBtn').addEventListener('click', () => BulkEdit.assignCategoriesToSelected());
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
  const tabContent = document.getElementById(`tab-${tabName}`);
  
  if (tabBtn) tabBtn.classList.add('active');
  if (tabContent) tabContent.classList.add('active');
}

/**
 * Add single product batch
 */
function addSingleBatch() {
  const batchId = `batch-${appState.batchCounter++}`;
  const batch = {
    id: batchId,
    files: [],
    note: ''
  };
  
  appState.singleBatches.push(batch);
  renderSingleBatches();
}

/**
 * Render single product batches
 */
function renderSingleBatches() {
  const container = document.getElementById('single-batches-container');
  
  if (appState.singleBatches.length === 0) {
    container.innerHTML = `
      <div class="empty-placeholder">
        <i class="fas fa-images text-4xl text-zinc-300 mb-2"></i>
        <p class="text-zinc-400 text-sm">Click "Add Single Product Batch" to start</p>
      </div>
    `;
    updateGenerateButton();
    return;
  }
  
  container.innerHTML = appState.singleBatches.map((batch, idx) => `
    <div class="bg-white border-2 border-zinc-200 rounded-xl p-4 relative">
      <button class="absolute top-3 right-3 bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100 font-semibold text-xs transition-all"
              onclick="removeSingleBatch('${batch.id}')">
        <i class="fas fa-times"></i> Remove
      </button>
      
      <h3 class="font-semibold text-base text-indigo-600 mb-3">Batch ${idx + 1}</h3>
      
      <div class="mb-3">
        <div id="gallery-${batch.id}" class="flex flex-wrap gap-2 mb-2"></div>
        <div class="dropzone-area" id="dropzone-${batch.id}">
          <i class="fas fa-cloud-upload-alt text-3xl text-indigo-400 mb-2"></i>
          <input type="file" id="upload-${batch.id}" accept="image/*" multiple class="hidden">
          <label for="upload-${batch.id}" class="cursor-pointer">
            <div class="text-sm font-semibold text-indigo-600 mb-1">Click to upload or drag & drop</div>
            <div class="text-xs text-zinc-400">Each image becomes a separate product</div>
          </label>
        </div>
      </div>
      
      <textarea class="w-full p-3 border-2 border-zinc-200 rounded-lg text-sm resize-none focus:border-indigo-500 focus:outline-none transition-colors" 
                rows="2" 
                placeholder="Optional note for AI (e.g., 'colors: red, blue, green' or 'sizes: S, M, L')"
                onchange="updateBatchNote('${batch.id}', this.value)">${batch.note}</textarea>
    </div>
  `).join('');
  
  // Setup file handlers for each batch
  appState.singleBatches.forEach(batch => {
    setupBatchFileHandlers(batch);
    renderBatchGallery(batch);
  });
  
  updateGenerateButton();
}

/**
 * Setup file upload handlers for batch
 */
function setupBatchFileHandlers(batch) {
  const input = document.getElementById(`upload-${batch.id}`);
  const dropzone = document.getElementById(`dropzone-${batch.id}`);
  
  if (!input || !dropzone) return;
  
  input.addEventListener('change', (e) => handleBatchFiles(e, batch.id));
  
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });
  
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('drag-over');
  });
  
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    if (e.dataTransfer.files) {
      handleBatchFiles({ target: { files: e.dataTransfer.files } }, batch.id);
    }
  });
}

/**
 * Handle file uploads for batch
 */
async function handleBatchFiles(event, batchId) {
  const batch = appState.singleBatches.find(b => b.id === batchId);
  if (!batch || !event.target.files.length) return;
  
  for (const file of Array.from(event.target.files)) {
    try {
      ImageHandler.validateImage(file);
      
      const imgObj = {
        file: file,
        preview: '',
        uploading: true,
        url: '',
        error: false
      };
      
      batch.files.push(imgObj);
      renderBatchGallery(batch);
      
      // Convert to base64 for preview
      const b64 = await ImageHandler.fileToBase64(file);
      imgObj.preview = `data:image/jpeg;base64,${b64}`;
      renderBatchGallery(batch);
      
      // Upload to ImgBB
      imgObj.url = await ImageHandler.uploadToImgbb(b64, file.name);
      imgObj.uploading = false;
      renderBatchGallery(batch);
      
    } catch (error) {
      Utils.notify(`Upload failed: ${error.message}`, 'error');
      const imgObj = batch.files[batch.files.length - 1];
      if (imgObj) {
        imgObj.uploading = false;
        imgObj.error = true;
        renderBatchGallery(batch);
      }
    }
  }
  
  updateGenerateButton();
}

/**
 * Render batch gallery
 */
function renderBatchGallery(batch) {
  const gallery = document.getElementById(`gallery-${batch.id}`);
  if (!gallery) return;
  
  gallery.innerHTML = batch.files.map((img, idx) => `
    <div class="relative ${img.uploading ? 'img-uploading' : ''} ${img.error ? 'img-error' : ''}">
      <img src="${img.preview || ''}" class="img-thumb" alt="Upload ${idx}">
      ${img.uploading ? '<div class="absolute inset-0 flex items-center justify-center"><div class="spinner" style="width:30px;height:30px;border-width:3px;"></div></div>' : ''}
      <div class="delete-image-btn" onclick="removeBatchImage('${batch.id}', ${idx})">
        <i class="fas fa-times"></i>
      </div>
    </div>
  `).join('');
}

/**
 * Update batch note
 */
window.updateBatchNote = function(batchId, note) {
  const batch = appState.singleBatches.find(b => b.id === batchId);
  if (batch) {
    batch.note = note;
  }
};

/**
 * Remove single batch
 */
window.removeSingleBatch = function(batchId) {
  appState.singleBatches = appState.singleBatches.filter(b => b.id !== batchId);
  renderSingleBatches();
};

/**
 * Remove image from batch
 */
window.removeBatchImage = function(batchId, index) {
  const batch = appState.singleBatches.find(b => b.id === batchId);
  if (batch) {
    batch.files.splice(index, 1);
    renderBatchGallery(batch);
    updateGenerateButton();
  }
};

/**
 * Add multi-image product group
 */
function addProductGroup() {
  const groupId = `group-${appState.groupCounter++}`;
  const group = {
    id: groupId,
    files: [],
    note: ''
  };
  
  appState.productGroups.push(group);
  renderGroups();
}

/**
 * Render product groups
 */
function renderGroups() {
  const container = document.getElementById('groups-container');
  
  if (appState.productGroups.length === 0) {
    container.innerHTML = `
      <div class="empty-placeholder">
        <i class="fas fa-layer-group text-4xl text-zinc-300 mb-2"></i>
        <p class="text-zinc-400 text-sm">Click "Add Multi-Image Product" to start</p>
      </div>
    `;
    updateGenerateButton();
    return;
  }
  
  container.innerHTML = appState.productGroups.map((group, idx) => `
    <div class="bg-white border-2 border-zinc-200 rounded-xl p-4 relative">
      <button class="absolute top-3 right-3 bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100 font-semibold text-xs transition-all"
              onclick="removeGroup('${group.id}')">
        <i class="fas fa-trash"></i> Remove
      </button>
      
      <h3 class="font-semibold text-lg text-indigo-700 mb-3 flex items-center gap-2">
        <i class="fas fa-layer-group"></i> Product ${idx + 1}
      </h3>
      
      <div class="mb-3">
        <div id="gallery-${group.id}" class="flex flex-wrap gap-2 mb-2"></div>
        <div class="dropzone-area" id="dropzone-${group.id}">
          <i class="fas fa-images text-3xl text-indigo-400 mb-2"></i>
          <input type="file" id="upload-${group.id}" accept="image/*" multiple class="hidden">
          <label for="upload-${group.id}" class="cursor-pointer">
            <div class="text-sm font-semibold text-indigo-600 mb-1">Click to upload or drag & drop</div>
            <div class="text-xs text-zinc-400">All images = 1 product with gallery</div>
          </label>
        </div>
      </div>
      
      <textarea class="w-full p-3 border-2 border-zinc-200 rounded-lg text-sm resize-none focus:border-indigo-500 focus:outline-none transition-colors" 
                rows="2" 
                placeholder="Optional note (e.g., 'red->0, blue->1' for image mapping)"
                onchange="updateGroupNote('${group.id}', this.value)">${group.note}</textarea>
    </div>
  `).join('');
  
  // Setup file handlers
  appState.productGroups.forEach(group => {
    setupGroupFileHandlers(group);
    renderGroupGallery(group);
  });
  
  updateGenerateButton();
}

/**
 * Setup file handlers for group
 */
function setupGroupFileHandlers(group) {
  const input = document.getElementById(`upload-${group.id}`);
  const dropzone = document.getElementById(`dropzone-${group.id}`);
  
  if (!input || !dropzone) return;
  
  input.addEventListener('change', (e) => handleGroupFiles(e, group.id));
  
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });
  
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('drag-over');
  });
  
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    if (e.dataTransfer.files) {
      handleGroupFiles({ target: { files: e.dataTransfer.files } }, group.id);
    }
  });
}

/**
 * Handle file uploads for group
 */
async function handleGroupFiles(event, groupId) {
  const group = appState.productGroups.find(g => g.id === groupId);
  if (!group || !event.target.files.length) return;
  
  for (const file of Array.from(event.target.files)) {
    try {
      ImageHandler.validateImage(file);
      
      const imgObj = {
        file: file,
        preview: '',
        uploading: true,
        url: '',
        error: false
      };
      
      group.files.push(imgObj);
      renderGroupGallery(group);
      
      const b64 = await ImageHandler.fileToBase64(file);
      imgObj.preview = `data:image/jpeg;base64,${b64}`;
      renderGroupGallery(group);
      
      imgObj.url = await ImageHandler.uploadToImgbb(b64, file.name);
      imgObj.uploading = false;
      renderGroupGallery(group);
      
    } catch (error) {
      Utils.notify(`Upload failed: ${error.message}`, 'error');
      const imgObj = group.files[group.files.length - 1];
      if (imgObj) {
        imgObj.uploading = false;
        imgObj.error = true;
        renderGroupGallery(group);
      }
    }
  }
  
  updateGenerateButton();
}

/**
 * Render group gallery
 */
function renderGroupGallery(group) {
  const gallery = document.getElementById(`gallery-${group.id}`);
  if (!gallery) return;
  
  gallery.innerHTML = group.files.map((img, idx) => `
    <div class="relative ${img.uploading ? 'img-uploading' : ''} ${img.error ? 'img-error' : ''}">
      <img src="${img.preview || ''}" class="img-thumb" alt="Image ${idx}">
      <div class="absolute bottom-1 left-1 bg-indigo-600 text-white text-xs font-bold rounded px-1.5 py-0.5">${idx}</div>
      ${img.uploading ? '<div class="absolute inset-0 flex items-center justify-center"><div class="spinner" style="width:30px;height:30px;border-width:3px;"></div></div>' : ''}
      <div class="delete-image-btn" onclick="removeGroupImage('${group.id}', ${idx})">
        <i class="fas fa-times"></i>
      </div>
    </div>
  `).join('');
}

/**
 * Update group note
 */
window.updateGroupNote = function(groupId, note) {
  const group = appState.productGroups.find(g => g.id === groupId);
  if (group) {
    group.note = note;
  }
};

/**
 * Remove group
 */
window.removeGroup = function(groupId) {
  appState.productGroups = appState.productGroups.filter(g => g.id !== groupId);
  renderGroups();
};

/**
 * Remove image from group
 */
window.removeGroupImage = function(groupId, index) {
  const group = appState.productGroups.find(g => g.id === groupId);
  if (group) {
    group.files.splice(index, 1);
    renderGroupGallery(group);
    updateGenerateButton();
  }
};

/**
 * Update generate button state
 */
function updateGenerateButton() {
  const hasImages = appState.singleBatches.some(b => b.files.length > 0) || 
                    appState.productGroups.some(g => g.files.length > 0);
  document.getElementById('generateBtn').disabled = !hasImages;
}

/**
 * Start product generation
 */
async function startGeneration() {
  if (appState.isGenerating) return;
  
  appState.isGenerating = true;
  AIProcessor.abortController = new AbortController();
  
  // Clear previous products
  ProductManager.clearAll();
  
  // Build task list
  const tasks = [];
  
  // Single batches - each image = 1 product
  appState.singleBatches.forEach(batch => {
    batch.files.forEach(imgObj => {
      if (imgObj.url) {
        tasks.push({
          files: [imgObj],
          note: batch.note,
          mode: 'single'
        });
      }
    });
  });
  
  // Multi-image groups
  appState.productGroups.forEach(group => {
    const validFiles = group.files.filter(imgObj => imgObj.url);
    if (validFiles.length > 0) {
      tasks.push({
        files: validFiles,
        note: group.note,
        mode: 'group'
      });
    }
  });
  
  if (tasks.length === 0) {
    Utils.notify('No images to process', 'warning');
    appState.isGenerating = false;
    return;
  }
  
  // Switch to products tab
  switchTab('products');
  
  // Show loading
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('progressBarContainer').classList.remove('hidden');
  
  batchState = {
    tasks,
    current: 0,
    running: true,
    autoResumeTimer: null
  };
  
  runBatchGeneration();
}

/**
 * Run batch generation
 */
function runBatchGeneration() {
  const { tasks, current } = batchState;
  if (!batchState.running) return;
  
  const end = Math.min(current + CONFIG.BATCH_LIMIT, tasks.length);
  
  processBatchTasks(tasks, current, end, () => {
    batchState.current = end;
    
    if (end < tasks.length) {
      // Pause for rate limiting
      document.getElementById('batchPause').classList.remove('hidden');
      let countdown = CONFIG.BATCH_PAUSE_SECONDS;
      document.getElementById('pauseCountdown').textContent = countdown;
      
      batchState.running = false;
      batchState.autoResumeTimer = setTimeout(() => {
        batchState.running = true;
        document.getElementById('batchPause').classList.add('hidden');
        runBatchGeneration();
      }, CONFIG.BATCH_PAUSE_SECONDS * 1000);
      
      const interval = setInterval(() => {
        countdown--;
        document.getElementById('pauseCountdown').textContent = countdown;
        if (countdown <= 0) clearInterval(interval);
      }, 1000);
    } else {
      // Complete
      finishGeneration();
    }
  });
}

/**
 * Process batch tasks
 */
function processBatchTasks(tasks, start, end, onDone) {
  let i = start;
  
  async function processNext() {
    if (!batchState.running || AIProcessor.abortController.signal.aborted) {
      document.getElementById('loadingMessage').textContent = 'Stopped.';
      setTimeout(() => finishGeneration(), 1500);
      return;
    }
    
    if (i >= end) {
      onDone();
      return;
    }
    
    const task = tasks[i];
    const progress = Math.round(((i + 1) / tasks.length) * 100);
    
    document.getElementById('loadingMessage').textContent = `Generating product ${i + 1} of ${tasks.length}...`;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `${i + 1} / ${tasks.length} products generated`;
    
    try {
      const { product, base64s } = await AIProcessor.generateProduct(task.files, task.note);
      
      // Get translations
      const translations = await AIProcessor.translateProduct(product, 'fr');
      
      // Get Arabic category
      const category_ar = await AIProcessor.getArabicCategory(product.categories, base64s, task.note);
      
      // Auto-select categories
      const selectedCategories = CategoryManager.autoSelectCategories(product.categories, category_ar);
      
      // Build final product
      const finalProduct = {
        ...product,
        translations,
        category_ar,
        selectedCategories,
        note: task.note,
        mode: task.mode,
        galleryImageUrls: task.files.map(f => f.url),
        galleryBase64s: base64s
      };
      
      ProductManager.addProduct(finalProduct);
      
      i++;
      processNext();
      
    } catch (error) {
      if (String(error).includes('rate limit') || String(error).includes('429')) {
        // Rate limit hit, pause and retry
        document.getElementById('batchPause').classList.remove('hidden');
        batchState.running = false;
        
        setTimeout(() => {
          batchState.running = true;
          document.getElementById('batchPause').classList.add('hidden');
          processNext();
        }, CONFIG.BATCH_PAUSE_SECONDS * 1000);
      } else {
        Utils.notify(`Failed to generate product ${i + 1}: ${error.message}`, 'error');
        i++;
        processNext();
      }
    }
  }
  
  processNext();
}

/**
 * Finish generation
 */
function finishGeneration() {
  document.getElementById('loading').classList.add('hidden');
  appState.isGenerating = false;
  
  Utils.notify(`✅ Generated ${ProductManager.products.length} products!`, 'success', 5000);
}

/**
 * Stop generation
 */
function stopGeneration() {
  batchState.running = false;
  if (batchState.autoResumeTimer) {
    clearTimeout(batchState.autoResumeTimer);
  }
  AIProcessor.abort();
  document.getElementById('loadingMessage').textContent = 'Stopping...';
}

/**
 * Upload products to WooCommerce
 */
function uploadProducts() {
  const lang = document.getElementById('exportLang').value;
  Exporters.uploadToWooCommerce(ProductManager.products, lang);
}

/**
 * Export to CSV
 */
function exportCsv() {
  Exporters.exportToCSV(ProductManager.products);
}

/**
 * Save session
 */
function saveSession() {
  const session = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    user: CONFIG.USER_LOGIN,
    singleBatches: appState.singleBatches.map(b => ({
      ...b,
      files: b.files.map(f => ({ preview: f.preview, url: f.url }))
    })),
    productGroups: appState.productGroups.map(g => ({
      ...g,
      files: g.files.map(f => ({ preview: f.preview, url: f.url }))
    })),
    products: ProductManager.products,
    categories: CategoryManager.categories
  };
  
  const filename = `session-${new Date().toISOString().slice(0, 10)}.json`;
  Utils.downloadFile(JSON.stringify(session, null, 2), filename);
  Utils.notify('✓ Session saved!', 'success');
}

/**
 * Load session
 */
function loadSession(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const session = JSON.parse(e.target.result);
      
      // Restore state
      appState.singleBatches = session.singleBatches || [];
      appState.productGroups = session.productGroups || [];
      ProductManager.products = session.products || [];
      CategoryManager.categories = session.categories || CategoryManager.categories;
      
      // Re-render
      renderSingleBatches();
      renderGroups();
      ProductManager.updateUI();
      CategoryManager.renderCategorySelectors();
      
      Utils.notify('✓ Session loaded!', 'success');
    } catch (error) {
      Utils.notify('Failed to load session: ' + error.message, 'error');
    }
  };
  reader.readAsText(file);
  
  // Reset file input
  event.target.value = '';
}

/**
 * Hide error banner
 */
function hideError() {
  document.getElementById('error').classList.add('hidden');
}

/**
 * Close modal
 */
function closeModal() {
  document.getElementById('modalBg').classList.add('hidden');
  document.getElementById('modalContainer').classList.add('hidden');
}

// Make functions globally available
window.switchTab = switchTab;
window.hideError = hideError;
window.closeModal = closeModal;

console.log('✅ Main application loaded');
console.log('👤 User:', CONFIG.USER_LOGIN);
console.log('🎉 Ready to generate products!');
