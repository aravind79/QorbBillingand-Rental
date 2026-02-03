import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Search, 
  MoreHorizontal, 
  Shield,
  ShieldCheck,
  ShieldOff,
  Eye,
  Ban,
  KeyRound,
  Download,
  UserCog,
  Crown
} from "lucide-react";
import { formatDate } from "@/lib/helpers";

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  subscription_plan: string | null;
  subscription_status: string | null;
  created_at: string | null;
}

interface UserRole {
  user_id: string;
  role: string;
}

export default function UsersManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  // Role management state
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // User details dialog
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    checkSuperAdminAccess();
  }, [user]);

  const checkSuperAdminAccess = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'super_admin'
      });

      if (error) throw error;

      if (!data) {
        toast.error("Access denied. Super admin privileges required.");
        navigate("/");
        return;
      }

      setIsSuperAdmin(true);
      fetchUsers();
      fetchUserRoles();
    } catch (error: any) {
      toast.error("Failed to verify admin access");
      navigate("/");
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (error) throw error;
      
      // Group roles by user_id
      const rolesMap: Record<string, string[]> = {};
      (data || []).forEach((role: UserRole) => {
        if (!rolesMap[role.user_id]) {
          rolesMap[role.user_id] = [];
        }
        rolesMap[role.user_id].push(role.role);
      });
      setUserRoles(rolesMap);
    } catch (error: any) {
      console.error("Failed to fetch user roles:", error);
    }
  };

  const filteredUsers = users.filter(u => {
    const searchLower = searchQuery.toLowerCase();
    return (
      u.email?.toLowerCase().includes(searchLower) ||
      u.full_name?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case "trial":
        return <Badge className="bg-info/10 text-info border-info/20">Trial</Badge>;
      case "expired":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>;
    }
  };

  const getPlanBadge = (plan: string | null) => {
    switch (plan) {
      case "professional":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Professional</Badge>;
      case "enterprise":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Enterprise</Badge>;
      case "starter":
        return <Badge variant="secondary">Starter</Badge>;
      default:
        return <Badge variant="outline">{plan || "Free"}</Badge>;
    }
  };

  const getRoleBadges = (userId: string) => {
    const roles = userRoles[userId] || [];
    return roles.map(role => {
      switch (role) {
        case "super_admin":
          return (
            <Badge key={role} className="bg-purple-500/10 text-purple-600 border-purple-500/20">
              <Crown className="h-3 w-3 mr-1" />
              Super Admin
            </Badge>
          );
        case "admin":
          return (
            <Badge key={role} className="bg-orange-500/10 text-orange-600 border-orange-500/20">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          );
        case "staff":
          return (
            <Badge key={role} className="bg-blue-500/10 text-blue-600 border-blue-500/20">
              Staff
            </Badge>
          );
        default:
          return <Badge key={role} variant="secondary">{role}</Badge>;
      }
    });
  };

  const handleAssignRole = (profile: UserProfile) => {
    setSelectedUser(profile);
    setSelectedRole("");
    setShowRoleDialog(true);
  };

  const handleViewDetails = (profile: UserProfile) => {
    setSelectedUser(profile);
    setShowDetailsDialog(true);
  };

  const confirmAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast.error("Please select a role");
      return;
    }

    setIsProcessing(true);
    try {
      // Check if role already exists
      const existingRoles = userRoles[selectedUser.user_id] || [];
      if (existingRoles.includes(selectedRole)) {
        toast.error("User already has this role");
        setIsProcessing(false);
        return;
      }

      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: selectedUser.user_id,
          role: selectedRole as "super_admin" | "admin" | "staff" | "viewer"
        });

      if (error) throw error;

      toast.success(`${selectedRole.replace('_', ' ')} role assigned to ${selectedUser.full_name || selectedUser.email}`);
      setShowRoleDialog(false);
      fetchUserRoles();
    } catch (error: any) {
      toast.error(error.message || "Failed to assign role");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    if (role === "super_admin" && userId === user?.id) {
      toast.error("You cannot remove your own super admin role");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as "super_admin" | "admin" | "staff" | "viewer");

      if (error) throw error;

      toast.success(`${role.replace('_', ' ')} role removed`);
      fetchUserRoles();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove role");
    }
  };

  const exportUsers = () => {
    const csv = [
      ["Email", "Name", "Plan", "Status", "Roles", "Created At"].join(","),
      ...filteredUsers.map(u => [
        u.email || "",
        u.full_name || "",
        u.subscription_plan || "free",
        u.subscription_status || "unknown",
        (userRoles[u.user_id] || []).join(";"),
        u.created_at || ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Users exported successfully");
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Super Admin</h1>
                <p className="text-sm text-muted-foreground">User Management</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Exit Admin
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <button 
              onClick={() => navigate("/super-admin")}
              className="py-4 border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </button>
            <button className="py-4 border-b-2 border-primary text-primary font-medium">
              Users
            </button>
            <button 
              onClick={() => navigate("/super-admin/revenue")}
              className="py-4 border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            >
              Revenue
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>All Users ({filteredUsers.length})</CardTitle>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Button variant="outline" onClick={exportUsers}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{profile.full_name || "No name"}</p>
                              <p className="text-sm text-muted-foreground">{profile.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getPlanBadge(profile.subscription_plan)}</TableCell>
                          <TableCell>{getStatusBadge(profile.subscription_status)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {getRoleBadges(profile.user_id)}
                              {(!userRoles[profile.user_id] || userRoles[profile.user_id].length === 0) && (
                                <Badge variant="outline" className="text-muted-foreground">User</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {profile.created_at ? formatDate(profile.created_at) : "-"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(profile)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleAssignRole(profile)}>
                                  <UserCog className="h-4 w-4 mr-2" />
                                  Assign Role
                                </DropdownMenuItem>
                                {(userRoles[profile.user_id] || []).includes('super_admin') && profile.user_id !== user?.id && (
                                  <DropdownMenuItem 
                                    onClick={() => handleRemoveRole(profile.user_id, 'super_admin')}
                                    className="text-destructive"
                                  >
                                    <ShieldOff className="h-4 w-4 mr-2" />
                                    Remove Super Admin
                                  </DropdownMenuItem>
                                )}
                                {(userRoles[profile.user_id] || []).includes('admin') && (
                                  <DropdownMenuItem 
                                    onClick={() => handleRemoveRole(profile.user_id, 'admin')}
                                    className="text-destructive"
                                  >
                                    <ShieldOff className="h-4 w-4 mr-2" />
                                    Remove Admin
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <KeyRound className="h-4 w-4 mr-2" />
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Ban className="h-4 w-4 mr-2" />
                                  Suspend Account
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Assign Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Assign Role
            </DialogTitle>
            <DialogDescription>
              Assign a role to {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-purple-600" />
                      Super Admin - Full system access
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-orange-600" />
                      Admin - Manage users and settings
                    </div>
                  </SelectItem>
                  <SelectItem value="staff">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      Staff - Limited admin access
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedRole === "super_admin" && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Super Admin has full access to all system features including user management, billing, and system configuration.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAssignRole} disabled={isProcessing || !selectedRole}>
              {isProcessing ? "Assigning..." : "Assign Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {(selectedUser.full_name || selectedUser.email || "U")[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.full_name || "No name"}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Plan</p>
                  {getPlanBadge(selectedUser.subscription_plan)}
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  {getStatusBadge(selectedUser.subscription_status)}
                </div>
                <div className="p-3 bg-muted/50 rounded-lg col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Roles</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {getRoleBadges(selectedUser.user_id)}
                    {(!userRoles[selectedUser.user_id] || userRoles[selectedUser.user_id].length === 0) && (
                      <Badge variant="outline" className="text-muted-foreground">User</Badge>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Joined</p>
                  <p className="font-medium">
                    {selectedUser.created_at ? formatDate(selectedUser.created_at) : "-"}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowDetailsDialog(false);
              if (selectedUser) handleAssignRole(selectedUser);
            }}>
              <UserCog className="h-4 w-4 mr-2" />
              Manage Roles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}