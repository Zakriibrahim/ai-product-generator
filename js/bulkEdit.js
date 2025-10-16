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
   * Assign categories
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
   * Assign categories to selected products
   */
  assignCategoriesToSelected() {
    if (ProductManager.selectedIndices.length === 0) {
      Utils.notify('No products selected', 'warning');
      return;
    }
    
    // Show category selection modal
    Utils.notify('Category assignment for selected products coming soon!', 'info');
  }
};

window.BulkEdit = BulkEdit;

console.log('✅ BulkEdit loaded');
