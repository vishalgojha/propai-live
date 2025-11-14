import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PropertyCard from "../components/property/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Home, Building2, TrendingUp } from "lucide-react";
import SEO from "../components/SEO";
import { generateBreadcrumbJsonLd, generateOrganizationJsonLd } from "../components/utils/jsonLdHelpers";

export default function LocationProperties() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const location = urlParams.get('location') || urlParams.get('l');
  const listingType = urlParams.get('type') || 'all'; // rent, sale, all
  const bhk = urlParams.get('bhk') || 'all'; // 1-bhk, 2-bhk, 3-bhk, all
  
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => base44.entities.Property.list('-created_date'),
    initialData: [],
    staleTime: 30 * 1000,
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(),
    initialData: [],
  });

  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      if (p.status !== "Active" || p.is_duplicate) return false;
      
      // Location match
      if (location && p.location !== location) return false;
      
      // Listing type match
      if (listingType !== 'all' && p.listing_type !== listingType) return false;
      
      // BHK match
      if (bhk !== 'all' && p.bhk !== bhk.replace('-', ' ').toUpperCase()) return false;
      
      return true;
    }).sort((a, b) => {
      const dateA = new Date(a.last_refreshed || a.created_date);
      const dateB = new Date(b.last_refreshed || b.created_date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [properties, location, listingType, bhk]);

  const locationStats = useMemo(() => {
    if (!location) return null;
    
    const locationProps = properties.filter(p => 
      p.location === location && p.status === "Active" && !p.is_duplicate
    );
    
    const rentProps = locationProps.filter(p => p.listing_type === "Rent");
    const saleProps = locationProps.filter(p => p.listing_type === "Sale");
    
    const avgRent = rentProps.length > 0 
      ? Math.round(rentProps.reduce((acc, p) => acc + (p.price_unit === 'crores' ? p.price * 100 : p.price), 0) / rentProps.length)
      : null;
    
    const avgSale = saleProps.length > 0
      ? Math.round(saleProps.reduce((acc, p) => acc + (p.price_unit === 'crores' ? p.price : p.price / 100), 0) / saleProps.length * 100) / 100
      : null;

    const locationBuildings = buildings.filter(b => b.location === location);
    
    return {
      total: locationProps.length,
      rent: rentProps.length,
      sale: saleProps.length,
      avgRent,
      avgSale,
      buildingCount: locationBuildings.length
    };
  }, [properties, buildings, location]);

  const pageTitle = location 
    ? `${listingType === 'Rent' ? 'Rent' : listingType === 'Sale' ? 'Buy' : 'Properties'} ${bhk !== 'all' ? bhk.toUpperCase().replace('-', ' ') : 'Flats'} in ${location}, Mumbai | PropAI Live`
    : 'Mumbai Properties | PropAI Live';

  const pageDescription = location && locationStats
    ? `${locationStats.total} verified properties in ${location}, Mumbai. ${locationStats.rent} rentals, ${locationStats.sale} for sale. ${locationStats.avgRent ? `Avg rent: ₹${locationStats.avgRent}L.` : ''} ${locationStats.avgSale ? `Avg sale: ₹${locationStats.avgSale} Cr.` : ''} Real-time WhatsApp listings, BrokerTrust™ scoring.`
    : 'Browse verified Mumbai properties with AI-powered intelligence.';

  const breadcrumbs = generateBreadcrumbJsonLd([
    { name: "Home", url: window.location.origin },
    { name: "Properties", url: `${window.location.origin}/smartfeed` },
    ...(location ? [{ name: location, url: window.location.href }] : [])
  ]);

  if (!location) {
    navigate(createPageUrl("SmartFeed"));
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <SEO
        title={pageTitle}
        description={pageDescription}
        organization={generateOrganizationJsonLd()}
        breadcrumbs={breadcrumbs}
        canonical={window.location.href.split('?')[0]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          onClick={() => navigate(createPageUrl("SmartFeed"))}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to SmartFeed
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold text-slate-900">
              Properties in {location}
            </h1>
          </div>
          
          {locationStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-2xl p-4 border-2 border-purple-200">
                <p className="text-sm text-slate-600 mb-1">Total Properties</p>
                <p className="text-3xl font-bold text-purple-600">{locationStats.total}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border-2 border-blue-200">
                <p className="text-sm text-slate-600 mb-1">For Rent</p>
                <p className="text-3xl font-bold text-blue-600">{locationStats.rent}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border-2 border-green-200">
                <p className="text-sm text-slate-600 mb-1">For Sale</p>
                <p className="text-3xl font-bold text-green-600">{locationStats.sale}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border-2 border-amber-200">
                <p className="text-sm text-slate-600 mb-1">Buildings</p>
                <p className="text-3xl font-bold text-amber-600">{locationStats.buildingCount}</p>
              </div>
            </div>
          )}

          {locationStats?.avgRent && (
            <div className="mt-4 flex gap-4 text-sm">
              <Badge className="bg-blue-100 text-blue-800 border-0">
                Avg Rent: ₹{locationStats.avgRent}L/month
              </Badge>
              {locationStats.avgSale && (
                <Badge className="bg-green-100 text-green-800 border-0">
                  Avg Sale: ₹{locationStats.avgSale} Cr
                </Badge>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-96 rounded-3xl" />
            ))}
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                user={user}
                onViewDetails={() => navigate(`${createPageUrl("PropertyDetails")}?slug=${property.slug || property.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No properties found</h3>
            <p className="text-slate-600 mb-6">Try adjusting your filters or browse all properties</p>
            <Button onClick={() => navigate(createPageUrl("SmartFeed"))}>
              View All Properties
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}