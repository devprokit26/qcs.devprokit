import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  dataTestId?: string;
}

/**
 * Number of modals currently open. Used so that closing a stacked modal
 * (e.g. Payment opened on top of Ledger Detail) does not re-enable page
 * scrolling while another modal is still visible.
 */
let openModalCount = 0;

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-5xl',
  full: 'max-w-[94vw]',
};

/**
 * Shared modal dialog.
 *
 * - Rendered through a React portal directly into <body>, so it always sits
 *   above the sticky top header and the sidebar (fixes the header showing
 *   through / not being covered when a modal is open).
 * - Closes ONLY when the user clicks the X button (or a Cancel/Close button
 *   that the parent wires to onClose). Clicking the dark backdrop or pressing
 *   Escape no longer closes it, so typed data is never lost by accident.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  dataTestId,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    openModalCount += 1;
    document.body.style.overflow = 'hidden';

    // Push a state entry so browser back button / mouse back button cannot close the modal
    const stateKey = `modal_${Date.now()}`;
    window.history.pushState({ modalOpen: stateKey }, '');

    const handlePopState = () => {
      // Keep modal open even when back button is pressed
      window.history.pushState({ modalOpen: stateKey }, '');
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      openModalCount = Math.max(0, openModalCount - 1);
      if (openModalCount === 0) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const content = (
    <div
      data-testid={dataTestId}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="app-modal fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-sm"
    >
      <div className="app-modal-wrapper flex min-h-full items-center justify-center p-3 sm:p-4">
        <div
          className={`app-modal-panel bg-white rounded-modal shadow-modal w-full ${sizeClasses[size]} border border-slate-200/80 overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)]`}
        >
          {/* Header — never scrolls away, always fully visible */}
          <div className="app-modal-header no-print px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-white flex-shrink-0">
            <div className="min-w-0 break-words">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-snug">{title}</h2>
              {subtitle && (
                <p className="text-xs text-slate-500 font-semibold mt-0.5 tracking-tight">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0"
              aria-label="Close modal"
              data-testid="modal-close-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="app-modal-body px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1 min-h-0">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="app-modal-footer no-print px-4 sm:px-6 py-3 sm:py-4 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2 sm:gap-3 flex-shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
};
