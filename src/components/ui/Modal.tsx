import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className,
  size = 'md',
  showClose = true
}) => {
  const [show, setShow] = useState(isOpen);

  useEffect(() => {
    setShow(isOpen);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw] h-[90vh]',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={cn(
              'relative z-50 w-full bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-2xl shadow-2xl border border-slate-200/60 dark:border-slate-800/60 dark:text-slate-100 overflow-hidden',
              // Mobile: bottom sheet style with rounded top corners
              'rounded-t-2xl sm:rounded-2xl',
              // Mobile: max height with safe area
              'max-h-[92vh] sm:max-h-[90vh]',
              sizeClasses[size],
              className
            )}
          >
            {/* Drag handle for mobile */}
            <div className="sm:hidden flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>
            
            <div className={cn(
              'flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200/60 dark:border-slate-800/60',
              !showClose && 'px-4 sm:px-6'
            )}>
              <h2 className="text-lg sm:text-xl font-display font-semibold tracking-tight">{title}</h2>
              {showClose && (
                <button 
                  onClick={onClose}
                  className="rounded-full p-2.5 sm:p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:rotate-90 duration-300 touch-manipulation -mr-1"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            <div className="p-4 sm:p-6 max-h-[calc(92vh-4rem)] sm:max-h-[70vh] overflow-y-auto custom-scrollbar overscroll-contain">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
