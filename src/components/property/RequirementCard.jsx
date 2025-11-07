import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin, Home, Calendar, User, MessageCircle,
  Clock, Copy, Sparkles, CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

export default function RequirementCard({ requirement, allProperties = [] }) {
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

  // Get matched properties
  const matchedProperties = React.useMemo(() => {
    if (!requirement.ai_matched_properties || !allProperties.length) return [];
    
    return requirement.ai_matched_properties
      .map(match => {
        const property = allProperties.find(p => p.id === match.property_id);
        return property ? { ...property, match_score: match.match_score, match_reasons: match.match_reasons } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.match_score - a.match_score);
  }, [requirement, allProperties]);

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    
    const phone = requirement.client_phone || requirement.broker_contact;
    
    if (!phone) {
      toast.error('⚠️ Contact information not available');
      return;
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    const clientName = requirement.client_name || 'there';
    
    // Build message with matched properties
    let message = `Hi ${clientName}! 👋\n\n`;
    message += `I found ${matchedProperties.length} ${matchedProperties.length === 1 ? 'property' : 'properties'} matching your requirement:\n\n`;
    message += `🔍 *Your Requirement:*\n`;
    message += `• ${requirement.bhk_preference?.join(', ') || 'Property'}\n`;
    message += `• ${requirement.preferred_locations?.join(', ') || 'Mumbai'}\n`;
    message += `• Budget: ${budget.from} → ${budget.to}\n\n`;
    
    message += `✨ *Perfect Matches:*\n\n`;
    
    matchedProperties.slice(0, 5).forEach((prop, idx) => {
      const price = prop.price_unit === 'crores' ? `₹${prop.price} Cr` : `₹${prop.price}L`;
      message += `${idx + 1}. ${prop.bhk} - ${prop.building_name || prop.location}\n`;
      message += `   💰 ${price} | 📍 ${prop.location}\n`;
      if (prop.carpet_area) message += `   📐 ${prop.carpet_area} sq.ft`;
      if (prop.furnishing) message += ` | 🪑 ${prop.furnishing}`;
      message += `\n`;
      if (prop.match_score) message += `   🎯 ${prop.match_score}% AI Match\n`;
      message += `\n`;
    });
    
    if (matchedProperties.length > 5) {
      message += `...and ${matchedProperties.length - 5} more!\n\n`;
    }
    
    message += `📱 View all matches on PropAI Live:\n`;
    message += `www.propai.live\n\n`;
    message += `Can we schedule viewings? 🏠\n\n`;
    message += `Team PropAI`;
    
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
      toast.success('ID copied!');
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
      className="bg-white rounded-3xl overflow-hidden border-2 border-cyan-200 hover:border-cyan-400 hover:shadow-xl transition-all duration-300"
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

        {/* AI Matches Badge */}
        {matchedProperties.length > 0 && (
          <div className="mb-5 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-bold text-purple-900">
                  {matchedProperties.length} AI {matchedProperties.length === 1 ? 'Match' : 'Matches'} Found
                </p>
                <p className="text-xs text-purple-700">Ready to share via WhatsApp</p>
              </div>
            </div>
          </div>
        )}

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

        {/* WhatsApp Contact Button - Shows matches directly */}
        <Button
          onClick={handleWhatsApp}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl h-14 flex items-center justify-center gap-3 shadow-lg text-base"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Share {matchedProperties.length} {matchedProperties.length === 1 ? 'Match' : 'Matches'} via WhatsApp</span>
        </Button>
      </div>
    </motion.div>
  );
}