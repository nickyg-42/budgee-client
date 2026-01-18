import { SelectHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../../utils/cn';

type Size = 'sm' | 'md';

interface MinimalSelectProps extends PropsWithChildren<SelectHTMLAttributes<HTMLSelectElement>> {
  size?: Size;
}

export const MinimalSelect = ({ size = 'md', className, children, ...props }: MinimalSelectProps) => {
  const base = 'w-full bg-white border border-gray-300 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 hover:bg-gray-50';
  const sizeCls = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm';
  return (
    <select {...props} className={cn(base, sizeCls, className)}>
      {children}
    </select>
  );
};
