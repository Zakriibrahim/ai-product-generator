/**
 * Templates
 * Product template management (resilient version)
 * - Works even if CONFIG.DEFAULT_TEMPLATES is missing
 * - Avoids crashes that block the whole app
 */
const Templates = {
  templates: [],

  defaultTemplates() {
    const dt = (window.CONFIG && Array.isArray(window.CONFIG.DEFAULT_TEMPLATES))
      ? window.CONFIG.DEFAULT_TEMPLATES
      : [];
    return dt;
  },

  /**
   * Initialize templates
   */
  init() {
    // Prefer loading merged defaults + custom
    this.load();
    this.render();
  },

  /**
   * Render templates
   */
  render() {
    const container = document.getElementById('templatesContainer');
    if (!container) return;

    const list = Array.isArray(this.templates) ? this.templates : [];

    if (list.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fas fa-layer-group text-6xl text-zinc-300 mb-4"></i>
          <p class="text-zinc-500 text-lg">No templates yet. Create your first template!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map((template, index) => `
      <div class="template-card" onclick="Templates.apply(${index})">
        <div class="text-5xl mb-4 text-center">${template.icon ?? '📦'}</div>
        <h3 class="font-bold text-xl mb-2 text-center">${Utils.escapeHtml(template.name ?? 'Template')}</h3>
        <div class="text-sm text-zinc-600 mb-4">
          ${(template.attributes || []).map(attr => `
            <div class="flex items-center gap-2 mb-1">
              <i class="fas fa-tag text-indigo-500"></i>
              <span><strong>${Utils.escapeHtml(attr.name ?? 'Attribute')}:</strong> ${(attr.options || []).join(', ')}</span>
            </div>
          `).join('')}
        </div>
        <div class="flex gap-2 justify-center">
          <button onclick="event.stopPropagation(); Templates.apply(${index})" class="btn btn-indigo btn-sm">
            <i class="fas fa-check"></i> Apply
          </button>
          ${index >= Templates.defaultTemplates().length ? `
            <button onclick="event.stopPropagation(); Templates.delete(${index})" class="btn btn-pink btn-sm">
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
    const list = Array.isArray(this.templates) ? this.templates : [];
    const template = list[index];
    if (!template) return;

    // Store in session for next generation
    sessionStorage.setItem('activeTemplate', JSON.stringify(template));

    Utils.notify(`✓ Template "${template.name}" will be applied to next generated products`, 'success');

    // Switch to upload tab
    if (window.switchTab) window.switchTab('upload');
  },

  /**
   * Create new template (simple flow)
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

    if (!Array.isArray(this.templates)) this.templates = [];
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
    if (!Array.isArray(this.templates)) this.templates = [];
    this.templates.splice(index, 1);
    this.render();
    this.save();
    Utils.notify('✓ Template deleted', 'success');
  },

  /**
   * Save templates to localStorage (only custom beyond defaults)
   */
  save() {
    const baseLen = this.defaultTemplates().length;
    const list = Array.isArray(this.templates) ? this.templates : [];
    const custom = list.slice(baseLen);
    try {
      localStorage.setItem('customTemplates', JSON.stringify(custom));
    } catch (e) {
      console.warn('Could not save custom templates:', e);
    }
  },

  /**
   * Load templates from localStorage, merged with defaults
   */
  load() {
    const defaults = this.defaultTemplates();
    let custom = [];
    try {
      const raw = localStorage.getItem('customTemplates') || '[]';
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) custom = parsed;
    } catch (e) {
      console.error('Failed to load templates:', e);
    }
    this.templates = [...defaults, ...custom];
  }
};

window.Templates = Templates;
console.log('✅ Templates loaded (resilient)');
