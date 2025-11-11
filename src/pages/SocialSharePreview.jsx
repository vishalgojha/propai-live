import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import SocialSharePropertyCard from "../components/property/SocialSharePropertyCard";

/**
 * SocialSharePreview - Renders ONLY the SocialSharePropertyCard
 * 
 * This page is accessed by Browserless to take a screenshot.
 * It has no layout, no navigation - just the card component.
 */
export default function SocialSharePreview() {
  const [property, setProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProperty = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const propertyId = urlParams.get('id');

        if (!propertyId) {
          console.error('No property ID provided');
          return;
        }

        // Fetch property data without auth (public endpoint)
        const properties = await base44.entities.Property.list();
        const foundProperty = properties.find(p => p.id === propertyId);

        if (foundProperty) {
          setProperty(foundProperty);
        }
      } catch (error) {
        console.error('Failed to load property:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProperty();
  }, []);

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <p className="text-xl text-slate-600">Loading property...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <p className="text-xl text-slate-600">Property not found</p>
      </div>
    );
  }

  return <SocialSharePropertyCard property={property} />;
}