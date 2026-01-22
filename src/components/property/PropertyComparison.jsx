import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, MapPin, Check, Minus } from "lucide-react";

export default function PropertyComparison({ properties, onClose }) {
  if (!properties || properties.length === 0) return null;

  const formatPrice = (price, unit) => {
    if (unit === "crores") return `₹${price} Cr`;
    if (price >= 100) return `₹${(price / 100).toFixed(2)} Cr`;
    return `₹${price}L`;
  };

  const comparisonFields = [
    { key: 'price', label: 'Price', format: (p) => formatPrice(p.price, p.price_unit) },
    { key: 'bhk', label: 'Configuration' },
    { key: 'carpet_area', label: 'Carpet Area', format: (p) => `${p.carpet_area || '-'} sq.ft` },
    { key: 'built_up_area', label: 'Built-up Area', format: (p) => `${p.built_up_area || '-'} sq.ft` },
    { key: 'floor', label: 'Floor' },
    { key: 'furnishing', label: 'Furnishing' },
    { key: 'parking', label: 'Parking' },
    { key: 'location', label: 'Location' },
    { key: 'building_name', label: 'Building' },
    { key: 'possession', label: 'Possession' },
    { key: 'broker_trust_score', label: 'Broker Trust', format: (p) => `${p.broker_trust_score || 50}/100` },
  ];

  const getAllAmenities = () => {
    const allAmenities = new Set();
    properties.forEach(p => {
      p.amenities?.forEach(a => allAmenities.add(a));
    });
    return Array.from(allAmenities);
  };

  const amenities = getAllAmenities();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Properties ({properties.length})</DialogTitle>
        </DialogHeader>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-bold sticky left-0 bg-white z-10">Feature</th>
                {properties.map((property, idx) => (
                  <th key={property.id} className="p-4 min-w-[200px]">
                    <Card className="p-3 text-left">
                      <Badge className="mb-2">{property.listing_type}</Badge>
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-2 mb-2">
                        {property.ai_title || `${property.bhk} in ${property.location}`}
                      </h3>
                      <p className="text-lg font-bold text-blue-600">
                        {formatPrice(property.price, property.price_unit)}
                      </p>
                    </Card>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonFields.map(field => (
                <tr key={field.key} className="border-b hover:bg-slate-50">
                  <td className="p-4 font-semibold text-sm text-slate-700 sticky left-0 bg-white">
                    {field.label}
                  </td>
                  {properties.map(property => (
                    <td key={property.id} className="p-4 text-sm">
                      {field.format ? field.format(property) : (property[field.key] || '-')}
                    </td>
                  ))}
                </tr>
              ))}

              {amenities.length > 0 && (
                <>
                  <tr className="bg-slate-100">
                    <td colSpan={properties.length + 1} className="p-4 font-bold text-sm">
                      Amenities
                    </td>
                  </tr>
                  {amenities.map(amenity => (
                    <tr key={amenity} className="border-b hover:bg-slate-50">
                      <td className="p-4 text-sm text-slate-700 sticky left-0 bg-white">
                        {amenity}
                      </td>
                      {properties.map(property => (
                        <td key={property.id} className="p-4 text-center">
                          {property.amenities?.includes(amenity) ? (
                            <Check className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <Minus className="w-5 h-5 text-slate-300 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={onClose} variant="outline">
            Close Comparison
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}