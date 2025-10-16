/**
 * Quality Check
 * Validates products before upload
 */

const QualityCheck = {
  /**
   * Run quality check on all products
   */
  run(products = ProductManager.products) {
    if (products.length === 0) {
      Utils.notify('No products to check', 'warning');
      return;
    }
    
    const results = {
      total: products.length,
      passed: 0,
      failed: 0,
      warnings: 0,
      issues: []
    };
    
    products.forEach((product, index) => {
      const productIssues = this.validateProduct(product, index);
      
      if (productIssues.length === 0) {
        results.passed++;
      } else {
        const hasErrors = productIssues.some(i => i.severity === 'error');
        if (hasErrors) {
          results.failed++;
        } else {
          results.warnings++;
        }
        results.issues.push(...productIssues);
      }
    });
    
    this.displayResults(results);
    
    if (results.failed === 0 && results.warnings === 0) {
      Utils.notify('✓ All products passed quality check!', 'success');
    } else if (results.failed > 0) {
      Utils.notify(`⚠ ${results.failed} products failed quality check`, 'error');
    } else {
      Utils.notify(`⚠ ${results.warnings} products have warnings`, 'warning');
    }
    
    return results;
  },
  
  /**
   * Validate single product
   */
  validateProduct(product, index) {
    const issues = [];
    const cfg = CONFIG.QUALITY;
    
    // Title validation
    if (!product.title || product.title.trim().length < cfg.MIN_TITLE_LENGTH) {
      issues.push({
        product: index + 1,
        field: 'Title',
        message: `Title is too short (minimum ${cfg.MIN_TITLE_LENGTH} characters)`,
        severity: 'error'
      });
    }
    
    if (product.title && product.title.length > cfg.MAX_TITLE_LENGTH) {
      issues.push({
        product: index + 1,
        field: 'Title',
        message: `Title is too long (maximum ${cfg.MAX_TITLE_LENGTH} characters)`,
        severity: 'warning'
      });
    }
    
    // Description validation
    if (!product.description || product.description.trim().length < cfg.MIN_DESCRIPTION_LENGTH) {
      issues.push({
        product: index + 1,
        field: 'Description',
        message: `Description is too short (minimum ${cfg.MIN_DESCRIPTION_LENGTH} characters)`,
        severity: 'error'
      });
    }
    
    // Price validation
    const price = parseFloat(product.price);
    if (isNaN(price) || price < cfg.MIN_PRICE) {
      issues.push({
        product: index + 1,
        field: 'Price',
        message: `Price is invalid or too low (minimum ${cfg.MIN_PRICE} MAD)`,
        severity: 'error'
      });
    }
    
    if (price > cfg.MAX_PRICE) {
      issues.push({
        product: index + 1,
        field: 'Price',
        message: `Price seems unusually high (${price} MAD)`,
        severity: 'warning'
      });
    }
    
    // Images validation
    if (cfg.REQUIRE_IMAGES && (!product.galleryImageUrls || product.galleryImageUrls.length === 0)) {
      issues.push({
        product: index + 1,
        field: 'Images',
        message: 'No images found',
        severity: 'error'
      });
    }
    
    // Categories validation
    if (cfg.REQUIRE_CATEGORIES && (!product.selectedCategories || product.selectedCategories.length === 0)) {
      issues.push({
        product: index + 1,
        field: 'Categories',
        message: 'No categories assigned',
        severity: 'error'
      });
    }
    
    // SKU validation
    if (!product.sku || product.sku.trim().length === 0) {
      issues.push({
        product: index + 1,
        field: 'SKU',
        message: 'Missing SKU',
        severity: 'warning'
      });
    }
    
    // Variations validation
    if (product.variations && product.variations.length > 0) {
      product.variations.forEach((variation, vIndex) => {
        if (!variation.price || parseFloat(variation.price) <= 0) {
          issues.push({
            product: index + 1,
            field: 'Variations',
            message: `Variation ${vIndex + 1} has invalid price`,
            severity: 'warning'
          });
        }
      });
    }
    
    return issues;
  },
  
  /**
   * Display results in UI
   */
  displayResults(results) {
    const container = document.getElementById('qualityResults');
    const issuesContainer = document.getElementById('qualityIssues');
    const issuesList = document.getElementById('qualityIssuesList');
    
    // Summary cards
    container.innerHTML = `
      <div class="quality-card pass">
        <i class="fas fa-check-circle text-5xl text-green-600 mb-3"></i>
        <h3 class="text-green-600">${results.passed}</h3>
        <p>Passed</p>
      </div>
      
      <div class="quality-card ${results.failed > 0 ? 'fail' : ''}">
        <i class="fas fa-times-circle text-5xl ${results.failed > 0 ? 'text-red-600' : 'text-zinc-300'} mb-3"></i>
        <h3 class="${results.failed > 0 ? 'text-red-600' : 'text-zinc-400'}">${results.failed}</h3>
        <p>Failed</p>
      </div>
      
      <div class="quality-card ${results.warnings > 0 ? '' : ''}">
        <i class="fas fa-exclamation-triangle text-5xl ${results.warnings > 0 ? 'text-yellow-600' : 'text-zinc-300'} mb-3"></i>
        <h3 class="${results.warnings > 0 ? 'text-yellow-600' : 'text-zinc-400'}">${results.warnings}</h3>
        <p>Warnings</p>
      </div>
      
      <div class="quality-card">
        <i class="fas fa-box text-5xl text-indigo-600 mb-3"></i>
        <h3 class="text-indigo-600">${results.total}</h3>
        <p>Total Products</p>
      </div>
    `;
    
    // Issues list
    if (results.issues.length > 0) {
      issuesContainer.classList.remove('hidden');
      
      const grouped = {};
      results.issues.forEach(issue => {
        const key = `Product ${issue.product}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(issue);
      });
      
      issuesList.innerHTML = Object.entries(grouped).map(([product, issues]) => `
        <div class="bg-white border-l-4 ${issues.some(i => i.severity === 'error') ? 'border-red-500' : 'border-yellow-500'} rounded p-4 shadow-sm">
          <h4 class="font-bold text-lg mb-2">${product}</h4>
          <ul class="space-y-1">
            ${issues.map(issue => `
              <li class="flex items-start gap-2 text-sm">
                <i class="fas fa-${issue.severity === 'error' ? 'times-circle text-red-600' : 'exclamation-triangle text-yellow-600'} mt-0.5"></i>
                <span><strong>${issue.field}:</strong> ${issue.message}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('');
    } else {
      issuesContainer.classList.add('hidden');
    }
  }
};

window.QualityCheck = QualityCheck;

console.log('✅ QualityCheck loaded');
