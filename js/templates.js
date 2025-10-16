/**
 * Templates
 * Product template management
 */

const Templates = {
  templates: [],
  
  /**
   * Initialize templates
   */
  init() {
    this.templates = CONFIG.DEFAULT_TEMPLATES;
    this.render();
  },
  
  /**
   * Render templates
   */
  render() {
    const container = document.getElementById('templatesContainer');
    
    if (this.templates.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fas fa-layer-group text-6xl text-zinc-300 mb-4"></i>
          <p class="text-zinc-500 text-lg">No templates yet. Create your first template!</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = this.templates.map((template, index) => `
      <div class="template-card" onclick="Templates.apply(${index})">
        <div class="text-5xl mb-4 text-center">${template.icon}</div>
        <h3 class="font-bold text-xl mb-2 text-center">${Utils.escapeHtml(template.name)}</h3>
        <div class="text-sm text-zinc-600 mb-4">
          ${template.attributes.map(attr => `
            <div class="flex items-center gap-2 mb-1">
              <i class="fas fa-tag text-indigo-500"></i>
              <span><strong>${attr.name}:</strong> ${attr.options.join(', ')}</span>
            </div>
          `).join('')}
        </div>
        <div class="flex gap-2 justify-center">
          <button onclick="event.stopPropagation(); Templates.apply(${index})" 
                  class="btn btn-indigo btn-sm">
            <i class="fas fa-check"></i> Apply
          </button>
          ${index >= CONFIG.DEFAULT_TEMPLATES.length ? `
            <button onclick="event.stopPropagation(); Templates.delete(${index})" 
                    class="btn btn-pink btn-sm">
              <i class="fas fa-trash"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');
  },
  
  /**
   * Apply template to new products
   */
  apply(index) {
    const template = this.templates[index];
    if (!template) return;
    
    // Store in session for next generation
    sessionStorage.setItem('activeTemplate', JSON.stringify(template));
    
    Utils.notify(`✓ Template "${template.name}" will be applied to next generated products`, 'success');
    
    // Switch to upload tab
    window.switchTab('upload');
  },
  
  /**
   * Create new template
   */
  create() {
    const name = prompt('Template name:');
    if (!name) return;
    
    const icon = prompt('Emoji icon:', '📦');
    
    const template = {
      id: Utils.generateId(),
      name,
      icon: icon || '📦',
      attributes: [],
      priceModifier: {}
    };
    
    // Simple attribute creation
    const addMoreAttrs = confirm('Add attributes? (Color, Size, etc.)');
    if (addMoreAttrs) {
      while (true) {
        const attrName = prompt('Attribute name (or cancel to finish):');
        if (!attrName) break;
        
        const optionsStr = prompt(`Options for ${attrName} (comma separated):`);
        if (!optionsStr) break;
        
        const options = optionsStr.split(',').map(s => s.trim()).filter(Boolean);
        
        template.attributes.push({
          name: attrName,
          options,
          visible: true,
          variation: true
        });
      }
    }
    
    this.templates.push(template);
    this.render();
    this.save();
    
    Utils.notify(`✓ Template "${name}" created!`, 'success');
  },
  
  /**
   * Delete template
   */
  delete(index) {
    if (!confirm('Delete this template?')) return;
    
    this.templates.splice(index, 1);
    this.render();
    this.save();
    
    Utils.notify('✓ Template deleted', 'success');
  },
  
  /**
   * Save templates to localStorage
   */
  save() {
    const custom = this.templates.slice(CONFIG.DEFAULT_TEMPLATES.length);
    localStorage.setItem('customTemplates', JSON.stringify(custom));
  },
  
  /**
   * Load templates from localStorage
   */
  load() {
    try {
      const custom = JSON.parse(localStorage.getItem('customTemplates') || '[]');
      this.templates = [...CONFIG.DEFAULT_TEMPLATES, ...custom];
    } catch (e) {
      console.error('Failed to load templates:', e);
      this.templates = CONFIG.DEFAULT_TEMPLATES;
    }
  }
};

window.Templates = Templates;

console.log('✅ Templates loaded');
