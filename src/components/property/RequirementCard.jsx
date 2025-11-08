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
    
    // Check if there are matches first
    if (matchedProperties.length === 0) {
      toast.warning('⚠️ No Matches Yet', {
        description: 'No properties match this requirement yet',
        duration: 3000
      });
      return;
    }
    
    const phone = requirement.broker_contact || requirement.client_phone;
    
    if (!phone) {
      toast.error('⚠️ Contact information not available');
      return;
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Determine recipient - if it's a broker requirement, address the broker
    const recipientName = requirement.is_direct_client 
      ? (requirement.client_name || 'there')
      : 'there'; // For brokers, use generic greeting
    
    // Build message with matched properties
    let message = `Hi${recipientName !== 'there' ? ` ${recipientName}` : ''}! 👋\n\n`;
    
    if (requirement.is_direct_client) {
      // Message for direct client
      message += `I found ${matchedProperties.length} ${matchedProperties.length === 1 ? 'property' : 'properties'} matching your requirement:\n\n`;
    } else {
      // Message for broker
      message += `Found ${matchedProperties.length} ${matchedProperties.length === 1 ? 'property' : 'properties'} matching this requirement:\n\n`;
    }
    
    message += `🔍 *Requirement:*\n`;
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
    
    if (requirement.is_direct_client) {
      message += `Can we schedule viewings? 🏠\n\n`;
    } else {
      message += `Let me know if you'd like to discuss these options! 🏠\n\n`;
    }
    
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
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden border-2 border-cyan-200/50 hover:border-cyan-400 hover:shadow-2xl transition-all duration-300 group"
    >
      {/* Header Section */}
      <div className="p-4">
        {/* Top Row: Badges + Timestamp */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex flex-wrap gap-1.5">
            {requirement.listing_type && (
              <Badge className="bg-cyan-100 border border-cyan-300 text-cyan-700 font-semibold text-xs">
                {requirement.listing_type}
              </Badge>
            )}
            {requirement.urgency && (
              <Badge className={`${getUrgencyColor()} font-semibold text-xs px-2 py-0.5`}>
                {requirement.urgency}
              </Badge>
            )}
          </div>
          
          {getTimestamp() && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              <span>{getTimestamp()}</span>
            </div>
          )}
        </div>

        {/* Main Title */}
        <h3 className="text-base font-bold text-slate-900 mb-2 leading-tight group-hover:text-cyan-700 transition-colors">
          {requirement.bhk_preference?.join(' / ') || 'Property'} Required
        </h3>

        {/* Custom ID */}
        {requirement.custom_id && (
          <div className="mb-3">
            <button
              onClick={copyCustomId}
              className="flex items-center gap-1.5 text-xs font-mono text-purple-600 hover:text-purple-700 transition-colors"
            >
              <span>ID: {requirement.custom_id}</span>
              <Copy className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Location */}
        {requirement.preferred_locations && requirement.preferred_locations.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-3">
            <MapPin className="w-4 h-4 text-cyan-500 flex-shrink-0" />
            <span className="truncate">
              {requirement.preferred_locations.slice(0, 2).join(', ')}
              {requirement.preferred_locations.length > 2 && ` +${requirement.preferred_locations.length - 2}`}
            </span>
          </div>
        )}

        {/* Client Name */}
        <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-3">
          <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="truncate">
            {requirement.is_direct_client 
              ? requirement.client_name || 'Client'
              : 'Broker Client Requirement'}
          </span>
        </div>

        {/* Budget Range */}
        <div className="flex items-baseline justify-between mb-3 pb-3 border-b border-cyan-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              {budget.from}
            </span>
            <span className="text-xl text-slate-400">→</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              {budget.to}
            </span>
          </div>
        </div>

        {/* AI Matches Badge */}
        {matchedProperties.length > 0 ? (
          <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm font-bold text-purple-900">
                  {matchedProperties.length} AI {matchedProperties.length === 1 ? 'Match' : 'Matches'} Found
                </p>
                <p className="text-xs text-purple-700">Ready to share via WhatsApp</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-sm font-bold text-slate-600">
                  No Matches Yet
                </p>
                <p className="text-xs text-slate-500">Waiting for matching properties</p>
              </div>
            </div>
          </div>
        )}

        {/* Looking For - Compact BHK badges */}
        {requirement.bhk_preference && requirement.bhk_preference.length > 0 && (
          <div className="mb-3">
            <div className="grid grid-cols-3 gap-2">
              {requirement.bhk_preference.slice(0, 3).map((bhk, idx) => (
                <div key={idx} className="bg-cyan-50/80 backdrop-blur-sm rounded-xl p-2 text-center border border-cyan-100">
                  <Home className="w-4 h-4 text-cyan-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-900">{bhk}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WhatsApp Contact Button - Disabled if no matches */}
        <Button
          onClick={handleWhatsApp}
          disabled={matchedProperties.length === 0}
          className={`w-full font-bold rounded-xl h-10 flex items-center justify-center gap-2 shadow-md ${
            matchedProperties.length === 0
              ? 'bg-slate-300 cursor-not-allowed text-slate-500'
              : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>
            {matchedProperties.length === 0 
              ? 'No Matches to Share' 
              : `Share ${matchedProperties.length} ${matchedProperties.length === 1 ? 'Match' : 'Matches'}`
            }
          </span>
        </Button>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-cyan-100 flex items-center justify-between text-xs text-slate-500">
          {requirement.created_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(requirement.created_date), "MMM dd")}
            </span>
          )}
          {requirement.furnishing_preference && requirement.furnishing_preference !== 'Any' && (
            <span className="truncate">{requirement.furnishing_preference}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}