import { useState, useCallback } from 'react';
import { getImageUrl, getThumbnailUrl, getImageSrcSet, getImageSizes } from '../utils/imageUrl';

/**
 * GALLERY GRID COMPONENT
 * 
 * Features:
 * - Lazy loading for all images (loading="lazy")
 * - Thumbnail + full image strategy for new uploads
 * - Backward compatible with old /assets/ images
 * - Click to view full image in modal
 */

const GalleryGrid = ({ images, categories = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageLoaded, setImageLoaded] = useState({});

  const filteredImages = selectedCategory === 'all' 
    ? images 
    : images.filter(img => img.category === selectedCategory);

  // Track image load state for smooth fade-in
  const handleImageLoad = useCallback((imageId) => {
    setImageLoaded(prev => ({ ...prev, [imageId]: true }));
  }, []);

  return (
    <>
      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === 'all'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-gray-700 hover:bg-amber-50'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-amber-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Image Grid with Lazy Loading */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredImages.map((image) => {
          // Get thumbnail for grid view (uses thumbnailUrl if available, else full image)
          const thumbnailSrc = getThumbnailUrl(image.src || image.url, image.thumbnailUrl);
          const srcSet = getImageSrcSet(image.src || image.url, image.thumbnailUrl);
          
          return (
            <div
              key={image.id}
              onClick={() => setSelectedImage(image)}
              className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow bg-gray-100"
            >
              {/* Placeholder skeleton while loading */}
              {!imageLoaded[image.id] && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              )}
              
              <img
                src={thumbnailSrc}
                srcSet={srcSet || undefined}
                sizes={srcSet ? getImageSizes('grid') : undefined}
                alt={image.title || image.altText || 'Gallery image'}
                loading="lazy" // Native lazy loading
                decoding="async" // Non-blocking decode
                onLoad={() => handleImageLoad(image.id)}
                className={`w-full h-64 object-cover group-hover:scale-110 transition-all duration-300 ${
                  imageLoaded[image.id] ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
              
              {/* Optional title overlay */}
              {image.title && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm font-medium truncate">{image.title}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredImages.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No images found in this category.</p>
        </div>
      )}

      {/* Full Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-full" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors z-10"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Full resolution image */}
            <img
              src={getImageUrl(selectedImage.src || selectedImage.url)}
              alt={selectedImage.title || selectedImage.altText || 'Gallery image'}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              loading="eager" // Load immediately when modal opens
            />
            
            {/* Image title in modal */}
            {selectedImage.title && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                <p className="text-white text-lg font-medium">{selectedImage.title}</p>
                {selectedImage.category && (
                  <p className="text-gray-300 text-sm capitalize">{selectedImage.category}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default GalleryGrid;

