import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin, Home, DollarSign, Calendar, User, MessageCircle,
  Sparkles, TrendingUp, Eye, Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function RequirementCard({ requirement }) {
  const formatBudget = () => {
    const unit = requirement.budget_unit === "crores" ? "Cr" : "L";
    if (requirement.budget_min && requirement.budget_max) {
      return `₹${requirement.budget_min} - ₹${requirement.budget_max}${unit}`;
    } else if (requirement.budget_max) {
      return `Up to ₹${requirement.budget_max}${unit}`;
    } else if (requirement.budget_min) {
      return `From ₹${requirement.budget_min}${unit}`;
    }
    return "Budget not specified";
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    
    const brokerContact = requirement.broker_contact;
    const phone = brokerContact ? brokerContact.replace(/\D/g, '') : '919819471310';
    
    const message = `Hi! I have a property that matches this requirement:\n\n` +
      `🔍 Requirement: ${requirement.bhk_preference?.join(', ') || 'Property'}\n` +
      `📍 Location: ${requirement.preferred_locations?.join(', ') || 'Mumbai'}\n` +
      `💰 Budget: ${formatBudget()}\n` +
      `${requirement.custom_id ? `🔖 Ref: ${requirement.custom_id}\n` : ''}` +
      `\nI'd like to share property details that match this.\n\n` +
      `Thank you!`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getUrgencyColor = () => {
    switch(requirement.urgency) {
      case 'High': return 'bg-red-500/20 text-red-700 border-red-500';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500';
      case 'Low': return 'bg-green-500/20 text-green-700 border-green-500';
      default: return 'bg-slate-500/20 text-slate-700 border-slate-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-gradient-to-br from-cyan-50 to-blue-50 backdrop-blur-xl rounded-3xl overflow-hidden border-2 border-cyan-200/50 hover:border-cyan-400 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
    >
      {/* Content Section */}
      <div className="p-5">
        {/* Header with Badges */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold text-xs border-0">
              <Sparkles className="w-3 h-3 mr-1" />
              Requirement
            </Badge>
            {requirement.listing_type && (
              <Badge className="bg-white border-2 border-cyan-200 text-cyan-700 font-semibold text-xs">
                {requirement.listing_type}
              </Badge>
            )}
            {requirement.urgency && (
              <Badge className={`${getUrgencyColor()} font-semibold text-xs`}>
                {requirement.urgency === 'High' && '🔥 '}
                {requirement.urgency}
              </Badge>
            )}
            {requirement.is_direct_client && (
              <Badge className="bg-purple-500/20 text-purple-700 border-purple-500 font-semibold text-xs">
                Direct Client
              </Badge>
            )}
          </div>
        </div>

        {/* Title - Looking for */}
        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 leading-tight group-hover:text-cyan-700 transition-colors">
          Looking for {requirement.bhk_preference?.join(' / ') || 'Property'}
        </h3>

        {/* Location Preferences */}
        <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
          <MapPin className="w-4 h-4 text-cyan-500 flex-shrink-0" />
          <span className="truncate">
            {requirement.preferred_locations?.join(', ') || 'Flexible location'}
            {requirement.pocket ? ` (${requirement.pocket})` : ''}
          </span>
        </div>

        {/* Budget */}
        <div className="flex items-center gap-2 text-sm text-slate-700 mb-3 p-3 bg-cyan-100/50 rounded-xl">
          <DollarSign className="w-4 h-4 text-cyan-600 flex-shrink-0" />
          <span className="font-semibold">{formatBudget()}</span>
        </div>

        {/* Key Details Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {requirement.bhk_preference && requirement.bhk_preference.length > 0 && (
            <div className="bg-cyan-50/80 backdrop-blur-sm rounded-xl p-2 text-center border border-cyan-100">
              <Home className="w-4 h-4 text-cyan-600 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-900 truncate">
                {requirement.bhk_preference.length} option{requirement.bhk_preference.length > 1 ? 's' : ''}
              </p>
            </div>
          )}
          {requirement.furnishing_preference && (
            <div className="bg-cyan-50/80 backdrop-blur-sm rounded-xl p-2 text-center border border-cyan-100">
              <span className="text-lg mb-1">🪑</span>
              <p className="text-xs font-bold text-slate-900 truncate">{requirement.furnishing_preference}</p>
            </div>
          )}
          {requirement.parking_required && (
            <div className="bg-cyan-50/80 backdrop-blur-sm rounded-xl p-2 text-center border border-cyan-100">
              <span className="text-lg mb-1">🚗</span>
              <p className="text-xs font-bold text-slate-900">Required</p>
            </div>
          )}
        </div>

        {/* Client Info (Anonymous for broker referrals) */}
        <div className="flex items-center gap-2 text-xs text-slate-600 mb-3 p-2 bg-white/50 rounded-lg">
          <User className="w-3 h-3 text-cyan-500" />
          <span>
            {requirement.is_direct_client 
              ? `Client: ${requirement.client_name}`
              : `Broker client requirement`}
          </span>
        </div>

        {/* AI Match Count */}
        {requirement.ai_matched_properties && requirement.ai_matched_properties.length > 0 && (
          <div className="mb-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-bold text-green-700">
                {requirement.ai_matched_properties.length} AI Matches Found
              </span>
              <Badge className="bg-green-500/20 text-green-700 border-green-500 text-xs ml-auto">
                75%+ Match
              </Badge>
            </div>
          </div>
        )}

        {/* WhatsApp Contact Button */}
        <Button
          onClick={handleWhatsApp}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl h-11 flex items-center justify-center gap-2 shadow-md"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm">I Have a Match</span>
        </Button>

        {/* Footer Metadata */}
        <div className="mt-3 pt-3 border-t border-cyan-100">
          <div className="flex items-center justify-between text-xs text-slate-500">
            {requirement.created_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Posted {format(new Date(requirement.created_date), "MMM dd, yyyy")}
              </span>
            )}
            {requirement.views_count > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {requirement.views_count}
              </span>
            )}
          </div>
          {requirement.custom_id && (
            <div className="flex items-center justify-between mt-2">
              <span className="font-mono text-cyan-600 text-xs">{requirement.custom_id}</span>
              {requirement.possession_timeline && (
                <span className="text-xs text-slate-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {requirement.possession_timeline}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}