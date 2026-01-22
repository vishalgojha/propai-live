import React, { useState, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PropertyFilters from "../components/property/PropertyFilters";
import { MapPin, X, List, Map as MapIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import "leaflet/dist/leaflet.css";
import SEO from "../components/SEO";

// Fix for default marker icons in react-leaflet
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Component to update map bounds when markers change
function MapBoundsUpdater({ markers }) {
  const map = useMap();
  
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [markers, map]);
  
  return null;
}

export default function MapSearch() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: "",
    bhk_multi: [],
    location_multi: [],
    listingType: "all",
    propertyCategory: "all",
    furnishing: "all",
    minPrice: "",
    maxPrice: "",
    amenities: [],
  });
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [viewMode, setViewMode] = useState("map");

  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => base44.entities.Property.list('-created_date'),
    initialData: [],
  });

  // Mumbai coordinates as default center
  const defaultCenter = [19.0760, 72.8777];

  // Location coordinates mapping (approximate)
  const locationCoords = {
    "Bandra West": [19.0596, 72.8295],
    "Bandra East": [19.0544, 72.8406],
    "Juhu": [19.1075, 72.8263],
    "Andheri West": [19.1136, 72.8697],
    "Andheri East": [19.1197, 72.8681],
    "Khar West": [19.0728, 72.8345],
    "BKC": [19.0653, 72.8687],
    "Worli": [19.0177, 72.8154],
    "Lower Parel": [18.9984, 72.8304],
    "Powai": [19.1197, 72.9058],
  };

  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      if (property.status !== "Active" || property.is_duplicate === true) return false;

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          property.building_name?.toLowerCase().includes(searchLower) ||
          property.location?.toLowerCase().includes(searchLower) ||
          property.pocket?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (filters.bhk_multi?.length > 0 && !filters.bhk_multi.includes(property.bhk)) return false;
      if (filters.location_multi?.length > 0 && !filters.location_multi.includes(property.location)) return false;
      if (filters.propertyCategory !== "all" && property.property_category !== filters.propertyCategory) return false;
      if (filters.listingType !== "all" && property.listing_type !== filters.listingType) return false;
      if (filters.furnishing !== "all" && property.furnishing !== filters.furnishing) return false;

      if (filters.amenities?.length > 0) {
        const hasAllAmenities = filters.amenities.every(amenity => 
          property.amenities?.includes(amenity)
        );
        if (!hasAllAmenities) return false;
      }

      if (filters.minPrice || filters.maxPrice) {
        const filterUnit = (filters.listingType === 'Sale' || filters.listingType === 'Pre Leased') ? 'crores' : 'lakhs';
        let propertyPriceNormalized = filterUnit === 'crores'
          ? (property.price_unit === "crores" ? property.price : property.price / 100)
          : (property.price_unit === "crores" ? property.price * 100 : property.price);

        if (filters.minPrice && propertyPriceNormalized < parseFloat(filters.minPrice)) return false;
        if (filters.maxPrice && propertyPriceNormalized > parseFloat(filters.maxPrice)) return false;
      }

      return true;
    });
  }, [properties, filters]);

  const mapMarkers = useMemo(() => {
    return filteredProperties
      .filter(p => p.location && locationCoords[p.location])
      .map(property => ({
        id: property.id,
        lat: locationCoords[property.location][0] + (Math.random() - 0.5) * 0.01,
        lng: locationCoords[property.location][1] + (Math.random() - 0.5) * 0.01,
        property
      }));
  }, [filteredProperties]);

  const formatPrice = (price, unit) => {
    if (unit === "crores") {
      return `₹${price} Cr`;
    }
    if (price >= 100) {
      return `₹${(price / 100).toFixed(2)} Cr`;
    }
    return `₹${price}L`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title="Map Search - Interactive Property Discovery | PropAI Live"
        description="Explore properties on an interactive map. Filter by location, price, amenities, and more. Real-time property discovery made visual."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Map Search</h1>
            <p className="text-slate-600">Explore {filteredProperties.length} properties visually</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setViewMode("map")}
              variant={viewMode === "map" ? "default" : "outline"}
              className="touch-manipulation"
            >
              <MapIcon className="w-4 h-4 mr-2" />
              Map View
            </Button>
            <Button
              onClick={() => setViewMode("list")}
              variant={viewMode === "list" ? "default" : "outline"}
              className="touch-manipulation"
            >
              <List className="w-4 h-4 mr-2" />
              List View
            </Button>
          </div>
        </div>

        <PropertyFilters
          filters={filters}
          onFilterChange={setFilters}
          onClearFilters={() => setFilters({
            search: "",
            bhk_multi: [],
            location_multi: [],
            listingType: "all",
            propertyCategory: "all",
            furnishing: "all",
            minPrice: "",
            maxPrice: "",
            amenities: [],
          })}
          allProperties={properties}
          showAmenitiesFilter={true}
        />

        {viewMode === "map" ? (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden" style={{ height: "600px" }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading map...</p>
                </div>
              </div>
            ) : mapMarkers.length > 0 ? (
              <MapContainer
                center={defaultCenter}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapBoundsUpdater markers={mapMarkers} />
                {mapMarkers.map(marker => (
                  <Marker
                    key={marker.id}
                    position={[marker.lat, marker.lng]}
                    eventHandlers={{
                      click: () => setSelectedProperty(marker.property)
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <h3 className="font-bold text-slate-900 mb-2">
                          {marker.property.ai_title || marker.property.bhk}
                        </h3>
                        <p className="text-sm text-slate-600 mb-2">{marker.property.location}</p>
                        <p className="text-lg font-bold text-blue-600 mb-3">
                          {formatPrice(marker.property.price, marker.property.price_unit)}
                        </p>
                        <Button
                          onClick={() => navigate(createPageUrl("PropertyDetails") + `?slug=${marker.property.slug || marker.property.id}`)}
                          size="sm"
                          className="w-full"
                        >
                          View Details
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No properties found in mapped locations</p>
                  <p className="text-sm text-slate-500 mt-2">Try adjusting your filters</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredProperties.map(property => (
              <Card key={property.id} className="p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl("PropertyDetails") + `?slug=${property.slug || property.id}`)}>
                <div className="flex justify-between items-start mb-3">
                  <Badge>{property.listing_type}</Badge>
                  <p className="text-lg font-bold text-blue-600">
                    {formatPrice(property.price, property.price_unit)}
                  </p>
                </div>
                <h3 className="font-bold text-slate-900 mb-2 line-clamp-2">
                  {property.ai_title || `${property.bhk} in ${property.location}`}
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{property.location}</span>
                </div>
                <div className="flex gap-2 text-xs text-slate-500">
                  <span>{property.bhk}</span>
                  <span>•</span>
                  <span>{property.carpet_area} sq.ft</span>
                  <span>•</span>
                  <span>{property.furnishing}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {selectedProperty && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full p-6 relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4"
                onClick={() => setSelectedProperty(null)}
              >
                <X className="w-5 h-5" />
              </Button>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                {selectedProperty.ai_title || `${selectedProperty.bhk} in ${selectedProperty.location}`}
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Price:</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {formatPrice(selectedProperty.price, selectedProperty.price_unit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Location:</span>
                  <span className="font-semibold">{selectedProperty.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Configuration:</span>
                  <span className="font-semibold">{selectedProperty.bhk}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Carpet Area:</span>
                  <span className="font-semibold">{selectedProperty.carpet_area} sq.ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Furnishing:</span>
                  <span className="font-semibold">{selectedProperty.furnishing}</span>
                </div>
              </div>
              <Button
                onClick={() => navigate(createPageUrl("PropertyDetails") + `?slug=${selectedProperty.slug || selectedProperty.id}`)}
                className="w-full mt-6"
              >
                View Full Details
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}