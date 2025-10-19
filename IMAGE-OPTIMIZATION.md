# Advanced Image Optimization Features

## Overview

The AI Product Generator now includes comprehensive image optimization capabilities that automatically enhance, resize, and compress product images to WooCommerce standards.

## Features

### 🎨 Auto-Cropping
- Automatically detects product boundaries using edge detection
- Removes excess whitespace around products
- Focuses the image on the main product item
- Adds intelligent padding (5%) for visual balance

### 📐 WooCommerce-Ready Resizing
- Resizes images to standard WooCommerce dimensions
- Available sizes: 800×800px, 1000×1000px (recommended), 1200×1200px
- Square format ensures consistent product galleries
- Centers products while maintaining aspect ratio
- Fills background with white (or transparent if background removal is enabled)

### ✨ Quality Enhancement
- Applies sharpening filter to improve image clarity
- Uses high-quality image smoothing for professional results
- Preserves important details while enhancing edges

### 🗑️ Background Removal
- Client-side background removal using color-based algorithm
- Falls back gracefully if advanced libraries aren't available
- Creates clean, professional product images
- Supports transparent backgrounds

### 🗜️ Smart Compression
- Modern WebP format support (best compression with high quality)
- JPEG format option for universal compatibility
- Intelligent quality settings (WebP: 85%, JPEG: 90%)
- Reduces file sizes by 30-70% without visible quality loss
- Faster page loading and better SEO

### 👁️ Preview Before Upload
- Shows side-by-side comparison of original vs. optimized images
- Displays file size savings and compression percentage
- Lists all applied optimizations
- Allows users to accept or reject changes

## Usage

### Enable/Disable Optimization

Toggle the "Enable Auto-Optimization" checkbox in the Upload tab to turn automatic optimization on or off.

### Configure Settings

Click the "Settings" button to customize optimization parameters:

1. **Auto-Crop**: Enable/disable automatic cropping
2. **Resize for WooCommerce**: Enable/disable resizing
3. **Target Size**: Choose from 800×800, 1000×1000, or 1200×1200 pixels
4. **Remove Background**: Enable for transparent backgrounds
5. **Output Format**: Choose WebP (best) or JPEG (universal)
6. **Smart Compression**: Enable/disable compression

Settings are saved automatically and applied to all future uploads.

### Upload Workflow

1. Click "Add Single Product Batch" or "Add Multi-Image Product"
2. Upload your product images (drag & drop or click to browse)
3. Images are automatically optimized based on your settings
4. Optimized images show a green "Optimized" badge
5. File size reduction is displayed in notifications

## Technical Details

### Client-Side Processing

All image processing happens in the browser using HTML5 Canvas API:
- No server-side dependencies required
- Immediate processing without network delays
- Privacy-friendly (images never leave the user's device until upload)

### Image Processing Pipeline

1. **Load**: Image loaded into memory
2. **Auto-Crop**: Content boundaries detected and image cropped
3. **Resize**: Image scaled to target dimensions with high-quality smoothing
4. **Enhance**: Sharpening filter applied using convolution kernel
5. **Background Removal** (optional): Transparent background created
6. **Compress**: Output to WebP or JPEG with optimized quality settings

### Supported Input Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

### Output Formats

- **WebP** (recommended): Modern format with superior compression
- **JPEG**: Universal compatibility for older browsers/systems

## Performance

- Processing time: ~100-500ms per image (depends on size and settings)
- File size reduction: Typically 30-70% smaller
- Quality: No visible loss with recommended settings
- Memory efficient: Processes images one at a time

## Browser Compatibility

Works in all modern browsers with HTML5 Canvas support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Best Practices

1. **Use WebP format** when possible for best compression
2. **Enable auto-crop** to remove unnecessary whitespace
3. **Use 1000×1000px** as the target size for optimal quality/size balance
4. **Enable background removal** for products that need clean backgrounds
5. **Keep optimization enabled** unless working with pre-optimized images

## Troubleshooting

### Image Processing Fails

If optimization fails, the original image is used automatically with a warning notification.

**Common causes:**
- Corrupted image file
- Unsupported format
- Browser memory limitations (very large images)

**Solution:** Try a different image or reduce the original image size before uploading.

### Background Removal Not Working Well

The client-side background removal uses a simple color-based algorithm. For best results:
- Use images with solid, uniform backgrounds
- White or light-colored backgrounds work best
- Products should have clear edges and contrast with background

For advanced background removal, the code is designed to support external libraries like `@imgly/background-removal-js` (can be added in the future).

## Future Enhancements

Potential future additions:
- Advanced AI-based background removal using external libraries
- Batch preview mode for multiple images
- Custom compression quality settings
- Format conversion without optimization
- Watermark addition
- Image filters and effects

## API Reference

### ImageOptimizer.optimizeImage(file, options)

Optimizes an image file with specified settings.

**Parameters:**
- `file` (File): The image file to optimize
- `options` (Object):
  - `removeBackground` (boolean): Remove background
  - `resize` (boolean): Resize to target size
  - `targetSize` (number): Target dimensions in pixels
  - `compress` (boolean): Apply compression
  - `format` (string): Output format ('webp' or 'jpeg')
  - `autoCrop` (boolean): Automatically crop to content

**Returns:** Canvas element with optimized image

### ImageOptimizer.canvasToBlob(canvas, format, quality)

Converts canvas to compressed blob.

**Parameters:**
- `canvas` (Canvas): The canvas element
- `format` (string): Output format ('webp' or 'jpeg')
- `quality` (number): Quality (0-1)

**Returns:** Promise<Blob>

### ImageOptimizer.getSettings()

Gets saved optimization settings from localStorage.

**Returns:** Object with current settings

### ImageOptimizer.showSettingsModal(callback)

Shows the settings configuration modal.

**Parameters:**
- `callback` (function): Optional callback function called when settings are saved

## Credits

Developed as part of the AI Product Generator Pro - WooCommerce automation tool.

## License

Same as the parent project.
