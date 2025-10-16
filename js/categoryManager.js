/**
 * Category Manager
 * Handles WooCommerce categories and auto-selection
 */

const CategoryManager = {
  categories: [],
  
  /**
   * Fetch categories from WooCommerce
   */
  async fetchCategories() {
    try {
      Utils.notify('Syncing categories from store...', 'info');
      
      const url = `${CONFIG.WOO_URL}/wp-json/wc/v3/products/categories?per_page=100&consumer_key=${encodeURIComponent(CONFIG.WOO_CONSUMER_KEY)}&consumer_secret=${encodeURIComponent(CONFIG.WOO_CONSUMER_SECRET)}`;
      
      const response = await this.proxiedFetch(url);
      const categories = await response.json();
      
      if (!Array.isArray(categories)) {
        throw new Error('Invalid categories response');
      }
      
      this.categories = categories.map(c => ({
        id: c.id,
        name: c.name,
        parent: c.parent || 0,
        count: c.count || 0
      }));
      
      Utils.notify(`✓ Synced ${this.categories.length} categories`, 'success');
      
      // Update UI
      this.renderCategorySelectors();
      
      return this.categories;
    } catch (error) {
      Utils.notify('Failed to sync categories: ' + error.message, 'error');
      return [];
    }
  },
  
  /**
   * Proxied fetch to handle CORS
   */
  async proxiedFetch(url) {
    let lastError;
    
    for (const proxy of CONFIG.PROXIES) {
      const finalUrl = proxy ? (proxy.endsWith('?') ? proxy + encodeURIComponent(url) : proxy + url) : url;
      
      try {
        const response = await fetch(finalUrl);
        if (response.ok) return response;
        
        let body = '';
        try { body = await response.text(); } catch {}
        
        if (body.toLowerCase().includes('request temporary access')) {
          continue;
        }
        
        lastError = new Error(`HTTP ${response.status}: ${body || response.statusText}`);
      } catch (e) {
        lastError = e;
      }
    }
    
    throw lastError || new Error('All proxies failed');
  },
  
  /**
   * Auto-select categories based on AI suggestions
   */
  autoSelectCategories(aiCategories, arabicCategory = '') {
    const selected = [];
    const searchTerms = [
      ...aiCategories.map(c => c.toLowerCase()),
      arabicCategory ? arabicCategory.toLowerCase() : ''
    ].filter(Boolean);
    
    this.categories.forEach(cat => {
      const catName = cat.name.toLowerCase();
      
      for (const term of searchTerms) {
        // Fuzzy matching
        if (catName.includes(term) || term.includes(catName) || 
            this.similarityScore(catName, term) > 0.7) {
          if (!selected.includes(cat.id)) {
            selected.push(cat.id);
          }
          break;
        }
      }
    });
    
    return selected;
  },
  
  /**
   * Calculate similarity score between two strings
   */
  similarityScore(s1, s2) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  },
  
  /**
   * Levenshtein distance algorithm
   */
  levenshteinDistance(s1, s2) {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  },
  
  /**
   * Render category selectors in UI
   */
  renderCategorySelectors() {
    // Render in bulk edit section
    const bulkCatSelect = document.getElementById('bulkCategorySelect');
    if (bulkCatSelect) {
      bulkCatSelect.innerHTML = this.renderCategoryTree();
    }
  },
  
  /**
   * Render category tree HTML
   */
  renderCategoryTree(selectedIds = []) {
    const parents = this.categories.filter(c => c.parent === 0);
    let html = '';
    
    const renderCategory = (cat, level = 0) => {
      const indent = level * 20;
      const checked = selectedIds.includes(cat.id) ? 'checked' : '';
      
      html += `
        <div style="margin-left: ${indent}px; margin-bottom: 6px;">
          <label class="flex items-center gap-2 cursor-pointer hover:bg-zinc-50 p-1 rounded">
            <input type="checkbox" value="${cat.id}" ${checked} 
                   class="category-checkbox w-4 h-4" 
                   style="accent-color: #6366f1;">
            <span class="text-sm ${level === 0 ? 'font-semibold' : ''}">${Utils.escapeHtml(cat.name)}</span>
            <span class="text-xs text-zinc-400">(${cat.count})</span>
          </label>
        </div>
      `;
      
      // Render children
      const children = this.categories.filter(c => c.parent === cat.id);
      children.forEach(child => renderCategory(child, level + 1));
    };
    
    parents.forEach(cat => renderCategory(cat));
    
    return html || '<p class="text-sm text-zinc-400">No categories found. Click "Sync Categories" first.</p>';
  },
  
  /**
   * Get category name by ID
   */
  getCategoryName(id) {
    const cat = this.categories.find(c => c.id === id);
    return cat ? cat.name : `ID:${id}`;
  },
  
  /**
   * Create new category
   */
  async createCategory(name, parentId = 0) {
    try {
      const url = `${CONFIG.WOO_URL}/wp-json/wc/v3/products/categories?consumer_key=${encodeURIComponent(CONFIG.WOO_CONSUMER_KEY)}&consumer_secret=${encodeURIComponent(CONFIG.WOO_CONSUMER_SECRET)}`;
      
      const response = await this.proxiedFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parent: parentId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create category');
      }
      
      const newCat = await response.json();
      this.categories.push({
        id: newCat.id,
        name: newCat.name,
        parent: newCat.parent || 0,
        count: 0
      });
      
      Utils.notify(`✓ Created category: ${name}`, 'success');
      this.renderCategorySelectors();
      
      return newCat;
    } catch (error) {
      Utils.notify('Failed to create category: ' + error.message, 'error');
      throw error;
    }
  }
};

window.CategoryManager = CategoryManager;

console.log('✅ CategoryManager loaded');
