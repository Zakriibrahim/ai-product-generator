/**
 * Category Tree Sidebar
 * Shows categories with product counts 🌳
 */
const CategoryTree = {
  categories: {},

  init() {
    this.injectSidebar();
    this.bindEvents();
  },

  injectSidebar() {
    // Check if sidebar already exists
    if (document.getElementById('categoryTreeSidebar')) return;

    const sidebar = document.createElement('div');
    sidebar.id = 'categoryTreeSidebar';
    sidebar.className = 'category-tree-sidebar';
    sidebar.innerHTML = `
      <div class="category-tree-header">
        <h3><i class="fas fa-folder-tree"></i> Categories</h3>
        <button onclick="CategoryTree.toggle()" class="category-tree-toggle">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="category-tree-search">
        <input 
          type="text" 
          id="categoryTreeSearch" 
          placeholder="Search categories..." 
          class="category-tree-search-input"
        >
      </div>
      <div id="categoryTreeContent" class="category-tree-content">
        <div class="text-center py-8 text-zinc-500">
          <i class="fas fa-spinner fa-spin text-3xl mb-2"></i>
          <p>Loading categories...</p>
        </div>
      </div>
      <div class="category-tree-footer">
        <button onclick="CategoryTree.toggle()" class="btn btn-sm btn-gray w-full">
          <i class="fas fa-angle-left"></i> Close
        </button>
      </div>
    `;

    document.body.appendChild(sidebar);

    // Add toggle button to header
    const header = document.querySelector('.sticky-header');
    if (header && !document.getElementById('categoryTreeBtn')) {
      const btn = document.createElement('button');
      btn.id = 'categoryTreeBtn';
      btn.className = 'btn btn-indigo';
      btn.innerHTML = '<i class="fas fa-folder-tree"></i> Categories';
      btn.onclick = () => this.toggle();
      
      const buttonContainer = header.querySelector('.flex.gap-3');
      if (buttonContainer) {
        buttonContainer.insertBefore(btn, buttonContainer.firstChild);
      }
    }

    // Add styles
    this.injectStyles();
  },

  injectStyles() {
    if (document.getElementById('categoryTreeStyles')) return;

    const style = document.createElement('style');
    style.id = 'categoryTreeStyles';
    style.textContent = `
      .category-tree-sidebar {
        position: fixed;
        top: 0;
        right: -400px;
        width: 400px;
        height: 100vh;
        background: white;
        box-shadow: -4px 0 20px rgba(0,0,0,0.15);
        z-index: 9999;
        transition: right 0.3s ease;
        display: flex;
        flex-direction: column;
      }
      
      .category-tree-sidebar.open {
        right: 0;
      }
      
      .category-tree-header {
        padding: 1.5rem;
        border-bottom: 2px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
      }
      
      .category-tree-header h3 {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0;
      }
      
      .category-tree-toggle {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .category-tree-toggle:hover {
        background: rgba(255,255,255,0.3);
      }
      
      .category-tree-search {
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .category-tree-search-input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 0.875rem;
      }
      
      .category-tree-search-input:focus {
        outline: none;
        border-color: #6366f1;
      }
      
      .category-tree-content {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
      }
      
      .category-tree-item {
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        border: 2px solid #e5e7eb;
      }
      
      .category-tree-item:hover {
        background: #f3f4f6;
        border-color: #6366f1;
      }
      
      .category-tree-item-name {
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.25rem;
      }
      
      .category-tree-item-count {
        font-size: 0.75rem;
        color: #6b7280;
      }
      
      .category-tree-item-count .badge {
        display: inline-block;
        background: #6366f1;
        color: white;
        padding: 0.125rem 0.5rem;
        border-radius: 12px;
        font-weight: 600;
      }
      
      .category-tree-footer {
        padding: 1rem;
        border-top: 2px solid #e5e7eb;
      }
    `;
    document.head.appendChild(style);
  },

  bindEvents() {
    // Search functionality
    setTimeout(() => {
      const searchInput = document.getElementById('categoryTreeSearch');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.filterCategories(e.target.value);
        });
      }
    }, 100);
  },

  toggle() {
    const sidebar = document.getElementById('categoryTreeSidebar');
    if (sidebar) {
      sidebar.classList.toggle('open');
    }
  },

  updateFromProducts(products) {
    // Count products per category
    this.categories = {};
    
    products.forEach(product => {
      (product.categories || []).forEach(cat => {
        if (!this.categories[cat]) {
          this.categories[cat] = {
            name: cat,
            count: 0,
            products: []
          };
        }
        this.categories[cat].count++;
        this.categories[cat].products.push(product);
      });
    });

    // Add "All Products" category
    this.categories['_all'] = {
      name: 'All Products',
      count: products.length,
      products: products
    };

    this.render();
  },

  render(filter = '') {
    const content = document.getElementById('categoryTreeContent');
    if (!content) return;

    const categories = Object.values(this.categories)
      .filter(cat => {
        if (!filter) return true;
        return cat.name.toLowerCase().includes(filter.toLowerCase());
      })
      .sort((a, b) => {
        // "All Products" always first
        if (a.name === 'All Products') return -1;
        if (b.name === 'All Products') return 1;
        // Then by count
        return b.count - a.count;
      });

    if (categories.length === 0) {
      content.innerHTML = `
        <div class="text-center py-8 text-zinc-500">
          <i class="fas fa-search text-3xl mb-2"></i>
          <p>No categories found</p>
        </div>
      `;
      return;
    }

    content.innerHTML = categories.map(cat => `
      <div class="category-tree-item" onclick="CategoryTree.filterProducts('${cat.name}')">
        <div class="category-tree-item-name">
          <i class="fas fa-${cat.name === 'All Products' ? 'box' : 'folder'}"></i>
          ${Utils.escapeHtml(cat.name)}
        </div>
        <div class="category-tree-item-count">
          <span class="badge">${cat.count}</span> products
        </div>
      </div>
    `).join('');
  },

  filterCategories(search) {
    this.render(search);
  },

  filterProducts(categoryName) {
    const category = this.categories[categoryName] || this.categories['_all'];
    
    if (!category) {
      Utils.notify('Category not found', 'warning');
      return;
    }

    // Filter fetched products
    if (categoryName === 'All Products') {
      // Show all
      FetchedManager.updateUI();
    } else {
      // Show only this category
      const filtered = FetchedManager.fetchedProducts.filter(p => 
        (p.categories || []).includes(categoryName)
      );
      
      // Temporarily replace products
      const original = FetchedManager.fetchedProducts;
      FetchedManager.fetchedProducts = filtered;
      FetchedManager.updateUI();
      
      // Restore after 10 seconds or add a "Show All" button
      setTimeout(() => {
        FetchedManager.fetchedProducts = original;
      }, 10000);
    }

    this.toggle();
    
    // Switch to fetched tab
    if (window.TabManager) {
      TabManager.switchTab('fetched');
    }

    Utils.notify(`📂 Showing ${category.count} products from "${categoryName}"`, 'success', 3000);
  }
};

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
  CategoryTree.init();
});

window.CategoryTree = CategoryTree;
console.log('✅ CategoryTree sidebar loaded!');
