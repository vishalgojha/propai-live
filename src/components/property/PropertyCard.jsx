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
    const message = `Hi ${getAgentName()}, I saw this property on Chariot Realty SmartFeed.\n\n${property.bhk} in ${property.location_id}\n${formatPrice()}\n\nCan you share more details and photos?`;
    const phone = getAgentPhone();
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleBrokerWhatsApp = () => {
    const message = `Hi, Chariot Realty here. Please confirm availability and share photos for:\n\n${property.bhk} in ${property.location_id}\n${property.building_name || ''}\nRef: ${property.custom_id || property.id}`;
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
    const cardText = `${property.bhk} in ${property.location_id}\n${property.pocket ? property.pocket + '\n' : ''}${formatPrice()} | ${property.carpet_area} sqft\n${property.furnishing}\n\nView on Chariot Realty:\n${window.location.origin}/property/${property.slug || property.id}`;
    navigator.clipboard.writeText(cardText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColors = {
    Active: "bg-green-500/10 text-green-700 border-green-200",
    Draft: "bg-orange-500/10 text-orange-700 border-orange-200",
    "On Hold": "bg-slate-500/10 text-slate-700 border-slate-200",
    Sold: "bg-red-500/10 text-red-700 border-red-200",
    Rented: "bg-blue-500/10 text-blue-700 border-blue-200"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-gradient-to-br from-white via-slate-50/30 to-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-slate-100/60"
    >
      {/* Header with Status Badge */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Badge className={`text-xs font-medium border ${statusColors[property.status] || statusColors.Draft}`}>
            {property.status?.toUpperCase() || "DRAFT"}
          </Badge>
          {property.featured && (
            <Badge className="text-xs font-medium bg-blue-500/10 text-blue-700 border-blue-200">
              Featured
            </Badge>
          )}
          {property.listing_type && (
            <Badge variant="outline" className="text-xs">
              {property.listing_type}
            </Badge>
          )}
        </div>
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <MoreVertical className="w-4 h-4 text-slate-400" />
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
        <div className="relative h-44 mx-4 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
          <img
            src={property.images[0]}
            alt={property.building_name || property.bhk}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      ) : (
        <div className="relative h-44 mx-4 rounded-xl bg-gradient-to-br from-blue-50 via-slate-50 to-teal-50 flex flex-col items-center justify-center">
          <div className="w-14 h-14 bg-white/80 rounded-2xl flex items-center justify-center mb-2">
            <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-xs text-slate-500 font-medium">Photos available on WhatsApp</p>
        </div>
      )}

      {/* Content Section */}
      <div className="p-4">
        {/* Title and Location */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {property.bhk} in {property.location_id?.split(',')[0] || "Mumbai"}
          </h3>
          {property.pocket && (
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-teal-500" />
              <span>{property.pocket}</span>
            </div>
          )}
          {property.building_name && !property.pocket && (
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-teal-500" />
              <span>{property.building_name}</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="mb-4">
          <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            {formatPrice()}
          </p>
        </div>

        {/* Property Details Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-slate-100">
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mb-1.5">
              <Maximize2 className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-xs font-semibold text-slate-900">
              {property.carpet_area || "N/A"}
            </p>
            <p className="text-xs text-slate-500">sqft</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mb-1.5">
              <Car className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-xs font-semibold text-slate-900">
              {property.parking?.split(' ')[0] || "N/A"}
            </p>
            <p className="text-xs text-slate-500">Parking</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mb-1.5">
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-slate-900 truncate px-1">
              {property.furnishing ? property.furnishing.split(' ')[0].split('-')[0] : "N/A"}
            </p>
            <p className="text-xs text-slate-500">Furnish</p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {property.views_count || 0} views
            </span>
            {property.custom_id && (
              <span className="text-slate-400">ID: {property.custom_id}</span>
            )}
          </div>
          <span>{format(new Date(property.created_date), "MMM dd, yyyy")}</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <Button
            onClick={copyCard}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <Copy className="w-3 h-3 mr-1" />
            {copied ? "Copied!" : "Card"}
          </Button>
          <Button
            onClick={copyLink}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <Link2 className="w-3 h-3 mr-1" />
            Link
          </Button>
          <Button
            onClick={() => onViewDetails(property)}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
        </div>

        {/* Primary CTA */}
        <Button
          onClick={handleWhatsApp}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white gap-2 shadow-lg shadow-green-500/20"
        >
          <MessageCircle className="w-4 h-4" />
          Contact via WhatsApp
        </Button>

        {/* Secondary CTA for properties without images */}
        {(!property.images || property.images.length === 0) && (
          <Button
            onClick={handleWhatsApp}
            variant="outline"
            className="w-full mt-2 text-xs border-teal-200 text-teal-700 hover:bg-teal-50"
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
            WhatsApp for Photos
          </Button>
        )}
      </div>
    </motion.div>
  );
}