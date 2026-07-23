'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  User as UserIcon,
  Key,
  Edit,
  Lock,
  Copy,
  RefreshCw,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface UserItem {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'customer';
  created_at: string;
  last_sign_in_at: string | null;
  order_count: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Edit User Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [editRole, setEditRole] = useState<'admin' | 'customer'>('customer');
  const [editName, setEditName] = useState('');
  const [updating, setUpdating] = useState(false);

  // Password Modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [recoveryLink, setRecoveryLink] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users || []);
      } else {
        toast.error(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      toast.error('Error connecting to server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Open Edit Modal
  const handleOpenEdit = (user: UserItem) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditName(user.full_name);
    setEditModalOpen(true);
  };

  // Save Edit User
  const handleSaveUser = async () => {
    if (!selectedUser) return;
    setUpdating(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: editRole,
          fullName: editName,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('User updated successfully!');
        setEditModalOpen(false);
        fetchUsers();
      } else {
        toast.error(data.error || 'Update failed');
      }
    } catch (err) {
      toast.error('Error updating user');
    } finally {
      setUpdating(false);
    }
  };

  // Open Password Modal
  const handleOpenPassword = (user: UserItem) => {
    setSelectedUser(user);
    setNewPassword('');
    setRecoveryLink('');
    setPasswordModalOpen(true);
  };

  // Set New Password directly
  const handleSetNewPassword = async () => {
    if (!selectedUser || !newPassword) return;
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setPassLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_password',
          userId: selectedUser.id,
          newPassword,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(`Password for ${selectedUser.email} updated successfully!`);
        setNewPassword('');
      } else {
        toast.error(data.error || 'Failed to update password');
      }
    } catch (err) {
      toast.error('Error setting password');
    } finally {
      setPassLoading(false);
    }
  };

  // Generate Recovery Link
  const handleGenerateRecoveryLink = async () => {
    if (!selectedUser) return;

    setPassLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_recovery',
          email: selectedUser.email,
        }),
      });

      const data = await response.json();
      if (response.ok && data.recoveryLink) {
        setRecoveryLink(data.recoveryLink);
        toast.success('Password recovery link generated!');
      } else {
        toast.error(data.error || 'Failed to generate link');
      }
    } catch (err) {
      toast.error('Error generating link');
    } finally {
      setPassLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Filter users by search
  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            User Manager
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage customer accounts, roles, and handle password resets
          </p>
        </div>

        <Button
          onClick={fetchUsers}
          variant="outline"
          size="sm"
          className="border-white/10 hover:bg-white/5 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search & Stats Card */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
          <Input
            placeholder="Search name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 h-11 focus:border-blue-500/50"
          />
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground self-start sm:self-auto">
          <span>Total Users: <strong className="text-foreground">{users.length}</strong></span>
          <span>Admins: <strong className="text-purple-400">{users.filter((u) => u.role === 'admin').length}</strong></span>
          <span>Customers: <strong className="text-blue-400">{users.filter((u) => u.role === 'customer').length}</strong></span>
        </div>
      </div>

      {/* Users Table Card */}
      <Card className="bg-background/95 backdrop-blur-xl border-white/10">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No users found matching your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-xs uppercase text-muted-foreground border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Orders</th>
                    <th className="px-6 py-4">Joined Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {user.full_name[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{user.full_name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={`text-xs px-2.5 py-0.5 font-semibold ${
                            user.role === 'admin'
                              ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                              : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {user.role === 'admin' ? (
                            <ShieldCheck className="w-3 h-3 mr-1 inline" />
                          ) : (
                            <UserIcon className="w-3 h-3 mr-1 inline" />
                          )}
                          {user.role.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium">
                        {user.order_count} {user.order_count === 1 ? 'order' : 'orders'}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="hover:bg-blue-500/10 text-blue-400"
                            onClick={() => handleOpenEdit(user)}
                            title="Edit Role & Details"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="hover:bg-purple-500/10 text-purple-400"
                            onClick={() => handleOpenPassword(user)}
                            title="Reset / Set Password"
                          >
                            <Lock className="w-4 h-4 mr-1" />
                            Password
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* EDIT USER MODAL */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-400" />
              Edit User Profile
            </DialogTitle>
            <DialogDescription>
              Update information or permissions for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Full Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">User Role</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as 'admin' | 'customer')}
                className="w-full bg-background border border-white/10 rounded-md h-10 px-3 text-sm text-foreground focus:outline-none focus:border-blue-500/50"
              >
                <option value="customer" className="bg-background text-foreground">Customer (Standard Access)</option>
                <option value="admin" className="bg-background text-foreground">Admin (Full Dashboard Control)</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={updating}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PASSWORD RESET / OVERWRITE MODAL */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="sm:max-w-lg bg-background/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-400" />
              Password Manager & Reset
            </DialogTitle>
            <DialogDescription>
              Manually set a new password or generate a recovery link for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Direct Password Reset */}
            <div className="glass rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-400" />
                Set New Password Directly
              </h4>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Enter new password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
                <Button
                  onClick={handleSetNewPassword}
                  disabled={passLoading || !newPassword}
                  className="bg-blue-600 hover:bg-blue-500 text-white shrink-0"
                >
                  Set Password
                </Button>
              </div>
            </div>

            {/* Password Recovery Link Generator */}
            <div className="glass rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-purple-400" />
                Generate Password Reset Link
              </h4>
              <p className="text-xs text-muted-foreground">
                Generates a secure 1-time recovery URL to send to the customer via Telegram/Email.
              </p>

              {recoveryLink ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-black/40 border border-purple-500/30 p-2.5 rounded-lg">
                    <code className="flex-1 text-xs font-mono text-purple-300 truncate">
                      {recoveryLink}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-purple-400 hover:bg-purple-500/20 shrink-0"
                      onClick={() => copyToClipboard(recoveryLink)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-[11px] text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Link generated! Copy and send it to the customer.
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleGenerateRecoveryLink}
                  disabled={passLoading}
                  variant="outline"
                  className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 w-full"
                >
                  {passLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Generate Recovery Link
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setPasswordModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
