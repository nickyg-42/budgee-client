import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { apiService } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { toast } from 'sonner';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [updatingWebhooks, setUpdatingWebhooks] = useState(false);
  const [recategorizing, setRecategorizing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [savingUser, setSavingUser] = useState(false);

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
    loadUsers();
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

  const onRecategorize = async () => {
    setRecategorizing(true);
    try {
      await apiService.recategorizeTransactions();
      toast.success('Recategorization triggered');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to recategorize');
    } finally {
      setRecategorizing(false);
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
      const updated = await apiService.updateUserAdmin(editUser.id, payload);
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...updated } : u));
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
      await apiService.syncUserTransactions(userId);
      toast.success('Sync triggered');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to sync user transactions');
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
                className={`px-4 py-2 rounded-md text-sm ${updatingWebhooks ? 'bg-gray-200 text-gray-600' : 'bg-blue-600 text-white'}`}
              >
                {updatingWebhooks ? 'Updating...' : 'Update Webhooks'}
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <span className="text-sm text-gray-600">Recategorize Transactions</span>
          </CardHeader>
          <CardContent>
            <button
              onClick={onRecategorize}
              disabled={recategorizing}
              className={`px-4 py-2 rounded-md text-sm ${recategorizing ? 'bg-gray-200 text-gray-600' : 'bg-blue-600 text-white'}`}
            >
              {recategorizing ? 'Recategorizing...' : 'Recategorize'}
            </button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <span className="text-sm text-gray-600">Users</span>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-600">
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loadingUsers ? (
                    <tr>
                      <td className="px-3 py-4 text-sm text-gray-600" colSpan={4}>Loading users...</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td className="px-3 py-4 text-sm text-gray-600" colSpan={4}>No users found</td>
                    </tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id}>
                        <td className="px-3 py-2 text-sm text-gray-900">{u.id}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : (u.username || '')}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{u.email}</td>
                        <td className="px-3 py-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 bg-white text-xs"
                              onClick={() => openEdit(u)}
                            >
                              Edit
                            </button>
                            <button
                              className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 bg-white text-xs"
                              onClick={() => syncUser(u.id)}
                            >
                              Sync
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
              className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 bg-white text-xs"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={savingUser}
              className={`px-3 py-1 rounded-md text-white text-xs ${savingUser ? 'bg-gray-300' : 'bg-blue-600'}`}
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
    </Layout>
  );
};
