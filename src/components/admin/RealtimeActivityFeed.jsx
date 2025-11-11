import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Home, Target, MessageCircle, Eye, Zap, RefreshCw,
  Wifi, WifiOff, Circle
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function RealtimeActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastHeartbeat, setLastHeartbeat] = useState(null);
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  const MAX_ACTIVITIES = 50; // Keep only last 50 activities
  const MAX_RECONNECT_ATTEMPTS = 5;

  const getActivityIcon = (type) => {
    switch (type) {
      case 'property': return Home;
      case 'requirement': return Target;
      case 'interaction': return MessageCircle;
      default: return Eye;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'property': return 'text-blue-600 bg-blue-100';
      case 'requirement': return 'text-purple-600 bg-purple-100';
      case 'interaction': return 'text-green-600 bg-green-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const connectToStream = () => {
    try {
      setConnectionStatus('connecting');
      
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Get function URL
      const functionUrl = `${window.location.origin}/api/functions/streamActivityFeed`;
      
      // Create EventSource connection
      const eventSource = new EventSource(functionUrl, {
        withCredentials: true,
      });

      eventSource.onopen = () => {
        console.log('✅ SSE connection established');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        toast.success('Live feed connected', { duration: 2000 });
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connected':
              console.log('📡 Activity feed ready:', data.message);
              break;

            case 'activities':
              console.log('📊 New activities:', data.activities.length);
              setActivities(prev => {
                // Add new activities to the beginning
                const updated = [...data.activities, ...prev];
                // Keep only last MAX_ACTIVITIES
                return updated.slice(0, MAX_ACTIVITIES);
              });
              
              // Show notification for first activity
              if (data.activities.length > 0) {
                const first = data.activities[0];
                toast.info(`🎉 ${first.title}`, {
                  description: first.description,
                  duration: 3000,
                });
              }
              break;

            case 'heartbeat':
              setLastHeartbeat(new Date(data.timestamp));
              break;

            case 'error':
              console.error('SSE Error:', data.message);
              toast.error('Feed error', { description: data.message });
              break;

            default:
              console.log('Unknown SSE event:', data);
          }
        } catch (error) {
          console.error('Failed to parse SSE data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ SSE connection error:', error);
        setIsConnected(false);
        setConnectionStatus('error');
        
        eventSource.close();
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
          setConnectionStatus('reconnecting');
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectToStream();
          }, delay);
        } else {
          console.error('❌ Max reconnection attempts reached');
          setConnectionStatus('failed');
          toast.error('Feed disconnected', { 
            description: 'Please refresh the page',
            duration: 5000 
          });
        }
      };

      eventSourceRef.current = eventSource;

    } catch (error) {
      console.error('Failed to connect to activity feed:', error);
      setIsConnected(false);
      setConnectionStatus('error');
      toast.error('Connection failed', { description: error.message });
    }
  };

  const disconnectFromStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
    reconnectAttemptsRef.current = 0;
  };

  // Connect on mount
  useEffect(() => {
    connectToStream();

    // Cleanup on unmount
    return () => {
      disconnectFromStream();
    };
  }, []);

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <Circle className="w-2 h-2 mr-1 fill-current animate-pulse" />
            Live
          </Badge>
        );
      case 'connecting':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-300">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            Connecting...
          </Badge>
        );
      case 'reconnecting':
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-300">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            Reconnecting...
          </Badge>
        );
      case 'error':
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            <WifiOff className="w-3 h-3 mr-1" />
            Disconnected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Circle className="w-2 h-2 mr-1" />
            Offline
          </Badge>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-bold text-slate-900">Live Activity Feed</h3>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          {connectionStatus === 'failed' && (
            <Button
              onClick={connectToStream}
              size="sm"
              variant="outline"
              className="h-7"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Reconnect
            </Button>
          )}
        </div>
      </div>

      {/* Connection Info */}
      {lastHeartbeat && isConnected && (
        <div className="mb-3 text-xs text-slate-500 flex items-center gap-2">
          <Wifi className="w-3 h-3 text-green-500" />
          Last update: {format(lastHeartbeat, "HH:mm:ss")}
        </div>
      )}

      {/* Activity List */}
      <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] pr-2">
        {activities.length === 0 && (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              {isConnected ? 'Waiting for activity...' : 'Connecting to live feed...'}
            </p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {activities.map((activity, idx) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ 
                  duration: 0.3,
                  delay: idx * 0.03,
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
                className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {activity.title}
                  </p>
                  <p className="text-xs text-slate-600 truncate">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="text-xs text-slate-400">
                      {format(new Date(activity.timestamp), "HH:mm:ss")}
                    </p>
                    {activity.metadata && (
                      <>
                        {activity.metadata.brokerName && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {activity.metadata.brokerName}
                          </Badge>
                        )}
                        {activity.metadata.price && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            ₹{activity.metadata.price}
                            {activity.metadata.priceUnit === 'crores' ? 'Cr' : 'L'}
                          </Badge>
                        )}
                        {activity.metadata.urgency && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-1.5 py-0 ${
                              activity.metadata.urgency === 'High' 
                                ? 'border-red-300 text-red-700' 
                                : activity.metadata.urgency === 'Medium'
                                  ? 'border-amber-300 text-amber-700'
                                  : 'border-slate-300 text-slate-700'
                            }`}
                          >
                            {activity.metadata.urgency}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                {/* New indicator for first 3 items */}
                {idx < 3 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex-shrink-0"
                  >
                    <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0 text-xs">
                      NEW
                    </Badge>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Activity Counter */}
      {activities.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">
            Showing {activities.length} recent {activities.length === 1 ? 'activity' : 'activities'}
          </p>
        </div>
      )}
    </div>
  );
}