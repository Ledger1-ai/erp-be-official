"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
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

const toastSync = {
  lastSync: "2025-01-22 14:30",
  syncStatus: "success",
  employeesImported: 24,
  newEmployees: 2,
  updatedProfiles: 3,
  errors: 0,
};

export default function TeamPage() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<typeof teamMembers[0] | null>(null);

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.department.toLowerCase().includes(searchTerm.toLowerCase())
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
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Now
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
                    <p className="text-2xl font-bold text-foreground">{teamMembers.length}</p>
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
                    {teamMembers
                      .sort((a, b) => b.performance.rating - a.performance.rating)
                      .slice(0, 5)
                      .map((member, index) => (
                        <div key={member.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-orange-600 rounded-full w-8 h-8 flex items-center justify-center text-white text-sm font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.role}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-yellow-500 mr-1" />
                              <span className="text-sm font-medium">{member.performance.rating}</span>
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
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={member.avatar} alt={member.name} />
                              <AvatarFallback className="bg-orange-600 text-white">
                                {member.name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-foreground">{member.name}</div>
                              <div className="text-sm text-muted-foreground">{member.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{member.role}</TableCell>
                        <TableCell>{member.department}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className={`font-medium ${getPerformanceColor(member.performance.rating)}`}>
                              {member.performance.rating}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(member.status)}`}>
                            {member.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedMember(member)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
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
              {teamMembers.filter(m => m.status === "active").map((member) => (
                <Card key={member.id}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="bg-orange-600 text-white">
                          {member.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{member.name}</CardTitle>
                        <CardDescription>{member.role} • {member.department}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Performance Rating</p>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                                                      <span className="font-semibold text-foreground">{member.performance.rating}/5</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">On-Time Rate</p>
                        <p className="font-semibold text-foreground">{member.performance.onTimeRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Completed Shifts</p>
                        <p className="font-semibold text-foreground">{member.performance.completedShifts}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Sales Generated</p>
                        <p className="font-semibold text-foreground">${member.performance.salesGenerated.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {member.skills.map((skill, index) => (
                          <span key={index} className="px-2 py-1 text-xs rounded tag-orange">
                            {skill}
                          </span>
                        ))}
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
                    <AvatarImage src={selectedMember.avatar} alt={selectedMember.name} />
                    <AvatarFallback className="bg-orange-600 text-white">
                      {selectedMember.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle>{selectedMember.name}</DialogTitle>
                    <DialogDescription>{selectedMember.role} • {selectedMember.department}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedMember.email}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedMember.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Join Date</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedMember.joinDate}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Hourly Rate</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">${selectedMember.hourlyRate}/hour</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Skills</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedMember.skills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 text-xs rounded tag-green">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedMember(null)}>Close</Button>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">Edit Profile</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
} 