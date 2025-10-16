/**
 * Version Manager
 * Tracks app version and updates
 */

const VersionManager = {
  version: '2.1.0',
  lastUpdated: '2025-10-16 18:23:58 UTC',
  changelog: [
    {
      version: '2.1.0',
      date: '2025-10-16',
      features: [
        'Fetch products from WooCommerce',
        'Regenerate product data with AI',
        'AI image background removal',
        'Image enhancement tools',
        'Product search & filter'
      ]
    },
    {
      version: '2.0.0',
      date: '2025-10-16',
      features: [
        'Full product edit modal',
        'Expandable descriptions',
        'Enhanced AI Assistant'
      ]
    },
    {
      version: '1.0.0',
      date: '2025-10-16',
      features: [
        'Initial release',
        'AI product generation',
        'WooCommerce integration'
      ]
    }
  ],
  
  getVersionString() {
    return `v${this.version}`;
  },
  
  getFullVersionString() {
    return `v${this.version} - Updated ${this.lastUpdated}`;
  },
  
  displayVersion() {
    const versionEl = document.getElementById('appVersion');
    if (versionEl) {
      versionEl.innerHTML = `
        <div class="version-badge" onclick="VersionManager.showChangelog()" title="Click to view changelog">
          <i class="fas fa-code-branch"></i> ${this.getVersionString()}
          <span class="version-pulse"></span>
        </div>
      `;
    }
  },
  
  showChangelog() {
    const modal = document.getElementById('modalContainer');
    const modalBg = document.getElementById('modalBg');
    
    const changelogHtml = this.changelog.map(entry => `
      <div class="changelog-entry">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-2xl font-bold text-indigo-600">v${entry.version}</span>
          <span class="text-sm text-zinc-500">${entry.date}</span>
        </div>
        <ul class="space-y-2">
          ${entry.features.map(f => `
            <li class="flex items-start gap-2">
              <i class="fas fa-check-circle text-green-500 mt-1"></i>
              <span>${f}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `).join('');
    
    modal.innerHTML = `
      <div class="modal-card">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-indigo-700">
            <i class="fas fa-history"></i> Version History
          </h2>
          <button onclick="closeModal()" class="text-3xl text-zinc-400 hover:text-zinc-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="space-y-6">
          ${changelogHtml}
        </div>
        
        <div class="mt-6 pt-6 border-t text-center text-sm text-zinc-500">
          Created by <strong>Zakriibrahim</strong> • 
          Current: <strong class="text-indigo-600">${this.getFullVersionString()}</strong>
        </div>
      </div>
    `;
    
    modal.classList.remove('hidden');
    modalBg.classList.remove('hidden');
  }
};

window.VersionManager = VersionManager;

console.log('✅ VersionManager loaded -', VersionManager.getFullVersionString());
