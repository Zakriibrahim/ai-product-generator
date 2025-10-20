class CategoryModal {
  constructor() {
    this.categories = [];
    this.selectedCategories = [];
    this.currentProducts = [];
  }

  async loadCategories() {
    try {
      const auth = btoa(`${CONFIG.WOOCOMMERCE.CONSUMER_KEY}:${CONFIG.WOOCOMMERCE.CONSUMER_SECRET}`);
      const response = await fetch(
        `${CONFIG.WOOCOMMERCE.URL}/wp-json/wc/v3/products/categories?per_page=100`,
        {
          headers: {
            'Authorization': `Basic ${auth}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to load categories');

      this.categories = await response.json();
      return this.categories;
    } catch (error) {
      console.error('Error loading categories:', error);
      return [];
    }
  }

  async show(products) {
    this.currentProducts = products;
    this.selectedCategories = [];

    await this.loadCategories();
    this.render();

    document.getElementById('categoryModal').style.display = 'flex';
  }

  render() {
    const categoryTree = this.buildCategoryTree();
    const treeHTML = this.renderCategoryTree(categoryTree);

    document.getElementById('categoryTree').innerHTML = treeHTML;
  }

  buildCategoryTree() {
    const categoryMap = {};
    const tree = [];

    // Create map
    this.categories.forEach(cat => {
      categoryMap[cat.id] = { ...cat, children: [] };
    });

    // Build tree
    this.categories.forEach(cat => {
      if (cat.parent === 0) {
        tree.push(categoryMap[cat.id]);
      } else if (categoryMap[cat.parent]) {
        categoryMap[cat.parent].children.push(categoryMap[cat.id]);
      }
    });

    return tree;
  }

  renderCategoryTree(categories, level = 0) {
    return categories.map(cat => {
      const hasChildren = cat.children && cat.children.length > 0;
      const isSelected = this.selectedCategories.includes(cat.id);
      
      return `
        <div class="category-tree-item ${isSelected ? 'selected' : ''}" 
             style="margin-left: ${level * 1.5}rem"
             onclick="window.categoryModal.toggleCategory(${cat.id})">
          ${hasChildren ? '<i class="fas fa-folder"></i>' : '<i class="fas fa-tag"></i>'}
          <span>${cat.name}</span>
          <span class="text-xs text-zinc-400">(ID: ${cat.id})</span>
        </div>
        ${hasChildren ? this.renderCategoryTree(cat.children, level + 1) : ''}
      `;
    }).join('');
  }

  toggleCategory(categoryId) {
    const index = this.selectedCategories.indexOf(categoryId);
    if (index > -1) {
      this.selectedCategories.splice(index, 1);
    } else {
      this.selectedCategories.push(categoryId);
    }
    this.render();
  }

  apply() {
    if (this.selectedCategories.length === 0) {
      alert('Please select at least one category');
      return;
    }

    // Apply categories to products
    this.currentProducts.forEach(product => {
      product.categories = this.selectedCategories.map(id => ({ id }));
    });

    alert(`✅ Categories assigned to ${this.currentProducts.length} product(s)`);
    this.close();
  }

  close() {
    document.getElementById('categoryModal').style.display = 'none';
    this.selectedCategories = [];
    this.currentProducts = [];
  }
}

window.categoryModal = new CategoryModal();
