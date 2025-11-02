import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Maximize2, Car, MessageCircle, Eye, MoreVertical, Link2, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PropertyCard({ property, onViewDetails, isAdmin = false }) {
  const [copied, setCopied] = useState(false);

  const formatPrice = () => {
    if (property.price_unit === "crores") {
      return `₹${property.price} Cr`;
    }
    return `₹${property.price} L`;
  };

  const getAgentPhone = () => {
    if (property.assigned_agent === "Kapil") {
      return "919773757759";
    }
    return "919819471310";
  };

  const getAgentName = () => {
    return property.assigned_agent || "Vishal";
  };

  const handleWhatsApp = () => {
    const locationText = property.location || property.location_id || "Mumbai";
    const message = `Hi ${getAgentName()}, I saw this property on Chariot Realty SmartFeed.\n\n${property.ai_title || property.bhk + ' in ' + locationText}\n\nCan you share more details and photos?`;
    const phone = getAgentPhone();
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleBrokerWhatsApp = () => {
    const locationText = property.location || property.location_id || "Mumbai";
    const message = `Hi, Chariot Realty here. Please confirm availability and share photos for:\n\n${property.bhk} in ${locationText}\n${property.building_name || ''}\nRef: ${property.custom_id || property.id}`;
    const phone = property.broker_contact?.replace(/\D/g, '');
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/property/${property.slug || property.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCard = () => {
    const title = property.ai_title || `${property.bhk} in ${property.location || ''}`;
    const cardText = `${title}\n\n${property.ai_description || property.description || ''}\n\nView on Chariot Realty:\n${window.location.origin}/property/${property.slug || property.id}`;
    navigator.clipboard.writeText(cardText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColors = {
    Active: "bg-[#FFD300]/20 text-black border-[#FFD300]",
    Draft: "bg-orange-500/20 text-orange-900 border-orange-300",
    "On Hold": "bg-gray-500/20 text-gray-900 border-gray-300",
    Sold: "bg-red-500/20 text-red-900 border-red-300",
    Rented: "bg-green-500/20 text-green-900 border-green-300"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-[22px] shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-[#F7F7F7] hover:border-[#FFD300]/50"
    >
      {/* Header with Status Badge */}
      <div className="px-5 pt-5 pb-2 flex items-start justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`text-xs font-bold border uppercase tracking-wide ${statusColors[property.status] || statusColors.Draft}`}>
            {property.status?.toUpperCase() || "DRAFT"}
          </Badge>
          {property.featured && (
            <Badge className="text-xs font-bold bg-[#FFD300]/20 text-black border-[#FFD300]">
              Featured
            </Badge>
          )}
          {property.listing_type && (
            <Badge variant="outline" className="text-xs border-[#3B3B3B]">
              {property.listing_type}
            </Badge>
          )}
        </div>
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails(property)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {property.broker_contact && (
                <DropdownMenuItem onClick={handleBrokerWhatsApp}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Broker
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Image Section */}
      {property.images && property.images.length > 0 ? (
        <div className="relative h-48 mx-5 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          <img
            src={property.images[0]}
            alt={property.building_name || property.bhk}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      ) : (
        <div className="relative h-48 mx-5 rounded-2xl bg-[#F7F7F7] flex flex-col items-center justify-center border-2 border-dashed border-[#3B3B3B]/20">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-sm">
            <svg className="w-8 h-8 text-[#3B3B3B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-xs text-[#3B3B3B] font-semibold">📸 Photos available on WhatsApp</p>
        </div>
      )}

      {/* Content Section */}
      <div className="p-5">
        {/* AI-Generated Title or Fallback */}
        {property.ai_title ? (
          <h3 className="text-lg font-bold text-[#111111] mb-3 leading-tight">
            {property.ai_title}
          </h3>
        ) : (
          <div className="mb-3">
            <h3 className="text-xl font-bold text-[#111111] mb-1">
              {property.bhk} in {property.location || property.location_id?.split(',')[0] || "Mumbai"}
            </h3>
            {property.pocket && (
              <div className="flex items-center gap-1.5 text-sm text-[#3B3B3B]">
                <MapPin className="w-3.5 h-3.5 text-[#FFD300]" />
                <span>{property.pocket}</span>
              </div>
            )}
          </div>
        )}

        {/* AI-Generated Description Preview */}
        {property.ai_description && (
          <p className="text-sm text-[#3B3B3B]/80 mb-4 line-clamp-2 leading-relaxed">
            {property.ai_description}
          </p>
        )}

        {/* Price - Yellow/Amber gradient */}
        <div className="mb-5">
          <p className="text-3xl font-bold bg-gradient-to-r from-[#FFD300] to-[#FFA500] bg-clip-text text-transparent">
            {formatPrice()}
          </p>
        </div>

        {/* Property Details Grid */}
        <div className="grid grid-cols-3 gap-3 mb-5 pb-5 border-b border-gray-100">
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-[#F7F7F7] flex items-center justify-center mb-2">
              <Maximize2 className="w-5 h-5 text-[#3B3B3B]" />
            </div>
            <p className="text-xs font-bold text-[#111111]">
              {property.carpet_area || "N/A"}
            </p>
            <p className="text-xs text-[#3B3B3B]/60">sqft</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-[#F7F7F7] flex items-center justify-center mb-2">
              <Car className="w-5 h-5 text-[#3B3B3B]" />
            </div>
            <p className="text-xs font-bold text-[#111111]">
              {property.parking?.split(' ')[0] || "N/A"}
            </p>
            <p className="text-xs text-[#3B3B3B]/60">Parking</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-[#F7F7F7] flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-[#3B3B3B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <p className="text-xs font-bold text-[#111111] truncate px-1">
              {property.furnishing ? property.furnishing.split(' ')[0].split('-')[0] : "N/A"}
            </p>
            <p className="text-xs text-[#3B3B3B]/60">Furnish</p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between text-xs text-[#3B3B3B]/60 mb-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {property.views_count || 0}
            </span>
            {property.custom_id && (
              <span className="text-[#3B3B3B]/40 font-mono">ID: {property.custom_id}</span>
            )}
          </div>
          <span>{format(new Date(property.created_date), "MMM dd")}</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Button
            onClick={copyCard}
            variant="outline"
            size="sm"
            className="text-xs border-[#3B3B3B]/20 hover:bg-[#F7F7F7] font-semibold"
          >
            <Copy className="w-3 h-3 mr-1" />
            {copied ? "✓" : "Card"}
          </Button>
          <Button
            onClick={copyLink}
            variant="outline"
            size="sm"
            className="text-xs border-[#3B3B3B]/20 hover:bg-[#F7F7F7] font-semibold"
          >
            <Link2 className="w-3 h-3 mr-1" />
            Link
          </Button>
          <Button
            onClick={() => onViewDetails(property)}
            variant="outline"
            size="sm"
            className="text-xs border-[#3B3B3B]/20 hover:bg-[#F7F7F7] font-semibold"
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
        </div>

        {/* Primary CTA - WhatsApp Green */}
        <Button
          onClick={handleWhatsApp}
          className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white gap-2 shadow-lg shadow-[#25D366]/20 font-bold h-12 rounded-2xl"
        >
          <MessageCircle className="w-4 h-4" />
          Contact via WhatsApp
        </Button>

        {/* Secondary CTA for properties without images */}
        {(!property.images || property.images.length === 0) && (
          <Button
            onClick={handleWhatsApp}
            variant="outline"
            className="w-full mt-2 text-xs border-[#FFD300] text-black hover:bg-[#FFD300]/10 font-semibold"
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
            WhatsApp for Photos
          </Button>
        )}
      </div>
    </motion.div>
  );
}