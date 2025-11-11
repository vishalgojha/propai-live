import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import SocialSharePropertyCard from "../components/property/SocialSharePropertyCard";

/**
 * SocialListing Page - Renders property social share cards
 * This page is accessed by the screenshot service (Browserless)
 * NO LOGIN REQUIRED - Public endpoint for automated screenshots
 */
export default function SocialListing() {
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get('id');
  const propertySlug = urlParams.get('slug');

  // Fetch property data - NO AUTH REQUIRED
  const { data: property, isLoading: propertyLoading, error } = useQuery({
    queryKey: ['property', propertyId || propertySlug],
    queryFn: async () => {
      const properties = await base44.entities.Property.list();
      return properties.find(p => 
        p.id === propertyId || 
        p.slug === propertySlug
      );
    },
    enabled: !!(propertyId || propertySlug),
  });

  // Fetch building data if property has building_id
  const { data: building } = useQuery({
    queryKey: ['building', property?.building_id],
    queryFn: async () => {
      if (!property?.building_id) return null;
      const buildings = await base44.entities.Building.list();
      return buildings.find(b => b.id === property.building_id);
    },
    enabled: !!property?.building_id,
  });

  // Fetch developer data if building has developer_id
  const { data: developer } = useQuery({
    queryKey: ['developer', building?.developer_id],
    queryFn: async () => {
      if (!building?.developer_id) return null;
      const developers = await base44.entities.Developer.list();
      return developers.find(d => d.id === building.developer_id);
    },
    enabled: !!building?.developer_id,
  });

  // No property ID provided
  if (!propertyId && !propertySlug) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border-2 border-red-200 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Missing Property ID</h2>
          <p className="text-slate-600">
            Please provide a property ID or slug in the URL parameters.
          </p>
        </div>
      </div>
    );
  }

  // Loading property data
  if (propertyLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <Skeleton className="w-[1200px] h-[630px] rounded-3xl" />
      </div>
    );
  }

  // Property not found
  if (error || !property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border-2 border-red-200 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Property Not Found</h2>
          <p className="text-slate-600">
            The property you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  // Render the social share card
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
      <SocialSharePropertyCard 
        property={property}
        building={building}
        developer={developer}
      />
    </div>
  );
}