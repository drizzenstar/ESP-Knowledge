import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Edit, Shield } from "lucide-react";
import { useLocation } from "wouter";

export default function UserManagement() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [permissionData, setPermissionData] = useState({
    userId: "",
    categoryId: "",
    permissionType: "read" as "read" | "write" | "none",
  });

  // Redirect to auth page if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation('/auth');
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast, setLocation]);

  // Check admin access
  useEffect(() => {
    if (!isLoading && user && user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Admin access required for this page",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation('/');
      }, 500);
    }
  }, [user, isLoading, toast]);

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    retry: false,
  });

  const setPermissionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/permissions", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Permission updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      setShowPermissionDialog(false);
      resetPermissionForm();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update permission",
        variant: "destructive",
      });
    },
  });

  const resetPermissionForm = () => {
    setPermissionData({
      userId: "",
      categoryId: "",
      permissionType: "read",
    });
    setSelectedUser(null);
  };

  const handlePermissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissionData.userId || !permissionData.categoryId) {
      toast({
        title: "Validation Error",
        description: "Please select both user and category",
        variant: "destructive",
      });
      return;
    }

    setPermissionMutation.mutate(permissionData);
  };

  const openPermissionDialog = (targetUser?: any) => {
    if (targetUser) {
      setSelectedUser(targetUser);
      setPermissionData({ ...permissionData, userId: targetUser.id });
    }
    setShowPermissionDialog(true);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return null;
  }

  // Mock users data for demonstration (in a real app, this would come from an API)
  const mockUsers = [
    {
      id: user.id,
      name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
      email: user.email,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      lastLogin: "2 hours ago",
      status: "active",
    },
    {
      id: "user-2",
      name: "Sarah Wilson",
      email: "sarah.wilson@company.com",
      role: "user",
      profileImageUrl: null,
      lastLogin: "Yesterday",
      status: "active",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex h-screen pt-16">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                  <p className="text-gray-600">Manage user accounts and permissions</p>
                </div>
                <div className="flex space-x-3">
                  <Dialog open={showPermissionDialog} onOpenChange={(open) => {
                    if (!open) {
                      setShowPermissionDialog(false);
                      resetPermissionForm();
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => openPermissionDialog()}>
                        <Shield className="mr-2 h-4 w-4" />
                        Manage Permissions
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Manage User Permissions</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handlePermissionSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            User
                          </label>
                          <Select value={permissionData.userId} onValueChange={(value) => setPermissionData({ ...permissionData, userId: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a user" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockUsers.filter(u => u.role !== 'admin').map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name} ({user.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category
                          </label>
                          <Select value={permissionData.categoryId} onValueChange={(value) => setPermissionData({ ...permissionData, categoryId: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category: any) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Permission Type
                          </label>
                          <Select value={permissionData.permissionType} onValueChange={(value: "read" | "write" | "none") => setPermissionData({ ...permissionData, permissionType: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Access</SelectItem>
                              <SelectItem value="read">Read Only</SelectItem>
                              <SelectItem value="write">Read/Write</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowPermissionDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={setPermissionMutation.isPending}
                          >
                            Update Permission
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite User
                  </Button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categories Access</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mockUsers.map((targetUser) => (
                        <tr key={targetUser.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={targetUser.profileImageUrl || ""} alt={targetUser.name} />
                                <AvatarFallback>
                                  {targetUser.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{targetUser.name}</div>
                                <div className="text-sm text-gray-500">{targetUser.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={targetUser.role === 'admin' ? 'default' : 'secondary'}>
                              {targetUser.role === 'admin' ? 'Admin' : 'User'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {targetUser.role === 'admin' ? (
                              <span className="text-gray-400">All Categories</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline" style={{ borderColor: '#4CAF50', color: '#4CAF50' }}>Operations</Badge>
                                <Badge variant="outline" style={{ borderColor: '#FFC107', color: '#FFC107' }}>Security</Badge>
                                <span className="text-xs text-gray-400">+2 more</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{targetUser.lastLogin}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                              Active
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              {targetUser.role !== 'admin' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => openPermissionDialog(targetUser)}
                                >
                                  <Shield className="h-4 w-4 mr-1" />
                                  Permissions
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
