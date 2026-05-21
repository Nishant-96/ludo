import { type FC, type ReactNode, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  fullscreen?: boolean;
}

export const Modal: FC<ModalProps> = ({ isOpen, onClose, title, children, fullscreen = false }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const panelClass = fullscreen
    ? 'relative z-10 w-full h-full flex flex-col bg-surface outline-none'
    : 'relative z-10 w-full max-w-sm rounded-t-2xl bg-surface p-6 outline-none sm:rounded-2xl shadow-card border border-border';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={fullscreen ? 'fixed inset-0 z-50 flex flex-col' : 'fixed inset-0 z-50 flex items-end justify-center sm:items-center'}
          onClick={fullscreen ? undefined : onClose}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={fullscreen ? { opacity: 0, y: 20 } : { y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={fullscreen ? { opacity: 0, y: 20 } : { y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={panelClass}
            onClick={(e) => e.stopPropagation()}
          >
            {!fullscreen && (
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">{title}</h2>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-slate-400 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
