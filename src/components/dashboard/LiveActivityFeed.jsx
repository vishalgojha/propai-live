import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap, Bell, BellOff, Volume2, VolumeX, Filter } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ActivityFeedItem from "./ActivityFeedItem";

export default function LiveActivityFeed({ 
  activities, 
  isLoading,
  lastUpdateTime 
}) {
  const [filterType, setFilterType] = useState("all");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [newActivityCount, setNewActivityCount] = useState(0);
  const previousActivitiesRef = useRef([]);
  const audioRef = useRef(null);

  // Play notification sound
  const playNotificationSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(err => console.log("Audio play failed:", err));
    }
  };

  // Detect new activities
  useEffect(() => {
    if (previousActivitiesRef.current.length === 0) {
      previousActivitiesRef.current = activities;
      return;
    }

    const newActivities = activities.filter(
      activity => !previousActivitiesRef.current.some(prev => prev.id === activity.id)
    );

    if (newActivities.length > 0) {
      setNewActivityCount(prev => prev + newActivities.length);
      
      // Show toast notification
      if (notificationsEnabled) {
        newActivities.forEach(activity => {
          toast.success("New Activity", {
            description: activity.description,
            duration: 3000,
          });
        });
      }

      // Play sound
      playNotificationSound();

      // Clear "new" badge after 5 seconds
      setTimeout(() => {
        setNewActivityCount(0);
      }, 5000);
    }

    previousActivitiesRef.current = activities;
  }, [activities, notificationsEnabled, soundEnabled]);

  // Filter activities
  const filteredActivities = filterType === "all" 
    ? activities 
    : activities.filter(a => a.type === filterType);

  // Activity type counts
  const activityCounts = {
    all: activities.length,
    property_created: activities.filter(a => a.type === 'property_created').length,
    requirement_created: activities.filter(a => a.type === 'requirement_created').length,
    whatsapp_contact: activities.filter(a => a.type === 'whatsapp_contact').length,
    property_view: activities.filter(a => a.type === 'property_view').length,
  };

  return (
    <Card className="p-6">
      {/* Hidden audio element for notifications */}
      <audio 
        ref={audioRef} 
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZWBU=" 
        preload="auto"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-bold text-slate-900">Live Activity Feed</h3>
          {newActivityCount > 0 && (
            <Badge className="bg-blue-600 text-white animate-pulse">
              +{newActivityCount} new
            </Badge>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Notifications toggle */}
          <Button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            title={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
          >
            {notificationsEnabled ? (
              <Bell className="w-4 h-4 text-blue-600" />
            ) : (
              <BellOff className="w-4 h-4 text-slate-400" />
            )}
          </Button>

          {/* Sound toggle */}
          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            title={soundEnabled ? "Disable sound" : "Enable sound"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-blue-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </Button>

          {/* Filter */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <Filter className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({activityCounts.all})</SelectItem>
              <SelectItem value="property_created">Properties ({activityCounts.property_created})</SelectItem>
              <SelectItem value="requirement_created">Requirements ({activityCounts.requirement_created})</SelectItem>
              <SelectItem value="whatsapp_contact">Contacts ({activityCounts.whatsapp_contact})</SelectItem>
              <SelectItem value="property_view">Views ({activityCounts.property_view})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm">Loading activities...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Zap className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold">No activities yet</p>
            <p className="text-xs">Waiting for new events...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredActivities.map((activity, idx) => (
              <ActivityFeedItem 
                key={activity.id} 
                activity={activity}
                isNew={idx < newActivityCount}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Auto-updates every 30 seconds</span>
          <span>Last update: {lastUpdateTime}</span>
        </div>
      </div>
    </Card>
  );
}