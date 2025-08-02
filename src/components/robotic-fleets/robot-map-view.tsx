"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  MapPin,
  Battery,
  Wifi,
  Navigation,
  Target,
  RefreshCw,
  Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";

interface RobotStatus {
  id: string;
  name: string;
  status: 'active' | 'charging' | 'maintenance' | 'idle';
  battery: number;
  position: { x: number; y: number; z?: number };
  signal: number;
  task: string;
  uptime: string;
  lastUpdate: string;
  heading?: number;
  destination?: string; // Real destination from Bear Cloud API
  location?: string; // Current location description
}

// Mock facility layout and robot positions
const facilityMap = {
  width: 800,
  height: 600,
  zones: [
    { id: "zone-a", name: "Zone A", x: 50, y: 50, width: 200, height: 150, color: "#e3f2fd" },
    { id: "zone-b", name: "Zone B", x: 300, y: 50, width: 200, height: 150, color: "#f3e5f5" },
    { id: "zone-c", name: "Zone C", x: 550, y: 50, width: 200, height: 150, color: "#e8f5e8" },
    { id: "charging", name: "Charging Station", x: 50, y: 250, width: 100, height: 100, color: "#fff3e0" },
    { id: "maintenance", name: "Maintenance Bay", x: 200, y: 250, width: 150, height: 100, color: "#ffebee" },
    { id: "storage", name: "Storage", x: 400, y: 250, width: 200, height: 150, color: "#f5f5f5" },
  ],
  obstacles: [
    { x: 650, y: 250, width: 80, height: 80 },
    { x: 370, y: 220, width: 60, height: 60 },
  ]
};

// Initial empty state - robots will be loaded from API
const initialRobots: RobotStatus[] = [];

export default function RobotMapView() {
  const [robots, setRobots] = useState<RobotStatus[]>(initialRobots);
  const [selectedRobot, setSelectedRobot] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [showPaths, setShowPaths] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Load robots on component mount
  useEffect(() => {
    loadRobots();
    
    // Set up periodic refresh every 5 seconds for real-time tracking
    const interval = setInterval(loadRobots, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadRobots = async () => {
    try {
      console.log('🗺️ Loading robots for map view...');
      const response = await fetch('/api/robots');
      const result = await response.json();
      
      if (result.success) {
        setRobots(result.data || []);
        setIsConnected(true);
        console.log('✅ Successfully loaded robots for map:', result.data?.length || 0);
      } else {
        setRobots([]);
        setIsConnected(false);
        console.warn('⚠️ No robots found for map:', result.message);
      }
    } catch (error) {
      console.error('❌ Failed to load robots for map:', error);
      setRobots([]);
      setIsConnected(false);
      toast.error('Failed to load robot positions');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "#22c55e";
      case "charging": return "#3b82f6";
      case "maintenance": return "#ef4444";
      case "idle": return "#eab308";
      default: return "#6b7280";
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleRobotClick = (robotId: string) => {
    setSelectedRobot(selectedRobot === robotId ? null : robotId);
  };

  const getRobotIcon = (robot: RobotStatus) => {
    const size = 24;
    const color = getStatusColor(robot.status);
    
    const robotX = robot.position.x;
    const robotY = robot.position.y;
    const robotHeading = robot.heading || 0;

    return (
      <g transform={`translate(${robotX - size/2}, ${robotY - size/2})`}>
        {/* Robot body */}
        <circle
          cx={size/2}
          cy={size/2}
          r={size/2 - 2}
          fill={color}
          stroke="#ffffff"
          strokeWidth="2"
          className="cursor-pointer hover:opacity-80"
          onClick={() => handleRobotClick(robot.id)}
        />
        {/* Direction indicator */}
        <line
          x1={size/2}
          y1={size/2}
          x2={size/2 + Math.cos((robotHeading - 90) * Math.PI / 180) * (size/2 - 4)}
          y2={size/2 + Math.sin((robotHeading - 90) * Math.PI / 180) * (size/2 - 4)}
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Robot ID */}
        <text
          x={size/2}
          y={size + 12}
          textAnchor="middle"
          className="text-xs font-medium fill-foreground"
        >
          {robot.name.split(' ')[1] || robot.name}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-6">
      {/* Map Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Facility Map & Robot Positions</CardTitle>
              <CardDescription>Real-time view of all robots in your facility</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetView}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPaths(!showPaths)}
              >
                <Navigation className="h-4 w-4 mr-1" />
                {showPaths ? 'Hide' : 'Show'} Paths
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadRobots}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
            <div 
              ref={mapRef}
              className="relative"
              style={{ 
                transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                transformOrigin: 'top left'
              }}
            >
              <svg
                width={facilityMap.width}
                height={facilityMap.height}
                className="block"
                viewBox={`0 0 ${facilityMap.width} ${facilityMap.height}`}
              >
                {/* Background grid */}
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Facility zones */}
                {facilityMap.zones.map((zone) => (
                  <g key={zone.id}>
                    <rect
                      x={zone.x}
                      y={zone.y}
                      width={zone.width}
                      height={zone.height}
                      fill={zone.color}
                      stroke="#94a3b8"
                      strokeWidth="2"
                      rx="8"
                    />
                    <text
                      x={zone.x + zone.width / 2}
                      y={zone.y + 20}
                      textAnchor="middle"
                      className="text-sm font-semibold fill-gray-700"
                    >
                      {zone.name}
                    </text>
                  </g>
                ))}

                {/* Obstacles */}
                {facilityMap.obstacles.map((obstacle, index) => (
                  <rect
                    key={index}
                    x={obstacle.x}
                    y={obstacle.y}
                    width={obstacle.width}
                    height={obstacle.height}
                    fill="#64748b"
                    stroke="#475569"
                    strokeWidth="2"
                    rx="4"
                  />
                ))}

                {/* Robot paths - TODO: Implement path tracking from Bear Cloud API */}
                {showPaths && robots.map((robot) => {
                  // For now, create a simple path visualization
                  const currentPos = robot.position;
                  const pathPoints = [
                    currentPos,
                    { x: currentPos.x + 50, y: currentPos.y },
                    { x: currentPos.x + 100, y: currentPos.y + 25 },
                  ];
                  
                  return (
                    <g key={`path-${robot.id}`}>
                      <polyline
                        points={pathPoints.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="none"
                        stroke={getStatusColor(robot.status)}
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        opacity="0.6"
                      />
                      {/* Path waypoints */}
                      {pathPoints.map((point, index) => (
                        <circle
                          key={index}
                          cx={point.x}
                          cy={point.y}
                          r="3"
                          fill={getStatusColor(robot.status)}
                          opacity="0.8"
                        />
                      ))}
                    </g>
                  );
                })}

                {/* Robots */}
                {robots.map((robot) => getRobotIcon(robot))}

                {/* Selection highlight */}
                {selectedRobot && robots.find(r => r.id === selectedRobot) && (
                  <circle
                    cx={robots.find(r => r.id === selectedRobot)!.position.x}
                    cy={robots.find(r => r.id === selectedRobot)!.position.y}
                    r="20"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeDasharray="8,4"
                    className="animate-pulse"
                  />
                )}
              </svg>
            </div>
          </div>

          {/* Map Info */}
          <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
            <span>Zoom: {Math.round(zoomLevel * 100)}% | Click on robots to select them</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{isConnected ? 'Live Tracking' : 'Disconnected'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Robot Details Panel */}
      {selectedRobot && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              {robots.find(r => r.id === selectedRobot)?.name} Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const robot = robots.find(r => r.id === selectedRobot);
              if (!robot) return null;
              
              return (
                <div className="space-y-4">
                  {/* Robot Header with Image */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src="/servi.webp"
                          alt="Servi Robot"
                          width={64}
                          height={64}
                          className="rounded-lg object-cover"
                        />
                        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${getStatusColor(robot.status)} border-2 border-white`}></div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{robot.name}</h3>
                        <p className="text-sm text-muted-foreground">{robot.id}</p>
                        <Badge style={{ backgroundColor: getStatusColor(robot.status) }} className="text-white text-xs mt-1">
                          {robot.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Compact Info Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Battery & Signal */}
                    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                      <h4 className="font-medium text-sm">Systems</h4>
                      <div className="flex items-center gap-2 text-sm">
                        <Battery className="h-4 w-4 text-green-600" />
                        <span>Battery: {robot.battery}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Wifi className="h-4 w-4 text-blue-600" />
                        <span>Signal: {robot.signal}%</span>
                      </div>
                    </div>

                    {/* Location & Task */}
                    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                      <h4 className="font-medium text-sm">Location & Task</h4>
                      {(robot as any).location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span className="truncate">{(robot as any).location}</span>
                        </div>
                      )}
                      {(robot as any).destination && (
                        <div className="flex items-center gap-2 text-sm">
                          <Navigation className="h-4 w-4 text-blue-600" />
                          <span className="truncate">→ {(robot as any).destination}</span>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground truncate">Task: {robot.task}</p>
                    </div>
                  </div>

                  {/* Position Info */}
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Map Position (Simulated):</span>
                      <span>({Math.round(robot.position.x)}, {Math.round(robot.position.y)}) • {robot.heading || 0}°</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Fleet Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-sm">Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-sm">Charging</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm">Maintenance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span className="text-sm">Idle</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}