import { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../../utils/cn';

type PillVariant = 'active' | 'inactive';
type PillSize = 'sm' | 'md';

interface PillButtonProps extends PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> {
  variant?: PillVariant;
  size?: PillSize;
}

export const PillButton = ({ variant = 'active', size = 'sm', className, children, ...props }: PillButtonProps) => {
  const base = 'inline-flex items-center rounded-full border transition-colors disabled:opacity-50';
  const variantClasses =
    variant === 'active'
      ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50';
  const sizeClasses = size === 'sm' ? 'px-3 py-1 text-sm' : 'px-4 py-2';
  return (
    <button {...props} className={cn(base, variantClasses, sizeClasses, className)}>
      {children}
    </button>
  );
};
