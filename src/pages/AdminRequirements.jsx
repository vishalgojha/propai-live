
import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, MessageCircle, Phone, Mail, MapPin, Eye, Clock, Home as HomeIcon, IndianRupee, Shield, ArrowLeft
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function AdminRequirements() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
          navigate(createPageUrl("Home"));
          return;
        }
        setIsAuthorized(true);
      } catch (error) {
        console.error("Authentication check failed:", error);
        navigate(createPageUrl("Home"));
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: requirements = [], isLoading: requirementsLoading } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.Requirement.list('-created_date'),
    initialData: [],
    enabled: isAuthorized, // Only run the query if authorized
  });

  const handleFindMatches = (req) => {
    const searchParams = new URLSearchParams();
    if (req.bhk_preference?.[0]) searchParams.set('bhk', req.bhk_preference[0]);
    if (req.listing_type) searchParams.set('listingType', req.listing_type);
    if (req.preferred_locations?.[0]) searchParams.set('search', req.preferred_locations[0]);
    navigate(createPageUrl("SmartFeed") + "?" + searchParams.toString());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-[#FFD300] mx-auto mb-4 animate-pulse" />
          <p className="text-[#3B3B3B]">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    // If not authorized after loading, return null or an unauthorized message
    // Navigation already happened in useEffect if not authorized
    return null; 
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        
        {/* Back Button + Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate(createPageUrl("Admin"))}
            variant="ghost"
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Dashboard
          </Button>

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
          <div className="space-y-6">
            {requirements.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border-2 border-[#F7F7F7] hover:border-[#FFD300]/30"
              >
                {/* Header Section with Status Badge */}
                <div className="bg-gradient-to-r from-stone-50 to-stone-100 px-6 py-5 border-b border-stone-200/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-2xl font-bold text-[#111111]">{req.client_name}</h3>
                        <Badge className={
                          req.status === "Active" ? "bg-green-500 text-white border-0" :
                          req.status === "Matched" ? "bg-blue-500 text-white border-0" :
                          req.status === "Closed" ? "bg-gray-500 text-white border-0" :
                          "bg-orange-500 text-white border-0"
                        }>
                          {req.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#3B3B3B]">
                        {req.client_phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-4 h-4 text-stone-500" />
                            {req.client_phone}
                          </span>
                        )}
                        {req.client_email && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-4 h-4 text-stone-500" />
                            {req.client_email}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-stone-500">
                      {format(new Date(req.created_date), "MMM dd, yyyy")}
                    </span>
                  </div>
                </div>

                {/* Core Requirements Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-[#F7F7F7] rounded-2xl p-4">
                      <p className="text-xs text-[#3B3B3B]/60 mb-2 flex items-center gap-1">
                        <HomeIcon className="w-3 h-3" />
                        Type
                      </p>
                      <Badge className="bg-[#FFD300] text-black border-0 font-bold">
                        {req.listing_type}
                      </Badge>
                    </div>
                    <div className="bg-[#F7F7F7] rounded-2xl p-4">
                      <p className="text-xs text-[#3B3B3B]/60 mb-2">BHK</p>
                      <p className="text-base font-bold text-[#111111]">
                        {req.bhk_preference?.join(", ") || "Any"}
                      </p>
                    </div>
                    <div className="bg-[#F7F7F7] rounded-2xl p-4 md:col-span-2">
                      <p className="text-xs text-[#3B3B3B]/60 mb-2 flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        Budget
                      </p>
                      <p className="text-base font-bold text-[#111111]">
                        ₹{req.budget_min || 0}{req.budget_unit === "crores" ? " Cr" : "L"} - 
                        ₹{req.budget_max || 0}{req.budget_unit === "crores" ? " Cr" : "L"}
                      </p>
                    </div>
                  </div>

                  {/* Locations */}
                  {req.preferred_locations && req.preferred_locations.length > 0 && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                      <p className="text-xs text-blue-700 font-semibold mb-3 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Preferred Locations
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {req.preferred_locations.map((loc, idx) => (
                          <Badge key={idx} className="bg-white text-blue-700 border-blue-300 font-semibold">
                            {loc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferences */}
                  <div className="mb-6">
                    <p className="text-xs text-[#3B3B3B]/60 mb-3 font-semibold uppercase tracking-wide">Preferences</p>
                    <div className="flex flex-wrap gap-2">
                      {req.furnishing_preference && req.furnishing_preference !== "Any" && (
                        <Badge variant="outline" className="border-stone-300 text-stone-700">
                          {req.furnishing_preference}
                        </Badge>
                      )}
                      {req.veg_nonveg && (
                        <Badge variant="outline" className="border-stone-300 text-stone-700">
                          {req.veg_nonveg}
                        </Badge>
                      )}
                      {req.parking_required && (
                        <Badge variant="outline" className="border-stone-300 text-stone-700">
                          Parking Required
                        </Badge>
                      )}
                      {req.possession_timeline && (
                        <Badge variant="outline" className="border-stone-300 text-stone-700">
                          <Clock className="w-3 h-3 mr-1" />
                          {req.possession_timeline}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Amenities */}
                  {req.amenities_required && req.amenities_required.length > 0 && (
                    <div className="mb-6">
                      <p className="text-xs text-[#3B3B3B]/60 mb-3 font-semibold uppercase tracking-wide">Required Amenities</p>
                      <div className="flex flex-wrap gap-2">
                        {req.amenities_required.map((amenity, idx) => (
                          <Badge key={idx} className="bg-amber-50 text-amber-900 border-amber-200">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {req.notes && (
                    <div className="mb-6 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                      <p className="text-xs text-stone-600 font-semibold mb-2">Internal Notes</p>
                      <p className="text-sm text-[#111111] leading-relaxed">{req.notes}</p>
                    </div>
                  )}

                  {/* Source Text */}
                  {req.source_text && (
                    <div className="mb-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <p className="text-xs text-blue-600 font-semibold mb-2">Original Message</p>
                      <p className="text-sm text-[#111111] italic leading-relaxed">{req.source_text}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    {req.client_phone && (
                      <Button
                        onClick={() => {
                          const message = `Hi ${req.client_name}, this is Chariot Realty. We have some properties matching your requirement for ${req.bhk_preference?.join("/")} in ${req.preferred_locations?.join("/")}. Can we share details?`;
                          window.open(`https://wa.me/${req.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                        className="bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold rounded-2xl"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp Client
                      </Button>
                    )}
                    <Button
                      onClick={() => handleFindMatches(req)}
                      variant="outline"
                      className="border-2 border-[#FFD300] text-black hover:bg-[#FFD300] font-semibold rounded-2xl"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Find Matches
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
