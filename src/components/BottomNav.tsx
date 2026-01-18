import { Link, useLocation } from 'react-router-dom';
import { CSSProperties } from 'react';

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

interface BottomNavProps {
  items: NavItem[];
}

export default function BottomNav({ items }: BottomNavProps) {
  const location = useLocation();
  const safeStyle: CSSProperties = {
    paddingBottom: 'env(safe-area-inset-bottom)',
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden"
      style={safeStyle}
    >
      <nav className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={isActive ? 'text-blue-600' : 'text-gray-600'}
              aria-label={item.name}
            >
              <div className="flex flex-col items-center justify-center py-3">
                <Icon className="w-6 h-6" />
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
