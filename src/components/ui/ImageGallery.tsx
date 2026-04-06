import React, { useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, Download, Image as ImageIcon, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IncidentPhoto } from '../../types';

interface ImageGalleryProps {
  photos: IncidentPhoto[];
  columns?: number;
  maxDisplay?: number;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  photos,
  columns = 3,
  maxDisplay = 6,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);

  const displayPhotos = photos.slice(0, maxDisplay);
  const remainingCount = photos.length - maxDisplay;

  const openLightbox = useCallback((index: number) => {
    setSelectedIndex(index);
    setZoomed(false);
  }, []);

  const closeLightbox = useCallback(() => {
    setSelectedIndex(null);
    setZoomed(false);
  }, []);

  const navigate = useCallback((direction: 'prev' | 'next') => {
    if (selectedIndex === null) return;
    if (direction === 'prev') {
      setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : photos.length - 1);
    } else {
      setSelectedIndex(selectedIndex < photos.length - 1 ? selectedIndex + 1 : 0);
    }
    setZoomed(false);
  }, [selectedIndex, photos.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigate('prev');
    if (e.key === 'ArrowRight') navigate('next');
  }, [closeLightbox, navigate]);

  const handleDownload = useCallback((photo: IncidentPhoto) => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  if (!photos || photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-500 dark:text-slate-400">
        <ImageIcon className="h-12 w-12 mb-3 text-slate-300 dark:text-slate-600" />
        <p className="text-sm font-medium">Fotoğraf bulunmuyor</p>
        <p className="text-xs mt-1">Bu olaya ait yüklenmiş fotoğraf yok</p>
      </div>
    );
  }

  const gridColsClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  }[columns] || 'grid-cols-2 md:grid-cols-3';

  return (
    <>
      {/* Photo Grid */}
      <div className={`grid ${gridColsClass} gap-3`}>
        {displayPhotos.map((photo, index) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all hover:shadow-lg"
            onClick={() => openLightbox(index)}
          >
            <img
              src={photo.url}
              alt={photo.caption || photo.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                {photo.caption && (
                  <p className="text-white text-xs font-medium truncate mb-1">{photo.caption}</p>
                )}
                <p className="text-white/70 text-[10px] truncate">{photo.name}</p>
              </div>
              <div className="absolute top-2 right-2">
                <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                  <ZoomIn className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>

            {/* Last item overlay for remaining count */}
            {index === displayPhotos.length - 1 && remainingCount > 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center">
                  <Maximize2 className="h-6 w-6 text-white mx-auto mb-1" />
                  <span className="text-white text-lg font-bold">+{remainingCount}</span>
                  <p className="text-white/80 text-xs">daha</p>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Photo count info */}
      {photos.length > 0 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Toplam {photos.length} fotoğraf
          </span>
          <button
            onClick={() => openLightbox(0)}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1"
          >
            <Maximize2 className="h-3 w-3" />
            Tümünü görüntüle
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center"
            onClick={closeLightbox}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Photo Counter */}
            <div className="absolute top-4 left-4 z-10 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
              <span className="text-white text-sm font-medium">
                {selectedIndex + 1} / {photos.length}
              </span>
            </div>

            {/* Navigation - Prev */}
            {photos.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate('prev'); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Navigation - Next */}
            {photos.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate('next'); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {/* Main Image */}
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: zoomed ? 1.5 : 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-[90vw] max-h-[80vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={photos[selectedIndex].url}
                alt={photos[selectedIndex].caption || photos[selectedIndex].name}
                className={`max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl transition-transform duration-300 ${
                  zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
                }`}
                onClick={() => setZoomed(!zoomed)}
              />
            </motion.div>

            {/* Bottom Info Bar */}
            <div
              className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-w-3xl mx-auto flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {photos[selectedIndex].caption || photos[selectedIndex].name}
                  </p>
                  <p className="text-white/60 text-sm truncate">
                    {photos[selectedIndex].name}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setZoomed(!zoomed)}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    title={zoomed ? 'Uzaklaştır' : 'Yakınlaştır'}
                  >
                    <ZoomIn className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDownload(photos[selectedIndex])}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    title="İndir"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
