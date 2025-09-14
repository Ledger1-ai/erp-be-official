"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Plus,
  Brain,
  Star,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Sample data
const teamMembers = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Head Chef",
    avatar: "",
    skills: ["Kitchen Management", "Inventory", "Training"],
    availability: "Full-time",
    rating: 4.9,
  },
  {
    id: 2,
    name: "Mike Chen",
    role: "Sous Chef",
    avatar: "",
    skills: ["Food Prep", "Line Cooking", "Plating"],
    availability: "Full-time",
    rating: 4.7,
  },
  {
    id: 3,
    name: "Emma Davis",
    role: "Server",
    avatar: "",
    skills: ["Customer Service", "POS Systems", "Wine Knowledge"],
    availability: "Part-time",
    rating: 4.8,
  },
  {
    id: 4,
    name: "Alex Rivera",
    role: "Bartender",
    avatar: "",
    skills: ["Mixology", "Customer Service", "Inventory"],
    availability: "Full-time",
    rating: 4.6,
  },
  {
    id: 5,
    name: "Jessica Wong",
    role: "Server",
    avatar: "",
    skills: ["Customer Service", "Table Management"],
    availability: "Part-time",
    rating: 4.5,
  },
];

const shifts = [
  {
    id: 1,
    date: "2025-01-22",
    startTime: "10:00",
    endTime: "18:00",
    role: "Head Chef",
    assignedTo: "Sarah Johnson",
    status: "confirmed",
  },
  {
    id: 2,
    date: "2025-01-22",
    startTime: "14:00",
    endTime: "22:00",
    role: "Sous Chef",
    assignedTo: "Mike Chen",
    status: "confirmed",
  },
  {
    id: 3,
    date: "2025-01-22",
    startTime: "17:00",
    endTime: "01:00",
    role: "Server",
    assignedTo: "Emma Davis",
    status: "pending",
  },
  {
    id: 4,
    date: "2025-01-23",
    startTime: "18:00",
    endTime: "02:00",
    role: "Bartender",
    assignedTo: "Alex Rivera",
    status: "confirmed",
  },
];

const aiRecommendations = [
  {
    type: "optimization",
    title: "Optimal Staffing Level",
    description: "Based on historical data, Thursday dinner service needs 2 additional servers.",
    priority: "high",
    action: "Add 2 servers to Thursday 17:00-23:00 shift",
  },
  {
    type: "cost_saving",
    title: "Cost Optimization",
    description: "Reduce Monday morning shift by 1 hour to save $240/week in labor costs.",
    priority: "medium",
    action: "Adjust Monday 10:00-18:00 shift to 11:00-18:00",
  },
  {
    type: "coverage",
    title: "Coverage Gap",
    description: "No experienced bartender scheduled for Saturday night rush.",
    priority: "high",
    action: "Assign Alex Rivera or find coverage",
  },
];

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const currentWeek = [22, 23, 24, 25, 26, 27, 28]; // January 2025

export default function SchedulingPage() {
  const [selectedView, setSelectedView] = useState("calendar");
  const [, setSelectedDate] = useState("2025-01-22");
  const [isCreateShiftOpen, setIsCreateShiftOpen] = useState(false);

  const getShiftsForDate = (date: string) => {
    return shifts.filter(shift => shift.date === date);
  };

  const getShiftsByRole = () => {
    const roleGroups = shifts.reduce((acc, shift) => {
      if (!acc[shift.role]) acc[shift.role] = [];
      acc[shift.role].push(shift);
      return acc;
    }, {} as Record<string, typeof shifts>);
    return roleGroups;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Scheduling</h1>
            <p className="text-muted-foreground mt-1">Manage staff schedules and optimize coverage</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Brain className="mr-2 h-4 w-4" />
              AI Optimize
            </Button>
                          <Dialog open={isCreateShiftOpen} onOpenChange={setIsCreateShiftOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Shift
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Shift</DialogTitle>
                  <DialogDescription>Add a new shift to the schedule</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">Date</Label>
                    <Input id="date" type="date" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="start-time" className="text-right">Start Time</Label>
                    <Input id="start-time" type="time" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="end-time" className="text-right">End Time</Label>
                    <Input id="end-time" type="time" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">Role</Label>
                    <select 
                      id="role" 
                      className="col-span-3 h-10 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      defaultValue=""
                    >
                      <option value="">Select role...</option>
                      <option>Head Chef</option>
                      <option>Sous Chef</option>
                      <option>Server</option>
                      <option>Bartender</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateShiftOpen(false)}>Cancel</Button>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">Create Shift</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* AI Recommendations */}
        <Card className="bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-950/20 dark:to-teal-900/20 border-teal-200 dark:border-teal-800">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-teal-600 rounded-full p-2">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-semibold text-foreground">Varuni Scheduling Insights</h3>
                  <Badge variant="warning">Coming Soon</Badge>
                </div>
                <div className="space-y-3">
                  {aiRecommendations.map((rec, index) => (
                    <div key={index} className="bg-card rounded-lg p-3 border border-border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-foreground">{rec.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              rec.priority === "high" ? "tag-red" : "tag-yellow"
                            }`}>
                              {rec.priority}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                          <p className="text-xs text-muted-foreground font-medium">{rec.action}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          Apply
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Tabs */}
        <Tabs value={selectedView} onValueChange={setSelectedView}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="team">Team View</TabsTrigger>
          </TabsList>

          {/* Calendar View */}
          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Weekly Schedule</CardTitle>
                    <CardDescription>January 22-28, 2025</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-4">
                  {daysOfWeek.map((day, index) => {
                    const date = `2025-01-${currentWeek[index]}`;
                    const dayShifts = getShiftsForDate(date);
                    
                    return (
                      <div key={day} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 min-h-[200px] bg-card">
                        <div className="font-semibold text-center mb-3">
                          <div className="text-sm text-muted-foreground">{day}</div>
                          <div className="text-lg text-foreground">{currentWeek[index]}</div>
                        </div>
                        <div className="space-y-2">
                          {dayShifts.map((shift) => (
                            <div
                              key={shift.id}
                              className={`p-2 rounded text-xs ${
                                shift.status === "confirmed" ? "tag-orange" : "tag-yellow"
                              }`}
                            >
                              <div className="font-medium">{shift.role}</div>
                              <div className="text-xs">{shift.startTime}-{shift.endTime}</div>
                              <div className="text-xs truncate">{shift.assignedTo}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Shifts</CardTitle>
                <CardDescription>Complete list of scheduled shifts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shifts.map((shift) => (
                    <div key={shift.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-card">
                      <div className="flex items-center space-x-4">
                        <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-2">
                          <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{shift.role}</div>
                          <div className="text-sm text-muted-foreground">
                            {shift.date} • {shift.startTime}-{shift.endTime}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-medium text-foreground">{shift.assignedTo}</div>
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            shift.status === "confirmed" ? "tag-green" : "tag-yellow"
                          }`}>
                            {shift.status}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team View */}
          <TabsContent value="team" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team Members */}
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage your team and their availability</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-card">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback className="bg-orange-600 text-white">
                              {member.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">{member.name}</div>
                            <div className="text-sm text-muted-foreground">{member.role}</div>
                            <div className="flex items-center mt-1">
                              <Star className="h-3 w-3 text-yellow-500 mr-1" />
                              <span className="text-xs text-muted-foreground">{member.rating}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-foreground">{member.availability}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {member.skills.slice(0, 2).map((skill, index) => (
                              <span key={index} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Shift Coverage by Role */}
              <Card>
                <CardHeader>
                  <CardTitle>Coverage by Role</CardTitle>
                  <CardDescription>Current shift assignments by position</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(getShiftsByRole()).map(([role, roleShifts]) => (
                      <div key={role} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-card">
                        <div className="font-medium mb-2 text-foreground">{role}</div>
                        <div className="space-y-2">
                          {roleShifts.map((shift) => (
                                                         <div key={shift.id} className="flex items-center justify-between text-sm text-foreground">
                              <span>{shift.date}</span>
                              <span>{shift.startTime}-{shift.endTime}</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                shift.status === "confirmed" ? "tag-green" : "tag-yellow"
                              }`}>
                                {shift.assignedTo}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 