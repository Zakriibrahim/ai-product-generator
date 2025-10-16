/**
 * AI Assistant
 * Interactive chatbot helper
 */

const AIAssistant = {
  messages: [],
  isOpen: false,
  
  /**
   * Initialize assistant
   */
  init() {
    const toggle = document.getElementById('assistantToggle');
    const panel = document.getElementById('assistantPanel');
    
    toggle.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        panel.classList.remove('hidden');
        if (this.messages.length === 0) {
          this.addMessage('bot', '👋 Hi! I\'m your AI assistant. I can help you with:\n\n• Uploading products\n• Quality checks\n• Bulk editing\n• Templates\n• Categories\n\nWhat would you like to do?');
        }
      } else {
        panel.classList.add('hidden');
      }
    });
    
    // Handle Enter key
    const input = document.getElementById('assistantInput');
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.send();
      }
    });
  },
  
  /**
   * Add message to chat
   */
  addMessage(type, text) {
    this.messages.push({ type, text, timestamp: new Date() });
    
    const container = document.getElementById('assistantMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `assistant-message ${type} fade-in`;
    messageDiv.innerHTML = `
      <div class="message-bubble">${this.formatMessage(text)}</div>
    `;
    container.appendChild(messageDiv);
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  },
  
  /**
   * Format message with markdown-like syntax
   */
  formatMessage(text) {
    return Utils.escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  },
  
  /**
   * Send user message
   */
  send() {
    const input = document.getElementById('assistantInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    this.addMessage('user', message);
    input.value = '';
    
    // Process message
    setTimeout(() => {
      const response = this.processMessage(message);
      this.addMessage('bot', response);
    }, 500);
  },
  
  /**
   * Process user message and generate response
   */
  processMessage(message) {
    const lower = message.toLowerCase();
    
    // Help
    if (lower.includes('help') || lower.includes('what can you do')) {
      return `I can assist you with:

**📤 Product Upload**
- "How do I upload products?"
- "Upload my products to WooCommerce"

**✅ Quality Check**
- "Run quality check"
- "Check my products"

**✏️ Bulk Edit**
- "Change all prices"
- "Add tags to all products"

**📋 Templates**
- "Show me templates"
- "Apply T-shirt template"

**🏷️ Categories**
- "Sync categories"
- "How do categories work?"

Just ask me anything!`;
    }
    
    // Upload
    if (lower.includes('upload') || lower.includes('woocommerce')) {
      if (ProductManager.products.length === 0) {
        return `You don't have any products yet! Here's how to get started:

1. Go to the **Upload** tab
2. Click "Add Single Product Batch" or "Add Multi-Image Product"
3. Upload your images
4. Add optional notes for AI
5. Click "Generate Products with AI"
6. Review and edit products
7. Click "Upload to WooCommerce"

Need help with any step?`;
      }
      
      return `You have **${ProductManager.products.length} products** ready to upload!

To upload:
1. Go to **Products** tab
2. Review your products
3. Click "Upload to WooCommerce" button

Want me to start the upload process?`;
    }
    
    // Quality check
    if (lower.includes('quality') || lower.includes('check')) {
      return `I'll run a quality check on your products!

Go to the **Quality Check** tab and click "Run Quality Check".

I'll verify:
✓ All products have titles
✓ Descriptions are complete
✓ Prices are valid
✓ Images are present
✓ Categories are assigned

This helps ensure successful uploads!`;
    }
    
    // Bulk edit
    if (lower.includes('bulk') || lower.includes('edit') || lower.includes('change all')) {
      return `Bulk editing is powerful! Here's what you can do:

**📝 Find & Replace**
Change text in all titles/descriptions

**💰 Price Adjustment**
Add, subtract, multiply, or set prices

**🏷️ Add Tags**
Apply tags to all products at once

**📁 Change Categories**
Assign categories to all products

Go to the **Bulk Edit** tab to get started!`;
    }
    
    // Templates
    if (lower.includes('template')) {
      return `Product templates save you time!

Templates include:
• Pre-defined attributes (Color, Size, etc.)
• Default variations
• Price modifiers

Go to **Templates** tab to:
- Use existing templates (T-Shirt, Shoes, Electronics)
- Create your own custom templates

Apply a template before generating products!`;
    }
    
    // Categories
    if (lower.includes('categor')) {
      return `Categories help organize your store!

**Auto-Selection:**
The AI automatically selects matching categories based on product content.

**Manual Selection:**
You can also manually assign categories to products.

**Sync Categories:**
Click "Sync Categories from Store" to fetch your WooCommerce categories.

Categories are shown in the Products tab!`;
    }
    
    // Stats
    if (lower.includes('stats') || lower.includes('how many') || lower.includes('status')) {
      const withCategories = ProductManager.products.filter(p => p.selectedCategories && p.selectedCategories.length > 0).length;
      const variable = ProductManager.products.filter(p => p.variations && p.variations.length > 0).length;
      
      return `📊 **Your Statistics**

Total Products: **${ProductManager.products.length}**
With Categories: **${withCategories}**
Variable Products: **${variable}**
Simple Products: **${ProductManager.products.length - variable}**
Selected: **${ProductManager.selectedIndices.length}**

${ProductManager.products.length === 0 ? '\n💡 Upload some images to get started!' : ''}`;
    }
    
    // Default response
    return `I'm not sure about that, but I can help with:

• **upload** - Upload products to WooCommerce
• **quality** - Run quality checks
• **bulk edit** - Edit multiple products
• **templates** - Use product templates
• **categories** - Manage categories
• **stats** - View your statistics
• **help** - Show all commands

What would you like to know?`;
  },
  
  /**
   * Close assistant
   */
  close() {
    this.isOpen = false;
    document.getElementById('assistantPanel').classList.add('hidden');
  }
};

window.AIAssistant = AIAssistant;

console.log('✅ AIAssistant loaded');
