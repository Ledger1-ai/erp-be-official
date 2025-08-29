"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useToastIntegration } from "@/lib/hooks/use-toast-integration";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { PermissionTab } from "@/components/ui/permission-denied";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Bell,
  Globe,
  Smartphone,
  Edit,
  Trash2,
  Link,
  AlertTriangle,
  Download,
  Users,
  Copy,
  CheckCircle,
  Key,
} from "lucide-react";
import { toast } from "sonner";

// Sample data
const userRoles = [
  {
    id: 1,
    name: "Super Admin",
    description: "Full system access with all permissions",
    permissions: ["dashboard", "scheduling", "inventory", "team", "analytics", "settings"],
    userCount: 1,
    color: "bg-red-500",
  },
  {
    id: 2,
    name: "Manager",
    description: "Management access to most features",
    permissions: ["dashboard", "scheduling", "inventory", "team", "analytics"],
    userCount: 3,
    color: "bg-blue-500",
  },
  {
    id: 3,
    name: "Shift Supervisor",
    description: "Access to scheduling and team management",
    permissions: ["dashboard", "scheduling", "team"],
    userCount: 5,
    color: "bg-green-500",
  },
  {
    id: 4,
    name: "Staff",
    description: "Basic dashboard access",
    permissions: ["dashboard"],
    userCount: 12,
    color: "bg-yellow-500",
  },
];

const systemUsers = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@thegraineledger.com",
    role: "Super Admin",
    status: "active",
    lastLogin: "2025-01-22 14:30",
    avatar: "",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah@thegraineledger.com",
    role: "Manager",
    status: "active",
    lastLogin: "2025-01-22 13:45",
    avatar: "",
  },
  {
    id: 3,
    name: "Mike Chen",
    email: "mike@thegraineledger.com",
    role: "Shift Supervisor",
    status: "active",
    lastLogin: "2025-01-22 12:15",
    avatar: "",
  },
  {
    id: 4,
    name: "Emma Davis",
    email: "emma@thegraineledger.com",
    role: "Staff",
    status: "inactive",
    lastLogin: "2025-01-20 18:30",
    avatar: "",
  },
];

// Toast integration data is now provided by the hook

const permissionsList = [
  { id: "dashboard", name: "Dashboard", description: "View dashboard overview" },
  { id: "scheduling", name: "Scheduling", description: "Manage staff schedules and shifts" },
  { id: "inventory", name: "Inventory", description: "Basic inventory tracking" },
  { id: "inventory:financial", name: "Inventory Financial", description: "View costs, purchase orders, financial inventory data" },
  { id: "team", name: "Team Management", description: "View team member information" },
  { id: "team:performance", name: "Team Performance", description: "View performance ratings and detailed analytics" },
  { id: "team:management", name: "Team Management Admin", description: "Add/edit/delete users, reset passwords" },
  { id: "analytics", name: "Analytics", description: "Basic analytics and reports" },
  { id: "analytics:detailed", name: "Detailed Analytics", description: "Advanced analytics with financial data" },
  { id: "settings", name: "Settings", description: "Basic system settings" },
  { id: "settings:users", name: "User Management", description: "Manage user accounts and permissions" },
  { id: "settings:system", name: "System Configuration", description: "Advanced system configuration" },
  { id: "roster", name: "Roster Management", description: "Create and manage staff rosters" },
  { id: "menu", name: "Menu Management", description: "Manage menu items and mappings" },
  { id: "robotic-fleets", name: "Robotic Fleets", description: "Manage robotic fleet operations" },
  { id: "admin", name: "Super Admin", description: "Full system administration access" },
];

export default function SettingsPage() {
  const permissions = usePermissions();
  const [selectedTab, setSelectedTab] = useState("permissions");
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  
  // Permission checks for different settings sections
  const canManageUsers = permissions.hasPermission('settings:users');
  const canAccessSystemSettings = permissions.hasPermission('settings:system');
  
  // Users state & handlers aligned with User model and /api/team
  type PermissionId = 'dashboard' | 'scheduling' | 'inventory' | 'inventory:financial' | 'team' | 'team:performance' | 'team:management' | 'analytics' | 'analytics:detailed' | 'settings' | 'settings:users' | 'settings:system' | 'roster' | 'menu' | 'robotic-fleets' | 'admin';
  interface ManagedUser {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    permissions?: PermissionId[];
    isFirstLogin?: boolean;
    mustChangePassword?: boolean;
    lastLogin?: string;
    avatar?: string;
  }
  interface CreateUserData {
    name: string;
    email: string;
    role: string;
    permissions?: PermissionId[];
    isActive: boolean;
    mustChangePassword: boolean;
  }

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [showTempPassword, setShowTempPassword] = useState(false);
  const [newUser, setNewUser] = useState<CreateUserData>({
    name: "",
    email: "",
    role: "",
    permissions: [],
    isActive: true,
    mustChangePassword: true,
  });

  async function fetchUsers() {
    try {
      setLoadingUsers(true);
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
      const response = await fetch('/api/team', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) throw new Error('Failed to load users');
      const data = await response.json();
      setUsers(data?.data?.users || []);
    } catch (e) {
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    if (selectedTab === 'users') {
      fetchUsers();
    }
  }, [selectedTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newUser),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Failed to create user');
      setUsers([data.data.user, ...users]);
      setTemporaryPassword(data.data.temporaryPassword);
      setShowTempPassword(true);
      setIsCreateUserOpen(false);
      setNewUser({ name: "", email: "", role: "", permissions: [], isActive: true, mustChangePassword: true });
      toast.success("User created successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
      const response = await fetch('/api/team', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id: selectedUser._id,
          name: selectedUser.name,
          email: selectedUser.email,
          role: selectedUser.role,
          permissions: selectedUser.permissions || [],
          isActive: selectedUser.isActive,
          mustChangePassword: selectedUser.mustChangePassword ?? false,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Failed to update user');
      setUsers(users.map(u => (u._id === selectedUser._id ? data.data.user : u)));
      setIsEditUserOpen(false);
      setSelectedUser(null);
      toast.success("User updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
      const response = await fetch(`/api/team/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Failed to reset password');
      setTemporaryPassword(data.data.temporaryPassword);
      setShowTempPassword(true);
      toast.success("Password reset successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset password');
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
      const response = await fetch(`/api/team?id=${userId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || 'Failed to deactivate user');
      }
      setUsers(users.map(u => (u._id === userId ? { ...u, isActive: false } : u)));
      toast.success("User deactivated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to deactivate user');
    }
  };

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    }
  };
  
  const { 
    integrationStatus: toastIntegration, 
    restaurants,
    selectedRestaurant,
    setSelectedRestaurant,
    testConnection,
    performFullSync 
  } = useToastIntegration();

  const [sevenShiftsSyncing, setSevenShiftsSyncing] = useState(false);

  const handle7ShiftsSync = async () => {
    setSevenShiftsSyncing(true);
    try {
      const response = await fetch('/api/7shifts/sync', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        toast.success("7shifts sync completed successfully!");
      } else {
        toast.error(`7shifts sync failed: ${data.error}`);
      }
    } catch (error) {
      toast.error("An error occurred during the 7shifts sync.");
    } finally {
      setSevenShiftsSyncing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-1">Configure permissions, integrations, and system settings</p>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className={`grid w-full grid-cols-${2 + (canManageUsers ? 1 : 0) + (canAccessSystemSettings ? 1 : 0)}`}>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            {canManageUsers && <TabsTrigger value="users">Users</TabsTrigger>}
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            {canAccessSystemSettings && <TabsTrigger value="system">System</TabsTrigger>}
          </TabsList>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                                                    <h2 className="text-xl font-semibold text-foreground">Role Management</h2>
                  <p className="text-muted-foreground text-sm">Define roles and their permissions</p>
              </div>
              <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Role</DialogTitle>
                    <DialogDescription>Define a new role with specific permissions</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role-name" className="text-right">Role Name</Label>
                      <Input id="role-name" placeholder="Enter role name" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role-description" className="text-right">Description</Label>
                      <Input id="role-description" placeholder="Describe the role" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right mt-2">Permissions</Label>
                      <div className="col-span-3 space-y-2">
                        {permissionsList.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <input type="checkbox" id={permission.id} className="rounded" />
                            <label htmlFor={permission.id} className="text-sm">
                              <span className="font-medium text-foreground">{permission.name}</span>
                              <span className="text-muted-foreground ml-2">{permission.description}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateRoleOpen(false)}>Cancel</Button>
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white">Create Role</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userRoles.map((role) => (
                <Card key={role.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${role.color}`}></div>
                        <div>
                          <CardTitle className="text-lg">{role.name}</CardTitle>
                          <CardDescription>{role.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {role.userCount === 0 && (
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Users with this role:</span>
                        <span className="font-medium text-foreground">{role.userCount}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">Permissions:</p>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map((permission) => (
                            <span key={permission} className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded">
                              {permission}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Users Tab */}
          {canManageUsers && (
            <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                                                    <h2 className="text-xl font-semibold text-foreground">User Management</h2>
                  <p className="text-muted-foreground text-sm">Manage system users and their access</p>
              </div>
              <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                <DialogTrigger asChild>
                                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>Create a new user account</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateUser} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="user-name" className="text-right">Name</Label>
                      <Input id="user-name" placeholder="Full name" className="col-span-3" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="user-email" className="text-right">Email</Label>
                      <Input id="user-email" type="email" placeholder="email@example.com" className="col-span-3" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="user-role" className="text-right">Role</Label>
                      <select 
                        id="user-role" 
                        className="col-span-3 h-10 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        required
                      >
                        <option value="">Select role...</option>
                        {userRoles.map((role) => (
                          <option key={role.id} value={role.name}>{role.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right mt-2">Permissions</Label>
                      <div className="col-span-3 space-y-2">
                        {permissionsList.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              id={`perm-${permission.id}`} 
                              checked={newUser.permissions?.includes(permission.id as any) || false}
                              onChange={(e) => {
                                const set = new Set(newUser.permissions);
                                if (e.target.checked) set.add(permission.id as any); else set.delete(permission.id as any);
                                setNewUser({ ...newUser, permissions: Array.from(set) as any });
                              }}
                              className="rounded"
                            />
                            <label htmlFor={`perm-${permission.id}`} className="text-sm">
                              <span className="font-medium text-foreground">{permission.name}</span>
                              <span className="text-muted-foreground ml-2">{permission.description}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Require password change</Label>
                      <div className="col-span-3">
                        <label className="inline-flex items-center space-x-2">
                          <input type="checkbox" checked={newUser.mustChangePassword} onChange={(e) => setNewUser({ ...newUser, mustChangePassword: e.target.checked })} />
                          <span className="text-sm text-muted-foreground">User must change password on first login</span>
                        </label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateUserOpen(false)}>Cancel</Button>
                      <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">Add User</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingUsers ? (
                      <TableRow>
                        <TableCell colSpan={6}>Loading users...</TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6}>No users found</TableCell>
                      </TableRow>
                    ) : users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={user.avatar || ''} alt={user.name} />
                              <AvatarFallback className="bg-orange-600 text-white">
                                {user.name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded">
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {user.isActive ? 'active' : 'inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => { setSelectedUser(user); setIsEditUserOpen(true); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleResetPassword(user._id)}>
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" disabled={!user.isActive} onClick={() => handleDeactivateUser(user._id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Edit User Dialog */}
            <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                </DialogHeader>
                {selectedUser && (
                  <form onSubmit={handleUpdateUser} className="grid gap-4 py-2">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Name</Label>
                      <Input className="col-span-3" value={selectedUser.name} onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Email</Label>
                      <Input className="col-span-3" type="email" value={selectedUser.email} onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Role</Label>
                      <select 
                        className="col-span-3 h-10 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                        value={selectedUser.role}
                        onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                      >
                        {userRoles.map((role) => (
                          <option key={role.id} value={role.name}>{role.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right mt-2">Permissions</Label>
                      <div className="col-span-3 space-y-2">
                        {permissionsList.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`edit-perm-${permission.id}`}
                              checked={(selectedUser.permissions || []).includes(permission.id as any)}
                              onChange={(e) => {
                                const set = new Set(selectedUser.permissions || []);
                                if (e.target.checked) set.add(permission.id as any); else set.delete(permission.id as any);
                                setSelectedUser({ ...selectedUser, permissions: Array.from(set) as any });
                              }}
                              className="rounded"
                            />
                            <label htmlFor={`edit-perm-${permission.id}`} className="text-sm">
                              <span className="font-medium text-foreground">{permission.name}</span>
                              <span className="text-muted-foreground ml-2">{permission.description}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Active</Label>
                      <div className="col-span-3">
                        <label className="inline-flex items-center space-x-2">
                          <input type="checkbox" checked={selectedUser.isActive} onChange={(e) => setSelectedUser({ ...selectedUser, isActive: e.target.checked })} />
                          <span className="text-sm text-muted-foreground">User can sign in</span>
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Require password change</Label>
                      <div className="col-span-3">
                        <label className="inline-flex items-center space-x-2">
                          <input type="checkbox" checked={selectedUser.mustChangePassword || false} onChange={(e) => setSelectedUser({ ...selectedUser, mustChangePassword: e.target.checked })} />
                          <span className="text-sm text-muted-foreground">User must change password on next login</span>
                        </label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsEditUserOpen(false)}>Cancel</Button>
                      <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">Save Changes</Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>

            {/* Temporary Password Dialog */}
            <Dialog open={showTempPassword} onOpenChange={setShowTempPassword}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Temporary Password</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Share this temporary password securely. The user will be required to change it on first login.</p>
                  <div className="flex items-center space-x-2 p-3 bg-gray-100 rounded-lg">
                    <code className="flex-1 text-sm font-mono">{temporaryPassword}</code>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(temporaryPassword)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button className="w-full" onClick={() => setShowTempPassword(false)}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Done
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </TabsContent>
          )}

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <div>
                              <h2 className="text-xl font-semibold text-foreground">System Integrations</h2>
                <p className="text-muted-foreground text-sm">Manage external system connections</p>
            </div>

            {/* Toast Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-2">
                      <Smartphone className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <CardTitle>Toast POS Integration</CardTitle>
                      <CardDescription>Sync team members and roles from Toast</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      toastIntegration.status === "connected" ? "bg-green-100 text-green-700" : 
                      toastIntegration.status === "connecting" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {toastIntegration.status === "connecting" ? "Connecting..." : toastIntegration.status}
                    </span>
                    {toastIntegration.status === "connected" ? (
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => performFullSync()}
                          disabled={toastIntegration.isLoading}
                        >
                          {toastIntegration.isLoading ? "Syncing..." : "Sync from Toast"}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={async () => {
                            if (selectedRestaurant) {
                              await fetch(`/api/toast/employees/clear?restaurantGuid=${selectedRestaurant}`, { method: 'POST' });
                              await performFullSync();
                            }
                          }}
                          disabled={toastIntegration.isLoading}
                          className="text-red-600 hover:text-red-700"
                        >
                          Clear & Re-sync
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={testConnection}
                        disabled={toastIntegration.isLoading}
                      >
                        {toastIntegration.isLoading ? "Connecting..." : "Connect"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Last Sync</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{toastIntegration.lastSync}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Employees Imported</Label>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{toastIntegration.employeesImported} employees</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Connected Restaurants</Label>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{restaurants.length} restaurants</p>
                  </div>
                </div>
                
                {/* Restaurant Selection */}
                {restaurants.length > 0 && (
                  <div className="space-y-2">
                    <Label>Active Restaurant</Label>
                    <select 
                      value={selectedRestaurant || ''} 
                      onChange={(e) => {
                        console.log('Restaurant selected:', e.target.value);
                        setSelectedRestaurant(e.target.value);
                      }}
                      className="w-full p-2 border rounded-md"
                    >
                      {restaurants.map((restaurant) => (
                        <option key={restaurant.guid} value={restaurant.guid}>
                          {restaurant.restaurantName} - {restaurant.locationName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Error Display */}
                {toastIntegration.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <p className="text-sm text-red-800">{toastIntegration.error}</p>
                    </div>
                  </div>
                )}
                <div className="mt-4 space-y-3">
                  <div>
                    <Label>API Key</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input value={toastIntegration.apiKey} type="password" readOnly />
                      <Button variant="outline" size="sm">
                        Update
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Webhook URL</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input value={toastIntegration.webhookUrl} readOnly />
                      <Button variant="outline" size="sm">
                        <Link className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    Sync Now
                  </Button>
                  <Button variant="outline">
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 7shifts Integration */}
            <div className="border p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">7shifts</h3>
                  <p className="text-sm text-gray-600">
                    Syncs schedules for on-time rate calculation.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handle7ShiftsSync}
                    disabled={sevenShiftsSyncing}
                  >
                    {sevenShiftsSyncing ? "Syncing..." : "Sync from 7shifts"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Other Integrations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 rounded-lg p-2">
                      <Bell className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Notification Services</CardTitle>
                      <CardDescription>Email and SMS notifications</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Configure Notifications
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 rounded-lg p-2">
                      <Globe className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>API Access</CardTitle>
                      <CardDescription>External API integrations</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Manage API Keys
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          {canAccessSystemSettings && (
            <TabsContent value="system" className="space-y-6">
            <div>
                                              <h2 className="text-xl font-semibold text-foreground">System Configuration</h2>
                <p className="text-muted-foreground text-sm">General system settings and preferences</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Basic system configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="business-name">Business Name</Label>
                    <Input id="business-name" defaultValue="The Graine Ledger" />
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <select 
                      id="timezone" 
                      className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      defaultValue="UTC-5 (Eastern Time)"
                    >
                      <option>UTC-5 (Eastern Time)</option>
                      <option>UTC-6 (Central Time)</option>
                      <option>UTC-7 (Mountain Time)</option>
                      <option>UTC-8 (Pacific Time)</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <select 
                      id="currency" 
                      className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      defaultValue="USD ($)"
                    >
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                      <option>GBP (£)</option>
                      <option>CAD (C$)</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Security and authentication options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                                                                      <p className="font-medium text-foreground">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                                                                      <p className="font-medium text-foreground">Session Timeout</p>
                        <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                    </div>
                    <select 
                      className="h-8 px-2 py-1 border border-input rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      defaultValue="1 hour"
                    >
                      <option>30 minutes</option>
                      <option>1 hour</option>
                      <option>2 hours</option>
                      <option>Never</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                                                                      <p className="font-medium text-foreground">Password Requirements</p>
                        <p className="text-sm text-muted-foreground">Minimum password complexity</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data & Backup</CardTitle>
                  <CardDescription>Data management and backup settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                                                                      <p className="font-medium text-foreground">Automatic Backup</p>
                        <p className="text-sm text-muted-foreground">Daily system backup</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      Enabled
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                                                                      <p className="font-medium text-foreground">Data Retention</p>
                        <p className="text-sm text-muted-foreground">Keep data for 7 years</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Export All Data
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>Current system status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Version:</span>
                                            <span className="font-medium text-foreground">v2.1.0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Last Update:</span>
                                            <span className="font-medium text-foreground">2025-01-15</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Database:</span>
                                            <span className="font-medium text-foreground">MongoDB 7.0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Uptime:</span>
                                            <span className="font-medium text-foreground">15 days, 6 hours</span>
                  </div>
                  <Button variant="outline" className="w-full">
                    Check for Updates
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 