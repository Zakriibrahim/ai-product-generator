/**
 * Utils - Complete with all functions
 */
const Utils = {
  notify(message, type = 'info', duration = 10000) {
    console.log(`[NOTIFY ${type.toUpperCase()}] ${message}`);
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="flex items-center justify-between gap-3">
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="text-xl font-bold">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, duration);
  },

  escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  },

  parseJSON(text, fallback = null) {
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('JSON parse error:', e);
      console.error('Text:', text);
      return fallback;
    }
  },

  downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  updateClock() {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toISOString().slice(0, 19).replace('T', ' ');
      const el = document.getElementById('currentDateTime');
      if (el) el.textContent = formatted;
    };
    
    updateTime();
    setInterval(updateTime, 1000);
  },

  stripHtml(html) {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  },

  truncate(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
};

window.Utils = Utils;
console.log('✅ Utils loaded');
