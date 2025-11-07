import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin, Home, Calendar, User, MessageCircle,
  Clock, Copy
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

export default function RequirementCard({ requirement }) {
  const formatBudget = () => {
    if (!requirement.budget_min && !requirement.budget_max) {
      return { from: "Any", to: "Flexible" };
    }

    const unit = requirement.budget_unit === "crores" ? "Cr" : "L";
    
    if (requirement.budget_min && requirement.budget_max) {
      return { from: `₹${requirement.budget_min}${unit}`, to: `₹${requirement.budget_max}${unit}` };
    } else if (requirement.budget_max) {
      return { from: "Any", to: `₹${requirement.budget_max}${unit}` };
    } else if (requirement.budget_min) {
      return { from: `₹${requirement.budget_min}${unit}`, to: "Any" };
    }
    
    return { from: "Any", to: "Flexible" };
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    
    const phone = requirement.client_phone || requirement.broker_contact;
    
    if (!phone) {
      alert('⚠️ Contact information not available for this requirement.');
      return;
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    const requirementUrl = requirement.slug 
      ? `${window.location.origin}/smartfeed?req=${requirement.slug}`
      : `${window.location.origin}/smartfeed`;
    
    const message = `Hi! I have a property that matches your requirement:\n\n` +
      `🔍 *Looking for:* ${requirement.bhk_preference?.join(', ') || 'Property'}\n` +
      `📍 *Location:* ${requirement.preferred_locations?.join(', ') || 'Mumbai'}\n` +
      `💰 *Budget:* ${formatBudget().from} → ${formatBudget().to}\n` +
      `${requirement.custom_id ? `🔖 *Ref:* ${requirement.custom_id}\n` : ''}` +
      `\n📱 *PropAI Live:* ${requirementUrl}\n\n` +
      `I'd like to share property details that match this.\n\n` +
      `Thank you!`;
    
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getUrgencyColor = () => {
    switch(requirement.urgency) {
      case 'High': return 'bg-red-500 text-white border-0';
      case 'Medium': return 'bg-amber-400 text-black border-0';
      case 'Low': return 'bg-green-500 text-white border-0';
      default: return 'bg-slate-500 text-white border-0';
    }
  };

  const copyCustomId = (e) => {
    e.stopPropagation();
    if (requirement.custom_id) {
      navigator.clipboard.writeText(requirement.custom_id);
      toast.success('ID copied to clipboard!');
    }
  };

  const getTimestamp = () => {
    if (!requirement.created_date) return null;
    
    const created = new Date(requirement.created_date);
    const now = new Date();
    const diffHours = Math.floor((now - created) / (1000 * 60 * 60));
    
    if (diffHours < 24) return 'Today';
    if (diffHours < 48) return 'Yesterday';
    return format(created, 'MMM dd');
  };

  const budget = formatBudget();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl overflow-hidden border-2 border-slate-200 hover:border-cyan-400 hover:shadow-xl transition-all duration-300"
    >
      {/* Header Section */}
      <div className="p-5 pb-4">
        {/* Top Row: Location + Urgency + Timestamp */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-600 font-medium">
                {requirement.preferred_locations?.[0] || 'Mumbai'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {requirement.urgency && (
              <Badge className={`${getUrgencyColor()} font-bold text-sm px-3 py-1`}>
                {requirement.urgency.toUpperCase()}
              </Badge>
            )}
            {getTimestamp() && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-100 rounded-xl border border-sky-200">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                <span className="text-xs text-sky-700 font-semibold">{getTimestamp()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Custom ID with Copy */}
        {requirement.custom_id && (
          <div 
            onClick={copyCustomId}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 mb-4 cursor-pointer hover:bg-slate-100 transition-colors group"
          >
            <span className="text-sm font-mono text-slate-700 flex-1">ID: {requirement.custom_id}</span>
            <Copy className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
          </div>
        )}

        {/* Main Title */}
        <h3 className="text-2xl font-bold text-slate-900 mb-4 leading-tight">
          {requirement.bhk_preference?.join(' / ') || 'Property'} Required
        </h3>

        {/* Client Name */}
        <div className="flex items-center gap-2 text-slate-700 mb-5">
          <User className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium">
            {requirement.is_direct_client 
              ? requirement.client_name || 'Client'
              : 'Broker Client Requirement'}
          </span>
        </div>

        {/* Budget Range Section */}
        <div className="mb-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            BUDGET RANGE
          </p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-sky-600">{budget.from}</span>
            <span className="text-2xl text-slate-400">→</span>
            <span className="text-2xl font-bold text-sky-600">{budget.to}</span>
          </div>
        </div>

        {/* Looking For Section */}
        {requirement.bhk_preference && requirement.bhk_preference.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              LOOKING FOR
            </p>
            <div className="flex flex-wrap gap-2">
              {requirement.bhk_preference.map((bhk, idx) => (
                <div key={idx} className="flex items-center gap-2 px-4 py-2.5 bg-sky-100 rounded-xl border border-sky-200">
                  <Home className="w-4 h-4 text-sky-700" />
                  <span className="font-bold text-sky-900">{bhk}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preferred Locations Section */}
        {requirement.preferred_locations && requirement.preferred_locations.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              PREFERRED LOCATIONS
            </p>
            <div className="flex flex-wrap gap-2">
              {requirement.preferred_locations.map((location, idx) => (
                <div key={idx} className="flex items-center gap-2 px-4 py-2.5 bg-green-100 rounded-xl border border-green-200">
                  <MapPin className="w-4 h-4 text-green-700" />
                  <span className="font-bold text-green-900">{location}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Details */}
        {(requirement.furnishing_preference || requirement.parking_required || requirement.possession_timeline) && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            {requirement.furnishing_preference && requirement.furnishing_preference !== "Any" && (
              <div className="bg-slate-50 rounded-xl p-2 text-center border border-slate-200">
                <span className="text-lg mb-1">🪑</span>
                <p className="text-xs font-bold text-slate-900 truncate">{requirement.furnishing_preference}</p>
              </div>
            )}
            {requirement.parking_required && (
              <div className="bg-slate-50 rounded-xl p-2 text-center border border-slate-200">
                <span className="text-lg mb-1">🚗</span>
                <p className="text-xs font-bold text-slate-900">Required</p>
              </div>
            )}
            {requirement.possession_timeline && (
              <div className="bg-slate-50 rounded-xl p-2 text-center border border-slate-200">
                <Clock className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-900 truncate">{requirement.possession_timeline}</p>
              </div>
            )}
          </div>
        )}

        {/* WhatsApp Contact Button */}
        <Button
          onClick={handleWhatsApp}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl h-14 flex items-center justify-center gap-3 shadow-lg text-base"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Contact via WhatsApp</span>
        </Button>
      </div>
    </motion.div>
  );
}