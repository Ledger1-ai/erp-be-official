"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useToastIntegration } from "@/lib/hooks/use-toast-integration";
import { useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  Plus,
  Search,
  Filter,
  Star,
  Clock,
  DollarSign,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  TrendingUp,
  UserPlus,
  Smartphone,
  RefreshCw,
} from "lucide-react";

// Sample data
const teamMembers = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Head Chef",
    department: "Kitchen",
    email: "sarah@thegraineledger.com",
    phone: "(555) 123-4567",
    avatar: "",
    status: "active",
    joinDate: "2023-01-15",
    lastLogin: "2025-01-22 14:30",
    performance: {
      rating: 4.9,
      completedShifts: 156,
      onTimeRate: 98,
      customerRating: 4.8,
      salesGenerated: 125000,
    },
    skills: ["Kitchen Management", "Inventory", "Training", "Menu Development"],
    availability: "Full-time",
    hourlyRate: 28.50,
    toastId: "TOAST_EMP_001",
  },
  {
    id: 2,
    name: "Mike Chen",
    role: "Sous Chef",
    department: "Kitchen",
    email: "mike@thegraineledger.com",
    phone: "(555) 234-5678",
    avatar: "",
    status: "active",
    joinDate: "2023-03-20",
    lastLogin: "2025-01-22 13:45",
    performance: {
      rating: 4.7,
      completedShifts: 142,
      onTimeRate: 95,
      customerRating: 4.6,
      salesGenerated: 95000,
    },
    skills: ["Food Prep", "Line Cooking", "Plating", "Inventory"],
    availability: "Full-time",
    hourlyRate: 22.00,
    toastId: "TOAST_EMP_002",
  },
  {
    id: 3,
    name: "Emma Davis",
    role: "Server",
    department: "Front of House",
    email: "emma@thegraineledger.com",
    phone: "(555) 345-6789",
    avatar: "",
    status: "active",
    joinDate: "2023-06-10",
    lastLogin: "2025-01-22 12:15",
    performance: {
      rating: 4.8,
      completedShifts: 128,
      onTimeRate: 97,
      customerRating: 4.9,
      salesGenerated: 78000,
    },
    skills: ["Customer Service", "POS Systems", "Wine Knowledge"],
    availability: "Part-time",
    hourlyRate: 18.50,
    toastId: "TOAST_EMP_003",
  },
  {
    id: 4,
    name: "Alex Rivera",
    role: "Bartender",
    department: "Bar",
    email: "alex@thegraineledger.com",
    phone: "(555) 456-7890",
    avatar: "",
    status: "active",
    joinDate: "2023-08-01",
    lastLogin: "2025-01-21 18:30",
    performance: {
      rating: 4.6,
      completedShifts: 118,
      onTimeRate: 93,
      customerRating: 4.7,
      salesGenerated: 65000,
    },
    skills: ["Mixology", "Customer Service", "Inventory", "Cash Handling"],
    availability: "Full-time",
    hourlyRate: 20.00,
    toastId: "TOAST_EMP_004",
  },
  {
    id: 5,
    name: "Jessica Wong",
    role: "Server",
    department: "Front of House",
    email: "jessica@thegraineledger.com",
    phone: "(555) 567-8901",
    avatar: "",
    status: "inactive",
    joinDate: "2023-11-15",
    lastLogin: "2025-01-18 16:45",
    performance: {
      rating: 4.5,
      completedShifts: 89,
      onTimeRate: 91,
      customerRating: 4.4,
      salesGenerated: 42000,
    },
    skills: ["Customer Service", "Table Management"],
    availability: "Part-time",
    hourlyRate: 17.50,
    toastId: "TOAST_EMP_005",
  },
];

const departmentStats = [
  { name: "Kitchen", members: 8, avgRating: 4.7, totalSales: 445000 },
  { name: "Front of House", members: 12, avgRating: 4.6, totalSales: 320000 },
  { name: "Bar", members: 4, avgRating: 4.8, totalSales: 185000 },
  { name: "Management", members: 3, avgRating: 4.9, totalSales: 0 },
];

// Toast sync data is now provided by the hook

export default function TeamPage() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<any>(null);
  
  const { 
    syncStatus: toastSync, 
    employees,
    syncEmployees,
    deleteEmployeeLocally,
    selectedRestaurant,
    setSelectedRestaurant,
    isAuthenticated,
    isLoading: toastLoading,
    restaurants,
    checkAuthStatus
  } = useToastIntegration();
  
  // Auto-load employees when component mounts if authenticated
  useEffect(() => {
    if (isAuthenticated && selectedRestaurant) {
      console.log('Team page auto-loading employees for restaurant:', selectedRestaurant);
    }
  }, [isAuthenticated, selectedRestaurant]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // Use real Toast employee data instead of dummy data
  const employeeData = employees || [];
  
  const filteredMembers = employeeData.filter((employee: any) =>
    (employee.firstName + ' ' + employee.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.jobTitles?.[0]?.title || 'Employee').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    return status === "active" ? "tag-green" : "tag-red";
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 4.0) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
            <p className="text-muted-foreground mt-1">Manage your team members, track performance, and sync with Toast</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Smartphone className="mr-2 h-4 w-4" />
              Sync from Toast
            </Button>
            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
              <DialogTrigger asChild>
                                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Team Member</DialogTitle>
                  <DialogDescription>Add a new member to your team</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="member-name">Full Name</Label>
                      <Input id="member-name" placeholder="Enter full name" />
                    </div>
                    <div>
                      <Label htmlFor="member-email">Email</Label>
                      <Input id="member-email" type="email" placeholder="email@example.com" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="member-role">Role</Label>
                      <select 
                        id="member-role" 
                        className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                        defaultValue=""
                      >
                        <option value="">Select role...</option>
                        <option>Head Chef</option>
                        <option>Sous Chef</option>
                        <option>Line Cook</option>
                        <option>Server</option>
                        <option>Bartender</option>
                        <option>Host/Hostess</option>
                        <option>Manager</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="member-department">Department</Label>
                      <select 
                        id="member-department" 
                        className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                        defaultValue=""
                      >
                        <option value="">Select department...</option>
                        <option>Kitchen</option>
                        <option>Front of House</option>
                        <option>Bar</option>
                        <option>Management</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="member-phone">Phone</Label>
                      <Input id="member-phone" placeholder="(555) 123-4567" />
                    </div>
                    <div>
                      <Label htmlFor="member-rate">Hourly Rate</Label>
                      <Input id="member-rate" type="number" placeholder="0.00" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="member-availability">Availability</Label>
                    <select 
                      id="member-availability" 
                      className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      defaultValue=""
                    >
                      <option value="">Select availability...</option>
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Seasonal</option>
                      <option>On-call</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>Cancel</Button>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">Add Member</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Toast Sync Status */}
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-orange-600 rounded-full p-2">
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Toast POS Integration</h3>
                  <p className="text-muted-foreground text-sm">
                    Last sync: {toastSync.lastSync} • {toastSync.employeesImported} employees synced
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-muted-foreground font-medium">New: {toastSync.newEmployees}</span>
                    <span className="text-muted-foreground font-medium">Updated: {toastSync.updatedProfiles}</span>
                    <span className="text-green-600 font-medium">Errors: {toastSync.errors}</span>
                  </div>
                </div>
                              <Button
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => {
                  if (!selectedRestaurant) {
                    toast.error('Please connect to Toast in Settings first');
                    return;
                  }
                  syncEmployees(selectedRestaurant);
                }}
                disabled={toastSync.isLoading || !selectedRestaurant}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${toastSync.isLoading ? 'animate-spin' : ''}`} />
                {toastSync.isLoading ? 'Syncing...' : 'Sync Now'}
              </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                                      <p className="text-sm font-medium text-muted-foreground">Total Team Members</p>
                    <p className="text-2xl font-bold text-foreground">{employeeData.length}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +2 this month
                  </p>
                </div>
                <Users className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                                      <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                    <p className="text-2xl font-bold text-foreground">4.7</p>
                                      <p className="text-xs text-muted-foreground mt-1">Team performance</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                                      <p className="text-sm font-medium text-muted-foreground">On-Time Rate</p>
                    <p className="text-2xl font-bold text-foreground">95%</p>
                                      <p className="text-xs text-muted-foreground mt-1">Average attendance</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                                      <p className="text-sm font-medium text-muted-foreground">Total Sales Generated</p>
                    <p className="text-2xl font-bold text-foreground">$405K</p>
                                      <p className="text-xs text-muted-foreground mt-1">This quarter</p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Team Overview</TabsTrigger>
            <TabsTrigger value="members">Team Members</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Overview</CardTitle>
                  <CardDescription>Team distribution by department</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {departmentStats.map((dept, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                                                                                  <span className="font-medium text-foreground">{dept.name}</span>
                            <span className="text-sm text-muted-foreground">{dept.members} members</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full"
                            style={{ width: `${(dept.members / 27) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Avg Rating: {dept.avgRating}/5</span>
                          {dept.totalSales > 0 && <span>Sales: ${dept.totalSales.toLocaleString()}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>Highest rated team members</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {employeeData
                      .slice(0, 5)
                      .map((employee, index) => (
                        <div key={employee.toastGuid} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-orange-600 rounded-full w-8 h-8 flex items-center justify-center text-white text-sm font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{employee.firstName} {employee.lastName}</p>
                              <p className="text-xs text-muted-foreground">{employee.jobTitles?.[0]?.title || 'Employee'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-yellow-500 mr-1" />
                              <span className="text-sm font-medium">4.5</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage your team member profiles</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((employee) => (
                      <TableRow key={employee.toastGuid}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback className="bg-orange-600 text-white">
                                {(employee.firstName?.[0] || '') + (employee.lastName?.[0] || '')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-foreground">{employee.firstName} {employee.lastName}</div>
                              <div className="text-sm text-muted-foreground">{employee.email || 'No email'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{employee.jobTitles?.[0]?.title || 'Employee'}</TableCell>
                        <TableCell>Toast POS</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="font-medium text-green-600">4.5</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs capitalize ${employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {employee.isActive ? 'active' : 'inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedMember(employee)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setEmployeeToDelete(employee);
                                setDeleteModalOpen(true);
                              }}
                            >
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
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {employeeData.filter(emp => emp.isActive).map((employee) => (
                <Card key={employee.toastGuid}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-orange-600 text-white">
                          {(employee.firstName?.[0] || '') + (employee.lastName?.[0] || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{employee.firstName} {employee.lastName}</CardTitle>
                        <CardDescription>{employee.jobTitles?.[0]?.title || 'Employee'} • Toast POS</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Toast Employee ID</p>
                        <p className="font-semibold text-foreground text-xs">{employee.toastGuid}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-semibold text-foreground text-sm">{employee.email || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Sync</p>
                        <p className="font-semibold text-foreground text-xs">{employee.lastSyncDate ? new Date(employee.lastSyncDate).toLocaleDateString() : 'Never'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">Job Titles</p>
                      <div className="flex flex-wrap gap-1">
                        {employee.jobTitles?.map((job, index) => (
                          <span key={index} className="px-2 py-1 text-xs rounded tag-orange">
                            {job.title}
                          </span>
                        )) || <span className="text-xs text-muted-foreground">No job titles assigned</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Member Details Modal */}
        {selectedMember && (
          <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-orange-600 text-white">
                      {(selectedMember.firstName?.[0] || '') + (selectedMember.lastName?.[0] || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle>{selectedMember.firstName} {selectedMember.lastName}</DialogTitle>
                    <DialogDescription>{selectedMember.jobTitles?.[0]?.title || 'Employee'} • Toast POS</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedMember.email || 'Not provided'}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Toast Employee ID</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-mono">{selectedMember.toastGuid}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Created Date</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedMember.createdDate ? new Date(selectedMember.createdDate).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Last Sync</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedMember.lastSyncDate ? new Date(selectedMember.lastSyncDate).toLocaleDateString() : 'Never'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Job Titles</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedMember.jobTitles?.length > 0 ? 
                      selectedMember.jobTitles.map((job: any, index: number) => (
                        <span key={index} className="px-2 py-1 text-xs rounded tag-green">
                          {job.title}
                        </span>
                      )) : 
                      <span className="text-xs text-muted-foreground">No job titles assigned</span>
                    }
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${selectedMember.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {selectedMember.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedMember(null)}>Close</Button>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white" disabled>
                  Sync from Toast
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Employee Modal */}
        {employeeToDelete && (
          <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-red-100 rounded-full p-3">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <DialogTitle>Hide Employee</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to hide this employee from your team list?
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="py-4">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback className="bg-orange-600 text-white">
                        {(employeeToDelete.firstName?.[0] || '') + (employeeToDelete.lastName?.[0] || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{employeeToDelete.firstName} {employeeToDelete.lastName}</p>
                      <p className="text-sm text-muted-foreground">{employeeToDelete.jobTitles?.[0]?.title || 'Employee'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <div className="text-blue-600 mt-0.5">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-blue-800 font-medium">What happens when you hide an employee?</p>
                      <ul className="text-xs text-blue-700 mt-1 space-y-1">
                        <li>• They will be hidden from all team lists in Varuni</li>
                        <li>• They can still be synced from Toast POS</li>
                        <li>• You can unhide them later if needed</li>
                        <li>• No data is permanently deleted</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setEmployeeToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={async () => {
                    await deleteEmployeeLocally(employeeToDelete.toastGuid);
                    setDeleteModalOpen(false);
                    setEmployeeToDelete(null);
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hide Employee
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
} 