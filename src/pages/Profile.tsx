import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { User, Mail, Calendar, Shield, AtSign } from 'lucide-react';
import { formatDate } from '../utils/formatters';
import { useEffect, useState, useRef } from 'react';
import { apiService } from '../services/api';
import { toast } from 'sonner';
import { Modal } from '../components/ui/Modal';
import { useAppStore } from '../stores/appStore';
import { useTheme } from '../theme/ThemeContext';
import { createMonochromePalette } from '../theme/monochrome';

export const Profile = () => {
  const { user, logout } = useAuth();
  const { accounts, transactions } = useAppStore();
  const [profileUser, setProfileUser] = useState(user);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [accountCount, setAccountCount] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const initCountsRef = useRef(false);
  const { applyTheme, palette, themeId, baseColor } = useTheme();
  const [monoColor, setMonoColor] = useState('#4b5563');
  const previewPalette = createMonochromePalette(monoColor);

  useEffect(() => {
    let mounted = true;
    const loadUser = async () => {
      try {
        const id = user?.id;
        if (id && id > 0) {
          const u = await apiService.getCurrentUser(id);
          if (mounted) setProfileUser(u);
          const s = String((u as any)?.theme || '');
          if (s) {
            if (s.startsWith('monochrome:')) {
              const hex = s.split(':')[1] || '';
              await applyTheme('monochrome', { baseColor: hex });
            } else if (s === 'earth' || s === 'pastel') {
              await applyTheme(s as any);
            }
          }
        } else {
          if (mounted) setProfileUser(user || null);
        }
      } catch (e) {
        setProfileUser(user || null);
      }
    };
    loadUser();
    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (initCountsRef.current) return;
    initCountsRef.current = true;
    const computeCounts = async () => {
      try {
        const accLen = Array.isArray(accounts) ? accounts.length : 0;
        const txnLen = Array.isArray(transactions) ? transactions.length : 0;
        if (accLen > 0 || txnLen > 0) {
          setAccountCount(accLen);
          setTransactionCount(txnLen);
          return;
        }
        const items = await apiService.getPlaidItems();
        const accountsByItem = await Promise.all((items || []).map((item) =>
          apiService.getAccountsFromDB(item.id).catch(() => [])
        ));
        const allAccounts = ([] as any[]).concat(...accountsByItem).filter(Boolean);
        setAccountCount(allAccounts.length);
        const txnsByAccount = await Promise.all((allAccounts || []).map((acc: any) =>
          apiService.getTransactions(acc.id).catch(() => [])
        ));
        const normalized = (txnsByAccount || []).map((arr) => Array.isArray(arr) ? arr : (arr ? [arr] : []));
        const allTxns = ([] as any[]).concat(...normalized).filter((t) => !!t && typeof t === 'object');
        setTransactionCount(allTxns.length);
      } catch {
        setAccountCount(Array.isArray(accounts) ? accounts.length : 0);
        setTransactionCount(Array.isArray(transactions) ? transactions.length : 0);
      }
    };
    computeCounts();
  }, [accounts, transactions]);

  if (!profileUser) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Please log in to view your profile.</p>
        </div>
      </Layout>
    );
  }

  return (
    <>
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="space-y-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Full Name</p>
                    <p className="text-gray-900">{profileUser.first_name} {profileUser.last_name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <AtSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Username</p>
                    <p className="text-gray-900">{profileUser.username}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email Address</p>
                    <p className="text-gray-900">{profileUser.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Member Since</p>
                    <p className="text-gray-900">{formatDate(profileUser.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Account Status</p>
                    <p className="text-green-600 font-medium">Active</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Account Statistics</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-500">{accountCount}</p>
                  <p className="text-sm text-gray-600">Connected Accounts</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-500">{transactionCount}</p>
                  <p className="text-sm text-gray-600">Transactions Tracked</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Account Actions</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setFirstName(profileUser.first_name || '');
                    setLastName(profileUser.last_name || '');
                    setEmail(profileUser.email || '');
                    setIsEditOpen(true);
                  }}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium text-gray-900">Update Profile</p>
                  <p className="text-sm text-gray-600">Change your name or email address</p>
                </button>
                
                <button
                  onClick={() => {
                    setCurrentPassword('');
                    setNewPassword('');
                    setIsPasswordOpen(true);
                  }}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium text-gray-900">Change Password</p>
                  <p className="text-sm text-gray-600">Update your account password</p>
                </button>
                
                <button
                  onClick={() => {
                    if (themeId === 'monochrome' && baseColor) {
                      setMonoColor(baseColor);
                    }
                    setIsThemeOpen(true);
                  }}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium text-gray-900">Customize Theme</p>
                  <p className="text-sm text-gray-600">
                    {(() => {
                      const s = String((profileUser as any)?.theme || '');
                      if (!s || s === 'default') return 'Default';
                      if (s.startsWith('monochrome:')) return 'Monochrome';
                      if (s === 'earth') return 'Earth';
                      if (s === 'pastel') return 'Pastel';
                      return 'Default';
                    })()}
                  </p>
                </button>
                
                <button
                  onClick={async () => {
                    const ok = window.confirm('Are you sure you want to delete your account?');
                    if (!ok) return;
                    try {
                      const uid = (profileUser as any)?.id || user?.id;
                      await apiService.deleteAccount(Number(uid));
                      toast.success('Account deleted');
                      logout();
                    } catch (e) {
                      toast.error('Failed to delete account');
                    }
                  }}
                  className="w-full text-left p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <p className="font-medium text-red-600">Delete Account</p>
                  <p className="text-sm text-red-600">Permanently delete your account and data</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
    <Modal
      open={isEditOpen}
      title="Update Profile"
      onClose={() => setIsEditOpen(false)}
      actions={(
        <>
          <button
            onClick={() => setIsEditOpen(false)}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              try {
                const updated = await apiService.updateUser({ first_name: firstName, last_name: lastName, email });
                const id = (profileUser as any)?.id || user?.id;
                if (id && id > 0) {
                  const fresh = await apiService.getCurrentUser(id);
                  setProfileUser(fresh);
                } else {
                  setProfileUser(updated);
                }
                toast.success('Profile updated');
                setIsEditOpen(false);
              } catch (e) {
                toast.error('Failed to update profile');
              }
            }}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>
        </>
      )}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </Modal>
    <Modal
      open={isThemeOpen}
      title="Customize Theme"
      onClose={() => setIsThemeOpen(false)}
      actions={(
        <>
          <button
            onClick={() => setIsThemeOpen(false)}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
          >
            Close
          </button>
        </>
      )}
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Prebuilt Themes</h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="border border-gray-200 rounded-md p-3">
              <div className="text-sm font-medium mb-2">Default</div>
              <div className="flex items-center space-x-2 mb-3">
                <span className="w-5 h-5 rounded-sm" style={{ backgroundColor: '#10b981' }} />
                <span className="w-5 h-5 rounded-sm" style={{ backgroundColor: '#ef4444' }} />
                <span className="w-5 h-5 rounded-sm" style={{ backgroundColor: '#f59e0b' }} />
                <span className="w-5 h-5 rounded-sm" style={{ backgroundColor: '#6b7280' }} />
              </div>
              <button
                onClick={async () => {
                  await applyTheme('default');
                  setProfileUser((prev: any) => prev ? { ...prev, theme: 'default' } : prev);
                  toast.success('Applied Default theme');
                  setIsThemeOpen(false);
                }}
                className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 w-full"
              >
                Apply
              </button>
            </div>
            <div className="border border-gray-200 rounded-md p-3">
              <div className="text-sm font-medium mb-2">Earth</div>
              <div className="flex items-center space-x-2 mb-3">
                <span className="w-5 h-5 rounded-sm" style={{ backgroundColor: '#166534' }} />
                <span className="w-5 h-5 rounded-sm" style={{ backgroundColor: '#8b1a1a' }} />
                <span className="w-5 h-5 rounded-sm" style={{ backgroundColor: '#b45309' }} />
                <span className="w-5 h-5 rounded-sm" style={{ backgroundColor: '#374151' }} />
              </div>
              <button
                onClick={async () => {
                  await applyTheme('earth');
                  setProfileUser((prev: any) => prev ? { ...prev, theme: 'earth' } : prev);
                  toast.success('Applied Earth theme');
                  setIsThemeOpen(false);
                }}
                className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 w-full"
              >
                Apply
              </button>
            </div>
            <div className="border border-gray-200 rounded-md p-3">
              <div className="text-sm font-medium mb-2">Pastel</div>
              <div className="flex items-center space-x-2 mb-3">
                <span className="w-5 h-5 rounded-sm" style={{ backgroundColor: '#86efac' }} />
                <span className="w-5 h-5 rounded-sm" style={{ backgroundColor: '#fda4af' }} />
                <span className="w-5 h-5 rounded-sm" style={{ backgroundColor: '#fcd34d' }} />
                <span className="w-5 h-5 rounded-sm" style={{ backgroundColor: '#9ca3af' }} />
              </div>
              <button
                onClick={async () => {
                  await applyTheme('pastel');
                  setProfileUser((prev: any) => prev ? { ...prev, theme: 'pastel' } : prev);
                  toast.success('Applied Pastel theme');
                  setIsThemeOpen(false);
                }}
                className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 w-full"
              >
                Apply
              </button>
            </div>
            <div className="border border-gray-200 rounded-md p-3">
              <div className="text-sm font-medium mb-2">Monochrome</div>
              <div className="mb-3">
                <input type="color" value={monoColor} onChange={(e) => setMonoColor(e.target.value)} className="w-full h-10 p-0 border border-gray-200 rounded-md" />
              </div>
              <div className="flex items-center space-x-2 mb-3">
                <span className="w-5 h-5 rounded-sm" style={{ backgroundColor: monoColor }} />
                <span className="w-5 h-5 rounded-sm" style={{ backgroundColor: previewPalette.semantic.good }} />
                <span className="w-5 h-5 rounded-sm" style={{ backgroundColor: previewPalette.semantic.bad }} />
              </div>
              <button
                onClick={async () => {
                  await applyTheme('monochrome', { baseColor: monoColor });
                  setProfileUser((prev: any) => prev ? { ...prev, theme: `monochrome:${monoColor}` } : prev);
                  toast.success('Applied Monochrome theme');
                  setIsThemeOpen(false);
                }}
                className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 w-full"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
    <Modal
      open={isPasswordOpen}
      title="Change Password"
      onClose={() => setIsPasswordOpen(false)}
      actions={(
        <>
          <button
            onClick={() => setIsPasswordOpen(false)}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              if (!currentPassword || !newPassword) return;
              try {
                await apiService.changePassword({ current_password: currentPassword, new_password: newPassword });
                toast.success('Password changed');
                setIsPasswordOpen(false);
              } catch (e) {
                toast.error('Failed to change password');
              }
            }}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>
        </>
      )}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </Modal>
    </>
  );
};
