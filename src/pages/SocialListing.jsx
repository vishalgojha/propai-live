import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Lock, AlertCircle } from "lucide-react";
import SocialSharePropertyCard from "../components/property/SocialSharePropertyCard";

/**
 * SocialListing Page - Renders property social share cards
 * This page is accessed by the screenshot service (Browserless)
 * Login gate ensures only authenticated requests can generate images
 */
export default function SocialListing() {
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get('id');
  const propertySlug = urlParams.get('slug');
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Check authentication
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoadingUser(true);
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  // Fetch property data
  const { data: property, isLoading: propertyLoading, error } = useQuery({
    queryKey: ['property', propertyId || propertySlug],
    queryFn: async () => {
      const properties = await base44.entities.Property.list();
      return properties.find(p => 
        p.id === propertyId || 
        p.slug === propertySlug
      );
    },
    enabled: !!(propertyId || propertySlug) && !!user,
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

  // Loading state for authentication
  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-12 w-48 mx-auto mb-4" />
          <Skeleton className="h-6 w-64 mx-auto" />
        </div>
      </div>
    );
  }

  // Login gate - only authenticated users can access
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border-2 border-purple-200 max-w-md text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Login Required</h2>
          <p className="text-slate-600 mb-6 leading-relaxed">
            This page generates social share images for properties. Please login to access this feature.
          </p>
          <Button
            onClick={() => base44.auth.redirectToLogin(window.location.pathname + window.location.search)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-2xl px-8 py-3"
          >
            Login to Continue
          </Button>
        </div>
      </div>
    );
  }

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