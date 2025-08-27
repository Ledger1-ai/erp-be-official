"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, MapPin, Workflow, TestTube } from "lucide-react";
import RobotDashboard from "@/components/robotic-fleets/robot-dashboard";
import RobotMapView from "@/components/robotic-fleets/robot-map-view";
import WorkflowCreator from "@/components/robotic-fleets/workflow-creator";
import APITest from "@/components/robotic-fleets/api-test";

export default function RoboticFleetsPage() {
  const [selectedTab, setSelectedTab] = useState("dashboard");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Robotic Fleets</h1>
            <p className="text-muted-foreground mt-1">Monitor and control your autonomous robot fleet</p>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="map-view" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Fleet & Map
            </TabsTrigger>
            <TabsTrigger value="workflows" className="flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              Workflow Creator
            </TabsTrigger>
            <TabsTrigger value="api-test" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              API Test
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <RobotDashboard />
          </TabsContent>

          <TabsContent value="map-view" className="space-y-4">
            <RobotMapView />
          </TabsContent>

          <TabsContent value="workflows" className="space-y-4">
            <WorkflowCreator />
          </TabsContent>

          <TabsContent value="api-test" className="space-y-4">
            <APITest />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}