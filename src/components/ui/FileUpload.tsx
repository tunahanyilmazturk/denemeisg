import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, FileWarning, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IncidentPhoto } from '../../types';
import toast from 'react-hot-toast';

interface FileUploadProps {
  photos: IncidentPhoto[];
  onPhotosChange: (photos: IncidentPhoto[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

export const FileUpload: React.FC<FileUploadProps> = ({
  photos,
  onPhotosChange,
  maxFiles = 10,
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const newPhotos: IncidentPhoto[] = [];
      const maxSizeBytes = maxSizeMB * 1024 * 1024;

      // Check total file count
      if (photos.length + files.length > maxFiles) {
        toast.error(`En fazla ${maxFiles} fotoğraf yükleyebilirsiniz`);
        setUploading(false);
        return;
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file type
        if (!acceptedTypes.includes(file.type)) {
          toast.error(`${file.name}: Desteklenmeyen dosya türü`);
          continue;
        }

        // Check file size
        if (file.size > maxSizeBytes) {
          toast.error(`${file.name}: Maksimum ${maxSizeMB}MB boyutunda dosya yükleyebilirsiniz`);
          continue;
        }

        // Convert to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newPhotos.push({
          id: `photo-${Date.now()}-${i}`,
          name: file.name,
          url: base64,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        });
      }

      if (newPhotos.length > 0) {
        onPhotosChange([...photos, ...newPhotos]);
        toast.success(`${newPhotos.length} fotoğraf yüklendi`);
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Fotoğraf yüklenirken bir hata oluştu');
    } finally {
      setUploading(false);
    }
  }, [photos, onPhotosChange, maxFiles, maxSizeMB, acceptedTypes]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removePhoto = useCallback((photoId: string) => {
    onPhotosChange(photos.filter(p => p.id !== photoId));
    toast.success('Fotoğraf kaldırıldı');
  }, [photos, onPhotosChange]);

  const updateCaption = useCallback((photoId: string, caption: string) => {
    onPhotosChange(photos.map(p => p.id === photoId ? { ...p, caption } : p));
  }, [photos, onPhotosChange]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleChange}
          className="hidden"
          disabled={uploading}
        />
        
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all ${
            dragActive
              ? 'bg-indigo-500 scale-110'
              : 'bg-gradient-to-br from-indigo-500 to-purple-600'
          }`}>
            <Upload className="h-8 w-8 text-white" />
          </div>
          
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {dragActive ? 'Fotoğrafları buraya bırakın' : 'Fotoğraf yükle'}
          </h3>
          
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-2">
            Sürükle-bırak veya tıklayarak seç
          </p>
          
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Maksimum {maxFiles} dosya, her biri {maxSizeMB}MB'a kadar
          </p>
          
          <div className="flex gap-2 mt-3">
            {acceptedTypes.map(type => (
              <span key={type} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400">
                {type.split('/')[1].toUpperCase()}
              </span>
            ))}
          </div>
        </label>
        
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Yükleniyor...</span>
            </div>
          </div>
        )}
      </div>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Yüklenen Fotoğraflar ({photos.length}/{maxFiles})
            </h4>
            <button
              onClick={() => {
                onPhotosChange([]);
                toast.success('Tüm fotoğraflar kaldırıldı');
              }}
              className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
            >
              Tümünü Kaldır
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {photos.map((photo) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all"
                >
                  {/* Image Preview */}
                  <div className="relative aspect-video bg-slate-100 dark:bg-slate-900">
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Delete button */}
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg transform hover:scale-110"
                      title="Fotoğrafı Kaldır"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    
                    {/* Success indicator */}
                    <div className="absolute top-2 left-2 p-1.5 bg-emerald-500 text-white rounded-full shadow-lg">
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <ImageIcon className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate" title={photo.name}>
                          {photo.name}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatFileSize(photo.size)}
                      </span>
                    </div>
                    
                    {/* Caption input */}
                    <input
                      type="text"
                      placeholder="Açıklama ekle (opsiyonel)"
                      value={photo.caption || ''}
                      onChange={(e) => updateCaption(photo.id, e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {photos.length === 0 && !uploading && (
        <div className="text-center py-4">
          <FileWarning className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Henüz fotoğraf yüklenmedi</p>
        </div>
      )}
    </div>
  );
};
