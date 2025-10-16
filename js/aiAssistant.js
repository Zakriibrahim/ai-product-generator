/**
 * AI Assistant - ENHANCED VERSION
 * Smarter chatbot helper with context awareness
 */

const AIAssistant = {
  messages: [],
  isOpen: false,
  
  init() {
    const toggle = document.getElementById('assistantToggle');
    const panel = document.getElementById('assistantPanel');
    
    toggle.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        panel.classList.remove('hidden');
        if (this.messages.length === 0) {
          this.addMessage('bot', `👋 **Hi Zakriibrahim!**

I'm your AI assistant. I can help you with:

📤 **Product Management**
• Upload products to WooCommerce
• Edit product details
• Bulk operations

✅ **Quality Control**
• Run quality checks
• Fix validation errors

🎨 **Features**
• Templates & bulk edit
• Category management
• Export options

💡 **Tips**
• "show stats" - View your numbers
• "help" - See all commands
• "upload" - Start uploading

What would you like to do?`);
        }
      } else {
        panel.classList.add('hidden');
      }
    });
    
    const input = document.getElementById('assistantInput');
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.send();
      }
    });
  },
  
  addMessage(type, text) {
    this.messages.push({ type, text, timestamp: new Date() });
    
    const container = document.getElementById('assistantMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `assistant-message ${type} fade-in`;
    messageDiv.innerHTML = `
      <div class="message-bubble">${this.formatMessage(text)}</div>
    `;
    container.appendChild(messageDiv);
    
    container.scrollTop = container.scrollHeight;
  },
  
  formatMessage(text) {
    return Utils.escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  },
  
  send() {
    const input = document.getElementById('assistantInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    this.addMessage('user', message);
    input.value = '';
    
    setTimeout(() => {
      const response = this.processMessage(message);
      this.addMessage('bot', response);
    }, 500);
  },
  
  processMessage(message) {
    const lower = message.toLowerCase();
    const productCount = ProductManager.products.length;
    
    // Help
    if (lower.includes('help') || lower === '?') {
      return `🎯 **Available Commands**

**📊 Stats & Info**
• "stats" or "status" - Your numbers
• "what can you do" - Features list

**📤 Upload & Export**
• "upload" - Upload to WooCommerce
• "export" - Export options
• "how to upload" - Step-by-step guide

**✅ Quality**
• "quality check" or "check" - Validate products
• "fix issues" - Quality help

**✏️ Editing**
• "how to edit" - Edit products
• "bulk edit" - Mass operations
• "templates" - Use templates

**🏷️ Categories**
• "categories" - Category help
• "sync categories" - Fetch from store

Just ask me anything!`;
    }
    
    // Stats
    if (lower.includes('stats') || lower.includes('status') || lower.includes('how many')) {
      const withCategories = ProductManager.products.filter(p => p.selectedCategories?.length > 0).length;
      const variable = ProductManager.products.filter(p => p.variations?.length > 0).length;
      const selected = ProductManager.selectedIndices.length;
      
      if (productCount === 0) {
        return `📊 **Your Statistics**

You haven't generated any products yet!

**Getting Started:**
1. Go to **Upload** tab
2. Add images (single or multi-image)
3. Click "Generate Products with AI"
4. Review and upload!

Need help? Just ask!`;
      }
      
      return `📊 **Your Statistics**

**Products:** ${productCount} total
• With categories: ${withCategories}
• Variable products: ${variable}
• Simple products: ${productCount - variable}
• Currently selected: ${selected}

${productCount > 0 && withCategories < productCount ? '\n⚠️ Some products need categories!' : ''}
${productCount > 0 ? '\n✅ Ready to upload to WooCommerce!' : ''}`;
    }
    
    // Upload help
    if (lower.includes('upload') || lower.includes('woo')) {
      if (productCount === 0) {
        return `📤 **Upload Guide**

You need products first! Here's how:

**Step 1: Add Images**
• Go to **Upload** tab
• Click "Add Single Batch" (each image = 1 product)
• OR "Add Multi-Image" (all images = 1 product)

**Step 2: Generate**
• Upload your images
• Add optional notes for AI
• Click "Generate Products"

**Step 3: Upload**
• Review products
• Run quality check
• Click "Upload to WooCommerce"

Ready to start? Go to Upload tab!`;
      }
      
      return `📤 **Ready to Upload!**

You have **${productCount} products** ready.

**Quick Upload:**
1. Go to **Products** tab
2. Review your products
3. Click "Upload to WooCommerce"

**Before uploading:**
• Run quality check ✓
• Assign categories ✓
• Set correct prices ✓

Want me to start uploading now?`;
    }
    
    // Quality check
    if (lower.includes('quality') || lower.includes('check') || lower.includes('validate')) {
      return `✅ **Quality Control**

I'll help you ensure perfect uploads!

**To run quality check:**
1. Go to **Quality Check** tab
2. Click "Run Quality Check"

**I check for:**
• Valid titles & descriptions
• Correct prices
• Required images
• Category assignment
• SKU presence
• Variation data

${productCount > 0 ? '\n💡 Run it now to catch any issues!' : '\n⚠️ Generate products first!'}`;
    }
    
    // Edit help
    if (lower.includes('edit') && !lower.includes('bulk')) {
      return `✏️ **Edit Products**

**To edit a single product:**
1. Go to **Products** tab
2. Find your product
3. Click the **"Edit"** button (blue pencil icon)
4. Modify details in the popup
5. Click **"Save Changes"**

**You can edit:**
• Title & descriptions
• Price & SKU
• Tags & categories
• View all images

**Pro tip:** Use "Show more" to see full descriptions!`;
    }
    
    // Bulk edit
    if (lower.includes('bulk')) {
      return `🔧 **Bulk Edit Operations**

Go to **Bulk Edit** tab for powerful tools:

**📝 Find & Replace**
Change text across all products

**💰 Price Adjustment**
• Add/subtract amounts
• Multiply by percentage
• Set fixed prices

**🏷️ Add Tags**
Apply tags to all products at once

**📁 Change Categories**
Assign categories in bulk

These save TONS of time!`;
    }
    
    // Categories
    if (lower.includes('categor')) {
      return `📁 **Category Management**

**Auto-Selection:**
AI automatically picks matching categories based on product analysis.

**Manual Assignment:**
1. Go to **Products** tab
2. Click **Edit** on any product
3. Check categories in the popup

**Sync Categories:**
Click "Sync Categories from Store" to fetch latest from WooCommerce.

**Bulk Categories:**
Go to **Bulk Edit** tab to assign to all products at once.`;
    }
    
    // Templates
    if (lower.includes('template')) {
      return `📋 **Product Templates**

Templates save time with pre-configured:
• Attributes (Color, Size, etc.)
• Variations
• Default values

**To use:**
1. Go to **Templates** tab
2. Choose a template (T-Shirt, Shoes, etc.)
3. Click **"Apply"**
4. Generate products normally

**Create Custom:**
Click "Create New Template" to make your own!`;
    }
    
    // Export
    if (lower.includes('export') || lower.includes('csv')) {
      return `📥 **Export Options**

**CSV Export:**
Click "Export CSV" button to download all products in spreadsheet format.

**Use cases:**
• Backup your products
• Edit in Excel/Sheets
• Import to other platforms
• Share with team

The CSV includes all product data, images, and categories!`;
    }
    
    // Greetings
    if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
      return `👋 **Hello Zakriibrahim!**

How can I help you today?

${productCount > 0 ? `You have **${productCount} products** ready.` : 'Ready to generate some products?'}

Type "help" to see all commands!`;
    }
    
    // Thanks
    if (lower.includes('thank')) {
      return `😊 **You're welcome!**

Happy to help! Let me know if you need anything else.

Your products are looking great! 🚀`;
    }
    
    // Default
    return `🤔 **Not sure about that...**

Try these commands:
• **"stats"** - View your numbers
• **"upload"** - Upload help
• **"edit"** - How to edit
• **"help"** - All commands

Or ask me:
• "How do I...?"
• "What is...?"
• "Show me..."

What would you like to know?`;
  },
  
  close() {
    this.isOpen = false;
    document.getElementById('assistantPanel').classList.add('hidden');
  }
};

window.AIAssistant = AIAssistant;

console.log('✅ AIAssistant loaded (ENHANCED VERSION)');
