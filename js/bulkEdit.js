/**
 * Bulk Edit
 * Mass edit operations on products
 */

const BulkEdit = {
  /**
   * Find and replace text
   */
  findReplace() {
    const findText = document.getElementById('bulkFindText').value;
    const replaceText = document.getElementById('bulkReplaceText').value;
    const field = document.getElementById('bulkFindField').value;

    if (!findText) {
      Utils.notify('Please enter text to find', 'warning');
      return;
    }

    let count = 0;
    const regex = new RegExp(Utils.escapeHtml(findText), 'gi');

    ProductManager.products.forEach(product => {
      if (product[field] && typeof product[field] === 'string') {
        const original = product[field];
        product[field] = product[field].replace(regex, replaceText);
        if (product[field] !== original) count++;
      } else if (Array.isArray(product[field])) {
        product[field] = product[field].map(item => {
          const original = item;
          const replaced = String(item).replace(regex, replaceText);
          if (replaced !== original) count++;
          return replaced;
        });
      }
    });

    ProductManager.updateUI();
    Utils.notify(`✓ Replaced in ${count} products`, 'success');
  },

  /**
   * Adjust prices
   */
  adjustPrices() {
    const operation = document.getElementById('bulkPriceOperation').value;
    const value = parseFloat(document.getElementById('bulkPriceValue').value);

    if (isNaN(value)) {
      Utils.notify('Please enter a valid number', 'warning');
      return;
    }

    ProductManager.products.forEach(product => {
      const currentPrice = parseFloat(product.price) || 0;
      let newPrice = currentPrice;

      switch (operation) {
        case 'add':
          newPrice = currentPrice + value;
          break;
        case 'subtract':
          newPrice = Math.max(0, currentPrice - value);
          break;
        case 'multiply':
          newPrice = currentPrice * (1 + value / 100);
          break;
        case 'set':
          newPrice = value;
          break;
      }

      product.price = newPrice.toFixed(2);

      // Update variations too
      if (product.variations) {
        product.variations.forEach(variation => {
          const varPrice = parseFloat(variation.price) || currentPrice;
          let newVarPrice = varPrice;

          switch (operation) {
            case 'add':
              newVarPrice = varPrice + value;
              break;
            case 'subtract':
              newVarPrice = Math.max(0, varPrice - value);
              break;
            case 'multiply':
              newVarPrice = varPrice * (1 + value / 100);
              break;
            case 'set':
              newVarPrice = value;
              break;
          }

          variation.price = newVarPrice.toFixed(2);
        });
      }
    });

    ProductManager.updateUI();

    const opText = {
      add: `Added ${value} MAD`,
      subtract: `Subtracted ${value} MAD`,
      multiply: `Increased by ${value}%`,
      set: `Set to ${value} MAD`
    };

    Utils.notify(`✓ ${opText[operation]} for all products`, 'success');
  },

  /**
   * Add tags
   */
  addTags() {
    const tagsInput = document.getElementById('bulkAddTags').value;
    const newTags = tagsInput.split(',').map(s => s.trim()).filter(Boolean);

    if (newTags.length === 0) {
      Utils.notify('Please enter tags to add', 'warning');
      return;
    }

    ProductManager.products.forEach(product => {
      if (!product.tags) product.tags = [];

      newTags.forEach(tag => {
        if (!product.tags.includes(tag)) {
          product.tags.push(tag);
        }
      });
    });

    ProductManager.updateUI();
    Utils.notify(`✓ Added tags to all products`, 'success');

    document.getElementById('bulkAddTags').value = '';
  },

  /**
   * Assign categories to ALL products (uses Bulk Edit section tree)
   */
  assignCategories() {
    const checkboxes = document.querySelectorAll('#bulkCategorySelect .category-checkbox:checked');
    const categoryIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

    if (categoryIds.length === 0) {
      Utils.notify('Please select categories to assign', 'warning');
      return;
    }

    ProductManager.products.forEach(product => {
      if (!product.selectedCategories) product.selectedCategories = [];

      categoryIds.forEach(id => {
        if (!product.selectedCategories.includes(id)) {
          product.selectedCategories.push(id);
        }
      });
    });

    ProductManager.updateUI();
    Utils.notify(`✓ Assigned ${categoryIds.length} categories to all products`, 'success');
  },

  /**
   * Delete selected products
   */
  deleteSelected() {
    if (ProductManager.selectedIndices.length === 0) {
      Utils.notify('No products selected', 'warning');
      return;
    }

    if (!confirm(`Delete ${ProductManager.selectedIndices.length} selected products?`)) {
      return;
    }

    ProductManager.deleteProducts(ProductManager.selectedIndices);
    Utils.notify(`✓ Deleted ${ProductManager.selectedIndices.length} products`, 'success');
  },

  /**
   * Assign categories to SELECTED products (Implemented)
   * Opens a modal with category tree and Merge/Replace options.
   */
  assignCategoriesToSelected() {
    if (ProductManager.selectedIndices.length === 0) {
      Utils.notify('Select some products first', 'warning');
      return;
    }

    if (!CategoryManager.categories || CategoryManager.categories.length === 0) {
      Utils.notify('No categories loaded. Click "Sync Categories from Store" first.', 'warning', 4000);
      return;
    }

    this.openCategoryAssignModal(true);
  },

  /**
   * Internal: show modal to assign categories (selectedOnly=true applies to selected products)
   */
  openCategoryAssignModal(selectedOnly = true) {
    const modal = document.getElementById('modalContainer');
    const modalBg = document.getElementById('modalBg');
    const targetCount = selectedOnly ? ProductManager.selectedIndices.length : ProductManager.products.length;

    const treeHtml = CategoryManager.renderCategoryTree([]);

    modal.innerHTML = `
    <div class="modal-card" id="assignCategoriesModal">
    <div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl font-bold text-indigo-700">
    <i class="fas fa-folder"></i> Assign Categories to ${selectedOnly ? 'Selected' : 'All'} Products
    </h2>
    <button onclick="closeModal()" class="text-3xl text-zinc-400 hover:text-zinc-600">
    <i class="fas fa-times"></i>
    </button>
    </div>

    <div class="space-y-4">
    <div class="p-3 rounded-lg border-2 border-zinc-200">
    <label class="font-semibold block mb-2">Mode</label>
    <label class="inline-flex items-center gap-2 mr-6">
    <input type="radio" name="assignMode" id="assignModeMerge" class="w-4 h-4" checked style="accent-color:#6366f1;">
    <span>Merge with existing</span>
    </label>
    <label class="inline-flex items-center gap-2">
    <input type="radio" name="assignMode" id="assignModeReplace" class="w-4 h-4" style="accent-color:#6366f1;">
    <span>Replace existing</span>
    </label>
    </div>

    <div>
    <label class="block font-semibold mb-2">Choose Categories</label>
    <div id="assignCategoryTree" class="max-h-72 overflow-y-auto p-3 border-2 border-zinc-200 rounded-lg">
    ${treeHtml}
    </div>
    </div>

    <div class="text-sm text-zinc-500">
    Target: <strong>${targetCount}</strong> product${targetCount === 1 ? '' : 's'}
    </div>
    </div>

    <div class="flex gap-3 justify-end mt-6 pt-6 border-t">
    <button onclick="closeModal()" class="btn btn-gray">
    <i class="fas fa-times"></i> Cancel
    </button>
    <button onclick="BulkEdit.applyCategoryAssign(${selectedOnly})" class="btn btn-indigo">
    <i class="fas fa-check"></i> Apply
    </button>
    </div>
    </div>
    `;

    modal.classList.remove('hidden');
    modalBg.classList.remove('hidden');
  },

  /**
   * Internal: apply selected categories to selected or all products
   */
  applyCategoryAssign(selectedOnly = true) {
    const checkboxes = document.querySelectorAll('#assignCategoryTree .category-checkbox:checked');
    const categoryIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
    if (categoryIds.length === 0) {
      Utils.notify('Please select at least one category', 'warning');
      return;
    }

    const replace = document.getElementById('assignModeReplace')?.checked === true;
    const targets = selectedOnly
    ? ProductManager.selectedIndices.map(i => ProductManager.products[i]).filter(Boolean)
    : ProductManager.products;

    let updated = 0;
    targets.forEach(product => {
      if (!product.selectedCategories) product.selectedCategories = [];

      if (replace) {
        product.selectedCategories = [...categoryIds];
      } else {
        // Merge unique
        const set = new Set(product.selectedCategories);
        categoryIds.forEach(id => set.add(id));
        product.selectedCategories = Array.from(set);
      }
      updated++;
    });

    ProductManager.updateUI();
    closeModal();
    Utils.notify(`✓ Assigned ${categoryIds.length} categor${categoryIds.length === 1 ? 'y' : 'ies'} to ${updated} product${updated === 1 ? '' : 's'} (${replace ? 'replaced' : 'merged'})`, 'success');
  }
};

window.BulkEdit = BulkEdit;

console.log('✅ BulkEdit loaded (categories for selected implemented)');
