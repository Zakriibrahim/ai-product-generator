/**
 * Tab Manager - Handle all tab switching
 */

const TabManager = {
  init() {
    console.log('🔧 Initializing TabManager...');
    
    // Get all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    console.log('Found', tabButtons.length, 'tab buttons');
    console.log('Found', tabContents.length, 'tab contents');
    
    // Remove all old listeners and add new ones
    tabButtons.forEach(btn => {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const tabName = this.getAttribute('data-tab');
        console.log('Tab clicked:', tabName);
        
        if (tabName) {
          TabManager.switchTab(tabName);
        }
      });
    });
    
    console.log('✅ TabManager initialized');
  },
  
  switchTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    
    // Activate clicked tab button
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
      console.log('✓ Activated button:', tabName);
    }
    
    // Show clicked tab content
    const activeContent = document.getElementById(`tab-${tabName}`);
    if (activeContent) {
      activeContent.classList.add('active');
      console.log('✓ Showing content:', tabName);
    }
    
    // Update managers when switching to their tabs
    if (tabName === 'products') {
      ProductManager.updateUI();
    } else if (tabName === 'fetched') {
      FetchedManager.updateUI();
    }
  }
};

// Global function for onclick handlers
window.switchTab = function(tabName) {
  TabManager.switchTab(tabName);
};

window.TabManager = TabManager;

console.log('✅ TabManager module loaded');
