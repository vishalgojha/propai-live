import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { MapPin, Eye } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Mumbai coordinates as default center
const DEFAULT_CENTER = [19.0760, 72.8777];
const DEFAULT_ZOOM = 12;

export default function MapView({ properties, onPropertySelect }) {
  const navigate = useNavigate();

  // Group properties by location with approximate coordinates
  const locationCoordinates = {
    "Bandra West": [19.0596, 72.8295],
    "Bandra East": [19.0596, 72.8445],
    "Khar West": [19.0720, 72.8330],
    "Juhu": [19.1075, 72.8263],
    "Andheri West": [19.1136, 72.8697],
    "Andheri East": [19.1136, 72.8697],
    "BKC": [19.0608, 72.8683],
    "Worli": [19.0135, 72.8184],
    "Lower Parel": [18.9969, 72.8269],
    "Powai": [19.1197, 72.9058],
    "Versova": [19.1317, 72.8117],
    "Santacruz West": [19.0840, 72.8360],
    "Goregaon West": [19.1656, 72.8497],
    "Malad West": [19.1864, 72.8484],
    "Kandivali West": [19.2040, 72.8300],
    "Borivali West": [19.2304, 72.8565],
  };

  const mapData = useMemo(() => {
    const grouped = {};
    
    properties.forEach(property => {
      const coords = locationCoordinates[property.location];
      if (coords) {
        const key = `${coords[0]}_${coords[1]}`;
        if (!grouped[key]) {
          grouped[key] = {
            coordinates: coords,
            location: property.location,
            properties: []
          };
        }
        grouped[key].properties.push(property);
      }
    });

    return Object.values(grouped);
  }, [properties]);

  const formatPrice = (price, unit) => {
    if (unit === "crores") {
      return `₹${price}Cr`;
    }
    return price >= 100 ? `₹${(price / 100).toFixed(2)}Cr` : `₹${price}L`;
  };

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden border border-slate-200 shadow-lg">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {mapData.map((cluster, idx) => (
          <Marker key={idx} position={cluster.coordinates}>
            <Popup maxWidth={300}>
              <div className="p-2">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900">{cluster.location}</h3>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  {cluster.properties.length} {cluster.properties.length === 1 ? 'property' : 'properties'} available
                </p>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cluster.properties.slice(0, 3).map((property) => (
                    <div 
                      key={property.id}
                      className="bg-slate-50 rounded-lg p-2 border border-slate-200"
                    >
                      <p className="font-semibold text-sm text-slate-900">{property.bhk}</p>
                      <p className="text-xs text-slate-600">{property.building_name || 'Building name N/A'}</p>
                      <p className="text-sm font-bold text-blue-600">
                        {formatPrice(property.price, property.price_unit)}
                      </p>
                      <Button
                        onClick={() => onPropertySelect(property)}
                        size="sm"
                        className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
                
                {cluster.properties.length > 3 && (
                  <Button
                    onClick={() => navigate(`${createPageUrl("SmartFeed")}?location=${encodeURIComponent(cluster.location)}`)}
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                  >
                    View All {cluster.properties.length} Properties
                  </Button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}