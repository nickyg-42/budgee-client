import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { MinimalSelect } from '../components/ui/MinimalSelect';
import { apiService } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { toast } from 'sonner';
import { User, PlaidItem, WhitelistedEmail } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Edit, Trash2, RefreshCw, Lock, Unlock, Plus } from 'lucide-react';
import { formatDateTimeLocal } from '../utils/formatters';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [updatingWebhooks, setUpdatingWebhooks] = useState(false);
  const [clearingTxn, setClearingTxn] = useState(false);
  const [clearingItems, setClearingItems] = useState(false);
  const [clearingAccounts, setClearingAccounts] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [items, setItems] = useState<PlaidItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [savingUser, setSavingUser] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncResults, setSyncResults] = useState<Array<{ item_id: string; success: boolean; error?: string }>>([]);
  const [whitelist, setWhitelist] = useState<WhitelistedEmail[]>([]);
  const [loadingWhitelist, setLoadingWhitelist] = useState(false);
  const [addEmailOpen, setAddEmailOpen] = useState(false);
  const [addEmailValue, setAddEmailValue] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const list = await apiService.getUsers();
        setUsers(Array.isArray(list) ? list : []);
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
    };
    const loadItems = async () => {
      setLoadingItems(true);
      try {
        const list = await apiService.getAllPlaidItemsFromDB();
        setItems(Array.isArray(list) ? list : []);
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load items');
      } finally {
        setLoadingItems(false);
      }
    };
    loadUsers();
    loadItems();
  }, []);
  useEffect(() => {
    const loadWhitelist = async () => {
      setLoadingWhitelist(true);
      try {
        const list = await apiService.getWhitelistedEmails();
        setWhitelist(Array.isArray(list) ? list : []);
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load whitelisted emails');
      } finally {
        setLoadingWhitelist(false);
      }
    };
    loadWhitelist();
  }, []);

  const onUpdateWebhooks = async () => {
    if (!webhookUrl || !/^https?:\/\/.+/.test(webhookUrl)) {
      toast.error('Please enter a valid webhook URL');
      return;
    }
    setUpdatingWebhooks(true);
    try {
      await apiService.updateAllItemWebhooks(webhookUrl);
      toast.success('Webhooks updated');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update webhooks');
    } finally {
      setUpdatingWebhooks(false);
    }
  };

  const onClearTransactionsCache = async () => {
    setClearingTxn(true);
    try {
      await apiService.clearTransactionsCache();
      toast.success('Transactions cache cleared');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to clear transactions cache');
    } finally {
      setClearingTxn(false);
    }
  };
  const onClearItemsCache = async () => {
    setClearingItems(true);
    try {
      await apiService.clearItemsCache();
      toast.success('Items cache cleared');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to clear items cache');
    } finally {
      setClearingItems(false);
    }
  };
  const onClearAccountsCache = async () => {
    setClearingAccounts(true);
    try {
      await apiService.clearAccountsCache();
      toast.success('Accounts cache cleared');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to clear accounts cache');
    } finally {
      setClearingAccounts(false);
    }
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setEditFirstName(u.first_name || '');
    setEditLastName(u.last_name || '');
    setEditEmail(u.email || '');
    setEditPassword('');
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editUser) return;
    setSavingUser(true);
    try {
      const payload: { first_name?: string; last_name?: string; email?: string; password?: string } = {};
      if (editFirstName) payload.first_name = editFirstName.trim();
      if (editLastName) payload.last_name = editLastName.trim();
      if (editEmail) payload.email = editEmail.trim();
      if (editPassword) payload.password = editPassword;
      await apiService.updateUserAdmin(editUser.id, payload);
      const list = await apiService.getUsers();
      setUsers(Array.isArray(list) ? list : []);
      setEditOpen(false);
      toast.success('User updated');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update user');
    } finally {
      setSavingUser(false);
    }
  };

  const syncUser = async (userId: number) => {
    try {
      const res = await apiService.syncUserTransactions(userId);
      const results = (res && Array.isArray((res as any).results)) ? (res as any).results : [];
      setSyncResults(results);
      setSyncOpen(true);
      const okCount = results.filter((r: any) => r?.success === true).length;
      const failCount = results.length - okCount;
      if (results.length > 0) {
        toast.success(`Sync completed: ${okCount} succeeded, ${failCount} failed`);
      } else {
        toast.success('Sync triggered');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to sync user transactions');
    }
  };

  const deleteUser = async (userId: number) => {
    const ok = window.confirm('Delete this user? This action cannot be undone.');
    if (!ok) return;
    try {
      await apiService.deleteUserAdmin(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User deleted');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete user');
    }
  };

  const deleteItem = async (itemId: string) => {
    const ok = window.confirm('Delete this Plaid item? This action cannot be undone.');
    if (!ok) return;
    try {
      await apiService.deleteAdminPlaidItem(itemId);
      const list = await apiService.getAllPlaidItemsFromDB();
      setItems(Array.isArray(list) ? list : []);
      toast.success('Item deleted');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete item');
    }
  };

  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const totalUserPages = Math.max(1, Math.ceil((users || []).length / userPageSize));
  const visibleUsers = users.slice((userPage - 1) * userPageSize, (userPage) * userPageSize);
  const [itemPage, setItemPage] = useState(1);
  const [itemPageSize, setItemPageSize] = useState(10);
  const totalItemPages = Math.max(1, Math.ceil((items || []).length / itemPageSize));
  const visibleItems = items.slice((itemPage - 1) * itemPageSize, (itemPage) * itemPageSize);
  const [wlPage, setWlPage] = useState(1);
  const [wlPageSize, setWlPageSize] = useState(10);
  const totalWlPages = Math.max(1, Math.ceil((whitelist || []).length / wlPageSize));
  const visibleWhitelist = whitelist.slice((wlPage - 1) * wlPageSize, wlPage * wlPageSize);

  useEffect(() => { setUserPage(1); }, [userPageSize]);
  useEffect(() => { setItemPage(1); }, [itemPageSize]);
  useEffect(() => { setWlPage(1); }, [wlPageSize]);

  const lockUser = async (userId: number) => {
    try {
      await apiService.lockUser(userId);
      const list = await apiService.getUsers();
      setUsers(Array.isArray(list) ? list : []);
      toast.success('User locked');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to lock user');
    }
  };

  const unlockUser = async (userId: number) => {
    try {
      await apiService.unlockUser(userId);
      const list = await apiService.getUsers();
      setUsers(Array.isArray(list) ? list : []);
      toast.success('User unlocked');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to unlock user');
    }
  };

  const onAddEmail = async () => {
    const email = addEmailValue.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Enter a valid email');
      return;
    }
    setSavingEmail(true);
    try {
      await apiService.createWhitelistedEmail(email);
      const list = await apiService.getWhitelistedEmails();
      setWhitelist(Array.isArray(list) ? list : []);
      setAddEmailOpen(false);
      setAddEmailValue('');
      toast.success('Whitelisted email added');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add whitelisted email');
    } finally {
      setSavingEmail(false);
    }
  };

  const onDeleteEmail = async (id: number) => {
    const ok = window.confirm('Delete this whitelisted email?');
    if (!ok) return;
    try {
      await apiService.deleteWhitelistedEmail(id);
      const list = await apiService.getWhitelistedEmails();
      setWhitelist(Array.isArray(list) ? list : []);
      toast.success('Whitelisted email deleted');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete whitelisted email');
    }
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <span className="text-sm text-gray-600">Update Item Webhooks</span>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://example.com/webhook"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <button
                onClick={onUpdateWebhooks}
                disabled={updatingWebhooks}
                className={`px-4 py-2 rounded-full border text-sm ${updatingWebhooks ? 'bg-gray-200 text-gray-600 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'}`}
              >
                {updatingWebhooks ? 'Updating...' : 'Update Webhooks'}
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <span className="text-sm text-gray-600">Caches</span>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-800">Transactions</span>
                <button
                  onClick={onClearTransactionsCache}
                  disabled={clearingTxn}
                  className={`px-3 py-1 rounded-full border text-xs ${clearingTxn ? 'bg-gray-200 text-gray-600 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'}`}
                >
                  {clearingTxn ? 'Clearing...' : 'Clear Cache'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-800">Items</span>
                <button
                  onClick={onClearItemsCache}
                  disabled={clearingItems}
                  className={`px-3 py-1 rounded-full border text-xs ${clearingItems ? 'bg-gray-200 text-gray-600 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'}`}
                >
                  {clearingItems ? 'Clearing...' : 'Clear Cache'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-800">Accounts</span>
                <button
                  onClick={onClearAccountsCache}
                  disabled={clearingAccounts}
                  className={`px-3 py-1 rounded-full border text-xs ${clearingAccounts ? 'bg-gray-200 text-gray-600 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'}`}
                >
                  {clearingAccounts ? 'Clearing...' : 'Clear Cache'}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Users</span>
              <div className="flex items-center space-x-3">
                <label className="text-xs text-gray-700">Rows per page</label>
                <MinimalSelect
                  size="sm"
                  value={String(userPageSize)}
                  onChange={(e) => setUserPageSize(Number(e.target.value))}
                  className="w-auto"
                >
                  {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
                </MinimalSelect>
                <div className="text-xs text-gray-700">
                  Page <span className="font-bold">{userPage}</span> of <span className="font-bold">{totalUserPages}</span>
                </div>
                <button
                  onClick={() => setUserPage(p => Math.max(1, p - 1))}
                  disabled={userPage <= 1}
                  className={`px-2 py-1 rounded-md border text-xs ${userPage <= 1 ? 'border-gray-200 text-gray-400' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Prev
                </button>
                <button
                  onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))}
                  disabled={userPage >= totalUserPages}
                  className={`px-2 py-1 rounded-md border text-xs ${userPage >= totalUserPages ? 'border-gray-200 text-gray-400' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Next
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-600">
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Last Login</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loadingUsers ? (
                    <tr>
                      <td className="px-3 py-4 text-sm text-gray-600" colSpan={5}>Loading users...</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td className="px-3 py-4 text-sm text-gray-600" colSpan={5}>No users found</td>
                    </tr>
                  ) : (
                    visibleUsers.map(u => (
                      <tr key={u.id}>
                        <td className="px-3 py-2 text-sm text-gray-900">{u.id}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : (u.username || '')}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{u.email}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {u.last_login ? formatDateTimeLocal(String(u.last_login)) : 'never'}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <div className="flex items-center space-x-3">
                            <button
                              className="text-blue-500 hover:text-blue-700"
                              onClick={() => openEdit(u)}
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              className="text-gray-600 hover:text-gray-900"
                              onClick={() => syncUser(u.id)}
                              title="Sync"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            {u.locked ? (
                              <button
                                className="text-green-600 hover:text-green-800"
                                onClick={() => unlockUser(u.id)}
                                title="Unlock"
                              >
                                <Unlock className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                className="text-yellow-600 hover:text-yellow-800"
                                onClick={() => lockUser(u.id)}
                                title="Lock"
                              >
                                <Lock className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              className="text-red-600 hover:text-red-800"
                              onClick={() => deleteUser(u.id)}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Plaid Items</span>
              <div className="flex items-center space-x-3">
                <label className="text-xs text-gray-700">Rows per page</label>
                <MinimalSelect
                  size="sm"
                  value={String(itemPageSize)}
                  onChange={(e) => setItemPageSize(Number(e.target.value))}
                  className="w-auto"
                >
                  {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
                </MinimalSelect>
                <div className="text-xs text-gray-700">
                  Page <span className="font-bold">{itemPage}</span> of <span className="font-bold">{totalItemPages}</span>
                </div>
                <button
                  onClick={() => setItemPage(p => Math.max(1, p - 1))}
                  disabled={itemPage <= 1}
                  className={`px-2 py-1 rounded-md border text-xs ${itemPage <= 1 ? 'border-gray-200 text-gray-400' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Prev
                </button>
                <button
                  onClick={() => setItemPage(p => Math.min(totalItemPages, p + 1))}
                  disabled={itemPage >= totalItemPages}
                  className={`px-2 py-1 rounded-md border text-xs ${itemPage >= totalItemPages ? 'border-gray-200 text-gray-400' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Next
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-600">
                    <th className="px-3 py-2">Institution</th>
                    <th className="px-3 py-2">User ID</th>
                    <th className="px-3 py-2">Created At</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loadingItems ? (
                    <tr>
                      <td className="px-3 py-4 text-sm text-gray-600" colSpan={4}>Loading items...</td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td className="px-3 py-4 text-sm text-gray-600" colSpan={4}>No items found</td>
                    </tr>
                  ) : (
                    visibleItems.map(it => (
                      <tr key={it.id}>
                        <td className="px-3 py-2 text-sm text-gray-900">{it.institution_name}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{it.user_id}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{formatDateTimeLocal(String(it.created_at))}</td>
                        <td className="px-3 py-2 text-sm">
                          <div className="flex items-center space-x-3">
                            <button
                              className="text-red-600 hover:text-red-800"
                              onClick={() => deleteItem(String(it.id))}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Whitelisted Emails</span>
              <div className="flex items-center space-x-3">
                <button
                  className="inline-flex items-center px-3 py-1 rounded-full border bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 text-xs"
                  onClick={() => setAddEmailOpen(true)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </button>
                <label className="text-xs text-gray-700">Rows per page</label>
                <MinimalSelect
                  size="sm"
                  value={String(wlPageSize)}
                  onChange={(e) => setWlPageSize(Number(e.target.value))}
                  className="w-auto"
                >
                  {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
                </MinimalSelect>
                <div className="text-xs text-gray-700">
                  Page <span className="font-bold">{wlPage}</span> of <span className="font-bold">{totalWlPages}</span>
                </div>
                <button
                  onClick={() => setWlPage(p => Math.max(1, p - 1))}
                  disabled={wlPage <= 1}
                  className={`px-2 py-1 rounded-md border text-xs ${wlPage <= 1 ? 'border-gray-200 text-gray-400' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Prev
                </button>
                <button
                  onClick={() => setWlPage(p => Math.min(totalWlPages, p + 1))}
                  disabled={wlPage >= totalWlPages}
                  className={`px-2 py-1 rounded-md border text-xs ${wlPage >= totalWlPages ? 'border-gray-200 text-gray-400' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Next
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-600">
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Created At</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loadingWhitelist ? (
                    <tr>
                      <td className="px-3 py-4 text-sm text-gray-600" colSpan={4}>Loading whitelisted emails...</td>
                    </tr>
                  ) : whitelist.length === 0 ? (
                    <tr>
                      <td className="px-3 py-4 text-sm text-gray-600" colSpan={4}>No whitelisted emails found</td>
                    </tr>
                  ) : (
                    visibleWhitelist.map(w => (
                      <tr key={w.id}>
                        <td className="px-3 py-2 text-sm text-gray-900">{w.id}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{w.email}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{formatDateTimeLocal(String(w.created_at))}</td>
                        <td className="px-3 py-2 text-sm">
                          <div className="flex items-center space-x-3">
                            <button
                              className="text-red-600 hover:text-red-800"
                              onClick={() => onDeleteEmail(Number(w.id))}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal
        open={editOpen}
        title="Edit User"
        onClose={() => setEditOpen(false)}
        actions={
          <>
            <button
              onClick={() => setEditOpen(false)}
              className="px-3 py-1 rounded-full border border-gray-300 text-gray-700 bg-white text-xs hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={savingUser}
              className={`px-3 py-1 rounded-full border text-xs ${savingUser ? 'bg-gray-200 text-gray-600 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'}`}
            >
              {savingUser ? 'Saving...' : 'Save'}
            </button>
          </>
        }
        size="md"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">First name</label>
            <input
              type="text"
              value={editFirstName}
              onChange={(e) => setEditFirstName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Last name</label>
            <input
              type="text"
              value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Password (optional)</label>
            <input
              type="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Leave blank to keep current"
            />
          </div>
        </div>
      </Modal>
      <Modal
        open={addEmailOpen}
        title="Add Whitelisted Email"
        onClose={() => setAddEmailOpen(false)}
        actions={
          <>
            <button
              onClick={() => setAddEmailOpen(false)}
              className="px-3 py-1 rounded-full border border-gray-300 text-gray-700 bg-white text-xs hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onAddEmail}
              disabled={savingEmail}
              className={`px-3 py-1 rounded-full border text-xs ${savingEmail ? 'bg-gray-200 text-gray-600 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'}`}
            >
              {savingEmail ? 'Saving...' : 'Save'}
            </button>
          </>
        }
        size="sm"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={addEmailValue}
              onChange={(e) => setAddEmailValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="name@example.com"
            />
          </div>
        </div>
      </Modal>
      
      <Modal
        open={syncOpen}
        title="Sync Results"
        onClose={() => setSyncOpen(false)}
        actions={
          <>
            <button
              onClick={() => setSyncOpen(false)}
              className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 bg-white text-xs"
            >
              Close
            </button>
          </>
        }
        size="md"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-600">
                <th className="px-3 py-2">Item ID</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array.isArray(syncResults) && syncResults.length > 0 ? (
                syncResults.map((r, idx) => (
                  <tr key={`${r.item_id}-${idx}`}>
                    <td className="px-3 py-2 text-sm text-gray-900">{r.item_id}</td>
                    <td className={`px-3 py-2 text-sm font-medium ${r.success ? 'text-green-600' : 'text-red-600'}`}>
                      {r.success ? 'Success' : 'Failed'}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-700">{r.error || ''}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-4 text-sm text-gray-600" colSpan={3}>No results returned</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal>
    </Layout>
  );
};
