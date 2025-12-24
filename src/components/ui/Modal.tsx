import React from 'react';

interface ModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ open, title, onClose, children, actions, size = 'md' }) => {
  if (!open) return null;
  const sizeClass =
    size === 'sm' ? 'max-w-md' :
    size === 'md' ? 'max-w-md' :
    size === 'lg' ? 'max-w-2xl' :
    'max-w-4xl';
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={`w-full ${sizeClass} bg-white rounded-lg shadow-xl flex flex-col max-h-[80vh]`}>
          {title && (
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
          )}
          <div className="px-4 py-4 flex-1 overflow-y-auto">
            {children}
          </div>
          <div className="px-4 py-3 border-t border-gray-200 flex justify-end space-x-2">
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
};
