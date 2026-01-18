import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../stores/appStore';
import { 
  LayoutDashboard, 
  CreditCard, 
  DollarSign, 
  User, 
  LogOut,
  Bird,
  PiggyBank,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import BottomNav from './BottomNav';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: CreditCard },
  { name: 'Net Worth & Accounts', href: '/accounts', icon: DollarSign },
  { name: 'Budgets', href: '/budgets', icon: PiggyBank },
  { name: 'Transaction Rules', href: '/transaction-rules', icon: Settings },
  { name: 'Profile', href: '/profile', icon: User },
];

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { sidebarCollapsedDesktop, setSidebarCollapsedDesktop } = useAppStore();
  const navItems = (user && user.super_admin) ? [
    ...navigation,
    { name: 'Admin', href: '/admin', icon: Settings },
  ] : navigation;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`hidden md:block relative w-16 ${sidebarCollapsedDesktop ? 'md:w-16' : 'md:w-64'} bg-white shadow-sm`}>
        <div className={`flex items-center justify-center md:justify-between px-2 md:px-6 py-4 border-b border-gray-200`}>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Bird className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsedDesktop && <span className="hidden md:inline text-xl font-bold text-gray-900">Budgee</span>}
          </div>
        </div>
        <button
          onClick={() => setSidebarCollapsedDesktop(!sidebarCollapsedDesktop)}
          className="hidden md:flex items-center justify-center absolute -right-3 top-4 z-20 w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
          title={sidebarCollapsedDesktop ? 'Expand navigation' : 'Collapse navigation'}
        >
          {sidebarCollapsedDesktop ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
        </button>
        
        <nav className="mt-6">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center justify-center ${sidebarCollapsedDesktop ? 'md:justify-center md:px-0' : 'md:justify-start md:px-6'} px-0 py-3 text-sm font-medium transition-colors ${
                  isActive
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <item.icon className={`h-5 w-5 ${sidebarCollapsedDesktop ? '' : 'md:mr-3'}`} />
                {!sidebarCollapsedDesktop && <span className="hidden md:inline">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="md:hidden flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Bird className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">Budgee</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user ? (user.email || user.username || user.first_name || 'User') : 'Loading...'}
              </span>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <BottomNav items={navItems.filter((i) => i.name !== 'Admin')} />
    </div>
  );
};
