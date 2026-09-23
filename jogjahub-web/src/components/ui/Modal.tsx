import type { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          {title ? <h3 className="text-lg font-semibold text-slate-900">{title}</h3> : <div />}
          {onClose ? (
            <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">
              Close
            </button>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}
