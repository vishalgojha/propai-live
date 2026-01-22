import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Check, Minus, MapPin, Building2, Maximize2 } from "lucide-react";

export default function PropertyComparison({ properties, isOpen, onClose }) {
  if (!properties || properties.length === 0) return null;

  const formatPrice = (price, unit) => {
    if (unit === "crores") {
      return `₹${price} Cr`;
    }
    return price >= 100 ? `₹${(price / 100).toFixed(2)} Cr` : `₹${price} L`;
  };

  const compareRows = [
    { label: "BHK", key: "bhk" },
    { label: "Price", key: "price", formatter: (p) => formatPrice(p.price, p.price_unit) },
    { label: "Carpet Area", key: "carpet_area", formatter: (p) => p.carpet_area ? `${p.carpet_area} sq.ft` : "N/A" },
    { label: "Location", key: "location" },
    { label: "Building", key: "building_name", formatter: (p) => p.building_name || "N/A" },
    { label: "Floor", key: "floor", formatter: (p) => p.floor ? `${p.floor}/${p.total_floors || '?'}` : "N/A" },
    { label: "Furnishing", key: "furnishing" },
    { label: "Parking", key: "parking", formatter: (p) => p.parking || "N/A" },
    { label: "Possession", key: "possession", formatter: (p) => p.possession || "N/A" },
    { label: "Listing Type", key: "listing_type" },
    { label: "Broker Trust", key: "broker_trust_score", formatter: (p) => p.broker_trust_score ? `${p.broker_trust_score}/100` : "N/A" },
  ];

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Compare Properties ({properties.length})</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-4 text-left font-bold text-slate-900 sticky left-0 bg-slate-50 border-r border-slate-200">
                  Feature
                </th>
                {properties.map((property, idx) => (
                  <th key={property.id} className="p-4 min-w-[250px]">
                    <div className="text-left">
                      <p className="font-bold text-slate-900 mb-1">{property.bhk}</p>
                      <p className="text-sm text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {property.location}
                      </p>
                      <p className="text-lg font-bold text-blue-600 mt-2">
                        {formatPrice(property.price, property.price_unit)}
                      </p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareRows.map((row, rowIdx) => (
                <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="p-4 font-semibold text-slate-700 sticky left-0 bg-inherit border-r border-slate-200">
                    {row.label}
                  </td>
                  {properties.map((property) => {
                    const value = row.formatter 
                      ? row.formatter(property)
                      : property[row.key] || "N/A";
                    
                    return (
                      <td key={property.id} className="p-4 text-slate-900">
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))}

              <tr className="bg-white">
                <td className="p-4 font-semibold text-slate-700 sticky left-0 bg-white border-r border-slate-200">
                  Amenities
                </td>
                {properties.map((property) => (
                  <td key={property.id} className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {property.amenities && property.amenities.length > 0 ? (
                        property.amenities.slice(0, 5).map((amenity, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-slate-500 text-sm">None listed</span>
                      )}
                      {property.amenities && property.amenities.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{property.amenities.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}