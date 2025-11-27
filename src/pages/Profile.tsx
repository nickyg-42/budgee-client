import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { User, Mail, Calendar, Shield, AtSign } from 'lucide-react';
import { formatDate } from '../utils/formatters';

export const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Please log in to view your profile.</p>
        </div>
      </Layout>
    );
  }

  return (
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
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Full Name</p>
                    <p className="text-gray-900">{user.first_name} {user.last_name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <AtSign className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Username</p>
                    <p className="text-gray-900">{user.username}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email Address</p>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Member Since</p>
                    <p className="text-gray-900">{formatDate(user.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-pink-600" />
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
                  <p className="text-2xl font-bold text-pink-500">0</p>
                  <p className="text-sm text-gray-600">Connected Accounts</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-pink-500">0</p>
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
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <p className="font-medium text-gray-900">Update Profile</p>
                  <p className="text-sm text-gray-600">Change your name or email address</p>
                </button>
                
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <p className="font-medium text-gray-900">Change Password</p>
                  <p className="text-sm text-gray-600">Update your account password</p>
                </button>
                
                <button className="w-full text-left p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                  <p className="font-medium text-red-600">Delete Account</p>
                  <p className="text-sm text-red-600">Permanently delete your account and data</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};