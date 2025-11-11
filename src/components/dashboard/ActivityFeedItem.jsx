import React from "react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Home, Target, MessageCircle, Eye, User, DollarSign,
  Star, CheckCircle2, AlertTriangle, TrendingUp
} from "lucide-react";

export default function ActivityFeedItem({ activity, isNew }) {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'property_created':
        return { icon: Home, color: 'text-blue-600 bg-blue-100' };
      case 'property_updated':
        return { icon: TrendingUp, color: 'text-indigo-600 bg-indigo-100' };
      case 'requirement_created':
        return { icon: Target, color: 'text-purple-600 bg-purple-100' };
      case 'whatsapp_contact':
        return { icon: MessageCircle, color: 'text-green-600 bg-green-100' };
      case 'property_view':
        return { icon: Eye, color: 'text-slate-600 bg-slate-100' };
      case 'broker_joined':
        return { icon: User, color: 'text-amber-600 bg-amber-100' };
      case 'price_change':
        return { icon: DollarSign, color: 'text-orange-600 bg-orange-100' };
      case 'high_trust_achieved':
        return { icon: Star, color: 'text-yellow-600 bg-yellow-100' };
      case 'property_sold':
        return { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-100' };
      case 'duplicate_detected':
        return { icon: AlertTriangle, color: 'text-red-600 bg-red-100' };
      default:
        return { icon: Activity, color: 'text-slate-600 bg-slate-100' };
    }
  };

  const { icon: Icon, color } = getActivityIcon();

  const getActionText = () => {
    switch (activity.type) {
      case 'property_created':
        return 'New property listed';
      case 'property_updated':
        return 'Property updated';
      case 'requirement_created':
        return 'New client requirement';
      case 'whatsapp_contact':
        return 'WhatsApp inquiry received';
      case 'property_view':
        return 'Property viewed';
      case 'broker_joined':
        return 'New broker joined';
      case 'price_change':
        return 'Price updated';
      case 'high_trust_achieved':
        return 'High trust score achieved';
      case 'property_sold':
        return 'Property sold';
      case 'duplicate_detected':
        return 'Duplicate property detected';
      default:
        return 'Activity recorded';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
        isNew 
          ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 shadow-md' 
          : 'bg-slate-50 hover:bg-slate-100'
      }`}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} flex-shrink-0 ${
        isNew ? 'animate-pulse' : ''
      }`}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-slate-900 leading-tight">
            {getActionText()}
            {isNew && (
              <Badge className="ml-2 bg-blue-600 text-white text-xs px-1.5 py-0 border-0">
                NEW
              </Badge>
            )}
          </p>
          <p className="text-xs text-slate-400 whitespace-nowrap">
            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
          </p>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 line-clamp-1 mb-2">
          {activity.description}
        </p>

        {/* Meta Info */}
        <div className="flex items-center gap-2 flex-wrap">
          {activity.meta?.map((item, idx) => (
            <Badge 
              key={idx} 
              variant="outline" 
              className="text-xs px-2 py-0.5 bg-white"
            >
              {item}
            </Badge>
          ))}
        </div>
      </div>
    </motion.div>
  );
}