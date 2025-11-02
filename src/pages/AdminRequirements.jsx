import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, MessageCircle, Phone, Mail, MapPin, Eye, Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function AdminRequirements() {
  const { data: requirements = [], isLoading: requirementsLoading } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.Requirement.list('-created_date'),
    initialData: [],
  });

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#111111] mb-2">Requirements</h1>
          <p className="text-[#3B3B3B]">Client requirements & matching</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Total Requirements</p>
            <p className="text-2xl font-bold text-[#111111]">{requirements.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {requirements.filter(r => r.status === "Active").length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Matched</p>
            <p className="text-2xl font-bold text-blue-600">
              {requirements.filter(r => r.status === "Matched").length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-[#F7F7F7]">
            <p className="text-xs text-[#3B3B3B] mb-1">Closed</p>
            <p className="text-2xl font-bold text-[#3B3B3B]">
              {requirements.filter(r => r.status === "Closed").length}
            </p>
          </div>
        </div>

        {requirementsLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
            ))}
          </div>
        ) : requirements.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-[#F7F7F7]">
            <Search className="w-12 h-12 text-[#3B3B3B] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#111111] mb-2">No requirements yet</h3>
            <p className="text-[#3B3B3B]">Client requirements will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requirements.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 border-2 border-[#F7F7F7] hover:border-[#FFD300]/50 transition-all"
              >
                {/* ... keep existing code (requirements card from original Admin.js RequirementsTab) ... */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-[#111111]">{req.client_name}</h3>
                      <Badge className={
                        req.status === "Active" ? "bg-green-500/20 text-green-700 border-green-500" :
                        req.status === "Matched" ? "bg-blue-500/20 text-blue-700 border-blue-500" :
                        req.status === "Closed" ? "bg-gray-500/20 text-gray-700 border-gray-500" :
                        "bg-orange-500/20 text-orange-700 border-orange-500"
                      }>
                        {req.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#3B3B3B]">
                      {req.client_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {req.client_phone}
                        </span>
                      )}
                      {req.client_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {req.client_email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-[#3B3B3B]/60 mb-1">Type</p>
                    <Badge className="bg-[#FFD300]/20 text-black border-[#FFD300]">
                      {req.listing_type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-[#3B3B3B]/60 mb-1">BHK Preference</p>
                    <p className="text-sm font-bold text-[#111111]">
                      {req.bhk_preference?.join(", ") || "Any"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#3B3B3B]/60 mb-1">Budget</p>
                    <p className="text-sm font-bold text-[#111111]">
                      ₹{req.budget_min || 0}{req.budget_unit === "crores" ? " Cr" : "L"} - 
                      ₹{req.budget_max || 0}{req.budget_unit === "crores" ? " Cr" : "L"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#3B3B3B]/60 mb-1">Created</p>
                    <p className="text-sm text-[#111111]">
                      {format(new Date(req.created_date), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>

                {req.preferred_locations && req.preferred_locations.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-[#3B3B3B]/60 mb-2">Preferred Locations</p>
                    <div className="flex flex-wrap gap-2">
                      {req.preferred_locations.map((loc, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {loc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-4 p-3 bg-[#F7F7F7] rounded-xl">
                  <p className="text-xs text-[#3B3B3B]/60 mb-2">Preferences</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {req.furnishing_preference && req.furnishing_preference !== "Any" && (
                      <Badge variant="outline">{req.furnishing_preference}</Badge>
                    )}
                    {req.veg_nonveg && (
                      <Badge variant="outline">{req.veg_nonveg}</Badge>
                    )}
                    {req.parking_required && (
                      <Badge variant="outline">Parking Required</Badge>
                    )}
                    {req.possession_timeline && (
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        {req.possession_timeline}
                      </Badge>
                    )}
                  </div>
                </div>

                {req.amenities_required && req.amenities_required.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-[#3B3B3B]/60 mb-2">Required Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {req.amenities_required.map((amenity, idx) => (
                        <Badge key={idx} className="bg-amber-500/20 text-amber-900 border-amber-500 text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {req.notes && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-xs text-blue-600 mb-1">Notes</p>
                    <p className="text-sm text-[#111111]">{req.notes}</p>
                  </div>
                )}

                {req.source_text && (
                  <div className="mb-4 p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <p className="text-xs text-stone-500 mb-1">Original Message</p>
                    <p className="text-sm text-[#111111] italic">{req.source_text}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {req.client_phone && (
                    <Button
                      onClick={() => {
                        const message = `Hi ${req.client_name}, this is Chariot Realty. We have some properties matching your requirement for ${req.bhk_preference?.join("/")} in ${req.preferred_locations?.join("/")}. Can we share details?`;
                        window.open(`https://wa.me/${req.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                      }}
                      className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                      size="sm"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp Client
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      const searchParams = new URLSearchParams();
                      if (req.bhk_preference?.[0]) searchParams.set('bhk', req.bhk_preference[0]);
                      if (req.listing_type) searchParams.set('listingType', req.listing_type);
                      if (req.preferred_locations?.[0]) searchParams.set('search', req.preferred_locations[0]);
                      window.location.href = createPageUrl("SmartFeed") + "?" + searchParams.toString();
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Find Matches
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}