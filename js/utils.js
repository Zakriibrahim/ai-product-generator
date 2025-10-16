/**
 * Utility Functions
 * Helper functions used throughout the app
 */

const Utils = {
  /**
   * Deep clone an object
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj || {}));
  },
  
  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(str) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return String(str || '').replace(/[&<>"']/g, m => map[m]);
  },
  
  /**
   * Format date to UTC string
   */
  formatDate(date = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    const y = date.getUTCFullYear();
    const m = pad(date.getUTCMonth() + 1);
    const d = pad(date.getUTCDate());
    const h = pad(date.getUTCHours());
    const min = pad(date.getUTCMinutes());
    const s = pad(date.getUTCSeconds());
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
  },
  
  /**
   * Update clock display
   */
  updateClock() {
    const elem = document.getElementById('currentDateTime');
    if (elem) {
      elem.textContent = this.formatDate();
    }
  },
  
  /**
   * Parse JSON safely from AI response
   */
  parseJSON(text, defaultValue = null) {
    try {
      // Try to find JSON in text
      const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (match) {
        const cleaned = match[0].replace(/,(\s*[}\]])/g, '$1').trim();
        return JSON.parse(cleaned);
      }
      return defaultValue;
    } catch (e) {
      console.error('JSON parse error:', e, 'Text:', text);
      return defaultValue;
    }
  },
  
  /**
   * Show toast notification
   */
  notify(message, type = 'info', duration = 3000) {
    const colors = {
      success: '#22c55e',
      error: '#ef4444',
      info: '#6366f1',
      warning: '#f59e0b'
    };
    
    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25);
      z-index: 99999;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: slideInRight 0.3s ease-out;
      max-width: 400px;
    `;
    notification.innerHTML = `<span style="font-size:1.2rem;">${icons[type]}</span> ${this.escapeHtml(message)}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100px)';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  },
  
  /**
   * Download file
   */
  downloadFile(content, filename, type = 'application/json') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
  
  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },
  
  /**
   * Debounce function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  /**
   * Format price
   */
  formatPrice(price) {
    const num = parseFloat(price) || 0;
    return num.toFixed(2) + ' MAD';
  },
  
  /**
   * Truncate text
   */
  truncate(text, length = 100) {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substr(0, length) + '...';
  }
};

// Make utils globally available
window.Utils = Utils;

// Update clock every second
setInterval(() => Utils.updateClock(), 1000);

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;
document.head.appendChild(style);

console.log('✅ Utils loaded');
