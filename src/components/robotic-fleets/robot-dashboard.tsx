"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, 
  Battery, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  Pause, 
  Play, 
  Square,
  RefreshCw,
  Zap,
  MapPin,
  Clock,
  TrendingUp,
  Loader2
} from "lucide-react";
import { bearCloudAPI, RobotStatus } from "@/lib/services/bear-cloud-api";
import { toast } from "react-hot-toast";

// Initial empty state while loading from API
const initialRobots: RobotStatus[] = [];

export default function RobotDashboard() {
  const [robots, setRobots] = useState<RobotStatus[]>(initialRobots);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // Fleet Statistics
  const activeRobots = robots.filter(r => r.status === "active").length;
  const totalRobots = robots.length;
  const averageBattery = totalRobots > 0 ? Math.round(robots.reduce((sum, r) => sum + r.battery, 0) / robots.length) : 0;
  const averageSignal = totalRobots > 0 ? Math.round(robots.reduce((sum, r) => sum + r.signal, 0) / robots.length) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "charging": return "bg-blue-500";
      case "maintenance": return "bg-red-500";
      case "idle": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4" />;
      case "charging": return <Zap className="h-4 w-4" />;
      case "maintenance": return <AlertTriangle className="h-4 w-4" />;
      case "idle": return <Pause className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  // Load robots on component mount
  useEffect(() => {
    loadRobots();
    
    // Set up periodic refresh every 10 seconds
    const interval = setInterval(loadRobots, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadRobots = async () => {
    try {
      console.log('🔄 Loading robots from Bear Cloud API...');
      const robotData = await bearCloudAPI.getAllRobots();
      setRobots(robotData);
      setIsConnected(true);
      console.log('✅ Successfully loaded robots:', robotData.length);
    } catch (error) {
      console.error('❌ Failed to load robots:', error);
      setIsConnected(false);
      toast.error('Failed to connect to Bear Cloud API');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRobotAction = async (robotId: string, action: string) => {
    try {
      console.log(`🎮 Executing ${action} on robot ${robotId}`);
      
      const success = await bearCloudAPI.sendRobotCommand(robotId, action);
      
      if (success) {
        toast.success(`Successfully ${action}ed robot ${robotId}`);
        // Refresh robot data after command
        setTimeout(loadRobots, 1000);
      } else {
        toast.error(`Failed to ${action} robot ${robotId}`);
      }
    } catch (error) {
      console.error(`❌ Error executing ${action} on robot ${robotId}:`, error);
      toast.error(`Error: Could not ${action} robot`);
    }
  };

  const refreshFleetData = async () => {
    setIsLoading(true);
    await loadRobots();
  };

  return (
    <div className="space-y-6">
      {/* Fleet Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Robots</p>
                <p className="text-2xl font-bold text-foreground">{activeRobots}/{totalRobots}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                <Bot className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Battery</p>
                <p className="text-2xl font-bold text-foreground">{averageBattery}%</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                <Battery className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Signal</p>
                <p className="text-2xl font-bold text-foreground">{averageSignal}%</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3">
                <Wifi className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">API Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p className="text-sm font-bold text-foreground">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3">
                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fleet Control Panel</CardTitle>
              <CardDescription>Monitor and control individual robots</CardDescription>
            </div>
            <Button 
              onClick={refreshFleetData}
              variant="outline"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && robots.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-3" />
              <span className="text-lg">Connecting to Bear Cloud API...</span>
            </div>
          ) : robots.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Robots Found</h3>
                <p className="text-muted-foreground mb-4">
                  {isConnected ? 'No robots are currently registered in your fleet.' : 'Unable to connect to Bear Cloud API.'}
                </p>
                <Button onClick={refreshFleetData} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {robots.map((robot) => (
              <Card key={robot.id} className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${getStatusColor(robot.status)} bg-opacity-20`}>
                        {getStatusIcon(robot.status)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{robot.name}</h3>
                        <p className="text-sm text-muted-foreground">{robot.id}</p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${getStatusColor(robot.status)} text-white border-none`}
                    >
                      {robot.status}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {/* Battery */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Battery</span>
                        <span className="font-medium">{robot.battery}%</span>
                      </div>
                      <Progress 
                        value={robot.battery} 
                        className="h-2"
                      />
                    </div>

                    {/* Signal Strength */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Signal</span>
                        <span className="font-medium">{robot.signal}%</span>
                      </div>
                      <Progress 
                        value={robot.signal} 
                        className="h-2"
                      />
                    </div>

                    {/* Current Task */}
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Task:</span>
                      <span className="font-medium">{robot.task}</span>
                    </div>

                    {/* Uptime */}
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Uptime:</span>
                      <span className="font-medium">{robot.uptime}</span>
                    </div>

                    {/* Position */}
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Position:</span>
                      <span className="font-medium">({robot.position.x}, {robot.position.y})</span>
                    </div>
                  </div>

                  {/* Robot Controls */}
                  <div className="flex space-x-2 mt-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRobotAction(robot.id, 'start')}
                      disabled={robot.status === 'active' || isLoading}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Start
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRobotAction(robot.id, 'pause')}
                      disabled={robot.status !== 'active' || isLoading}
                    >
                      <Pause className="h-3 w-3 mr-1" />
                      Pause
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRobotAction(robot.id, 'stop')}
                      disabled={robot.status === 'maintenance' || isLoading}
                    >
                      <Square className="h-3 w-3 mr-1" />
                      Stop
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}