import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import {
  Sparkles, RefreshCw, ArrowRight, Star, Shield,
  Home, MapPin, TrendingUp, CheckCircle2, MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function PropertyMatchmaker({ isOpen, onClose, allProperties }) {
  const [step, setStep] = useState(1); // 1: Input preferences, 2: Show matches
  const [loading, setLoading] = useState(false);
  
  // Preference state
  const [preferences, setPreferences] = useState({
    bhk: [],
    budgetMin: "",
    budgetMax: "",
    locations: [],
    listingType: "Rent",
    furnishing: "",
    lifestyle: "",
    mustHaveAmenities: "",
    additionalNotes: ""
  });

  const [matches, setMatches] = useState([]);

  const handleFindMatches = async () => {
    if (!preferences.lifestyle && preferences.bhk.length === 0) {
      toast.error('Please provide at least your lifestyle needs or BHK preference');
      return;
    }

    setLoading(true);

    const loadingToast = toast.loading('🤖 AI is analyzing properties...', {
      description: 'Matching your preferences with verified listings',
      className: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0',
    });

    try {
      // Filter properties by basic criteria first
      const eligibleProperties = allProperties.filter(p => {
        if (p.status !== "Active" || p.is_duplicate) return false;
        
        // Listing type
        if (p.listing_type !== preferences.listingType) return false;
        
        // BHK
        if (preferences.bhk.length > 0 && !preferences.bhk.includes(p.bhk)) return false;
        
        // Budget
        const priceInLakhs = p.price_unit === "crores" ? p.price * 100 : p.price;
        if (preferences.budgetMin && priceInLakhs < parseFloat(preferences.budgetMin)) return false;
        if (preferences.budgetMax && priceInLakhs > parseFloat(preferences.budgetMax)) return false;
        
        // Location
        if (preferences.locations.length > 0 && 
            !preferences.locations.some(loc => 
              p.location?.toLowerCase().includes(loc.toLowerCase()) ||
              p.pocket?.toLowerCase().includes(loc.toLowerCase())
            )) return false;
        
        return true;
      });

      if (eligibleProperties.length === 0) {
        toast.dismiss(loadingToast);
        toast.error('No properties match your basic criteria', {
          description: 'Try adjusting your budget or location preferences',
          className: 'bg-red-600 text-white border-0'
        });
        setLoading(false);
        return;
      }

      // Prepare properties for AI analysis (top 50 to keep prompt manageable)
      const propertiesForAI = eligibleProperties
        .sort((a, b) => (b.broker_trust_score || 50) - (a.broker_trust_score || 50))
        .slice(0, 50)
        .map(p => ({
          id: p.id,
          custom_id: p.custom_id,
          title: p.ai_title || `${p.bhk} in ${p.location}`,
          bhk: p.bhk,
          price: `₹${p.price}${p.price_unit === 'crores' ? ' Cr' : 'L'}`,
          location: p.location,
          pocket: p.pocket,
          building_name: p.building_name,
          carpet_area: p.carpet_area,
          furnishing: p.furnishing,
          amenities: p.amenities || [],
          expat_friendly: p.expat_friendly,
          veg_nonveg: p.veg_nonveg,
          description: p.ai_description || p.description,
          broker_trust_score: p.broker_trust_score || 50,
          images_count: p.images?.length || 0,
          slug: p.slug
        }));

      // Call AI for intelligent matching
      const prompt = `You are Chariot Realty's AI Property Matchmaker. Analyze the provided properties and match them to the client's preferences.

CLIENT PREFERENCES:
- Listing Type: ${preferences.listingType}
${preferences.bhk.length > 0 ? `- BHK: ${preferences.bhk.join(', ')}` : ''}
${preferences.budgetMin ? `- Min Budget: ₹${preferences.budgetMin}L` : ''}
${preferences.budgetMax ? `- Max Budget: ₹${preferences.budgetMax}L` : ''}
${preferences.locations.length > 0 ? `- Preferred Locations: ${preferences.locations.join(', ')}` : ''}
${preferences.furnishing ? `- Furnishing: ${preferences.furnishing}` : ''}
${preferences.lifestyle ? `- Lifestyle Needs: ${preferences.lifestyle}` : ''}
${preferences.mustHaveAmenities ? `- Must-Have Amenities: ${preferences.mustHaveAmenities}` : ''}
${preferences.additionalNotes ? `- Additional Notes: ${preferences.additionalNotes}` : ''}

AVAILABLE PROPERTIES (pre-filtered):
${JSON.stringify(propertiesForAI, null, 2)}

MATCHING CRITERIA:
1. **Lifestyle Fit**: Match lifestyle needs (expat-friendly, family-oriented, quiet, modern, etc.)
2. **Value for Money**: Consider price vs. amenities vs. location
3. **Trust Score**: Prioritize properties from high-trust brokers (70+)
4. **Data Quality**: Properties with photos and detailed descriptions rank higher
5. **Amenities**: Match must-have amenities
6. **Location Convenience**: Proximity to preferred areas

Return the TOP 3-5 BEST MATCHES in JSON format:
{
  "matches": [
    {
      "property_id": "id",
      "custom_id": "CHT-XXX-XXXX",
      "match_score": 95,
      "why_perfect": "2-3 sentences explaining why this property is a great fit",
      "pros": ["specific pro 1", "specific pro 2", "specific pro 3"],
      "considerations": ["any minor drawback or thing to note"],
      "best_for": "e.g., Expats seeking luxury with sea views"
    }
  ],
  "overall_summary": "1 sentence about the market and these recommendations"
}

Be honest, specific, and highlight REAL features. Don't make up details.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            matches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  property_id: { type: "string" },
                  custom_id: { type: "string" },
                  match_score: { type: "number" },
                  why_perfect: { type: "string" },
                  pros: { type: "array", items: { type: "string" } },
                  considerations: { type: "array", items: { type: "string" } },
                  best_for: { type: "string" }
                }
              }
            },
            overall_summary: { type: "string" }
          }
        }
      });

      toast.dismiss(loadingToast);

      // Enrich matches with full property data
      const enrichedMatches = response.matches.map(match => {
        const fullProperty = allProperties.find(p => p.id === match.property_id);
        return {
          ...match,
          property: fullProperty
        };
      }).filter(m => m.property); // Remove any matches where property wasn't found

      if (enrichedMatches.length === 0) {
        toast.error('No suitable matches found', {
          description: 'Try adjusting your preferences',
          className: 'bg-orange-600 text-white border-0'
        });
      } else {
        setMatches({ properties: enrichedMatches, summary: response.overall_summary });
        setStep(2);
        toast.success(`✨ Found ${enrichedMatches.length} Perfect Matches!`, {
          description: response.overall_summary,
          className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0',
          duration: 5000
        });
      }

    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('❌ Matchmaking Failed', {
        description: error.message || 'Something went wrong',
        className: 'bg-red-600 text-white border-0',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = (property, matchData) => {
    const message = `Hi! I found this property through Chariot's AI Matchmaker:\n\n` +
      `🏠 ${property.ai_title || `${property.bhk} in ${property.location}`}\n` +
      `💰 ${property.price}${property.price_unit === 'crores' ? ' Cr' : 'L'} | ${property.listing_type}\n` +
      `📍 ${property.building_name ? `${property.building_name}, ` : ''}${property.location}\n` +
      `${property.custom_id ? `🔖 ID: ${property.custom_id}\n` : ''}` +
      `\n🎯 AI Match Score: ${matchData.match_score}/100\n` +
      `${matchData.best_for ? `✨ Best For: ${matchData.best_for}\n` : ''}` +
      `\nCan you share more details?\n\nThank you!`;
    
    window.open(`https://wa.me/919819471310?text=${encodeURIComponent(message)}`, '_blank');
  };

  const uniqueBhks = [...new Set(allProperties.map(p => p.bhk).filter(Boolean))].sort();
  const uniqueLocations = [...new Set(allProperties.map(p => p.location).filter(Boolean))].sort();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-purple-500" />
            AI Property Matchmaker
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Input Preferences */}
          {step === 1 && (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-4 border border-purple-200">
                <p className="text-sm text-purple-900">
                  <strong>🎯 Tell us what you're looking for</strong> and our AI will analyze {allProperties.length} properties to find your perfect matches—prioritizing verified listings from trusted brokers.
                </p>
              </div>

              {/* Listing Type */}
              <div>
                <label className="text-sm font-semibold mb-2 block">What are you looking for?</label>
                <div className="flex gap-2">
                  {['Rent', 'Sale', 'Lease'].map(type => (
                    <Button
                      key={type}
                      onClick={() => setPreferences({ ...preferences, listingType: type })}
                      variant={preferences.listingType === type ? "default" : "outline"}
                      className={preferences.listingType === type ? "bg-purple-600" : ""}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              {/* BHK Multi-Select */}
              <div>
                <label className="text-sm font-semibold mb-2 block">BHK Configuration (select all that work)</label>
                <div className="flex flex-wrap gap-2">
                  {uniqueBhks.slice(0, 8).map(bhk => (
                    <Button
                      key={bhk}
                      onClick={() => {
                        const newBhk = preferences.bhk.includes(bhk)
                          ? preferences.bhk.filter(b => b !== bhk)
                          : [...preferences.bhk, bhk];
                        setPreferences({ ...preferences, bhk: newBhk });
                      }}
                      variant={preferences.bhk.includes(bhk) ? "default" : "outline"}
                      size="sm"
                      className={preferences.bhk.includes(bhk) ? "bg-purple-600" : ""}
                    >
                      {bhk}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Min Budget (Lakhs)</label>
                  <Input
                    type="number"
                    placeholder="e.g., 50"
                    value={preferences.budgetMin}
                    onChange={(e) => setPreferences({ ...preferences, budgetMin: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Max Budget (Lakhs)</label>
                  <Input
                    type="number"
                    placeholder="e.g., 200"
                    value={preferences.budgetMax}
                    onChange={(e) => setPreferences({ ...preferences, budgetMax: e.target.value })}
                  />
                </div>
              </div>

              {/* Locations */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Preferred Locations</label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                  {uniqueLocations.slice(0, 15).map(loc => (
                    <Button
                      key={loc}
                      onClick={() => {
                        const newLocs = preferences.locations.includes(loc)
                          ? preferences.locations.filter(l => l !== loc)
                          : [...preferences.locations, loc];
                        setPreferences({ ...preferences, locations: newLocs });
                      }}
                      variant={preferences.locations.includes(loc) ? "default" : "outline"}
                      size="sm"
                      className={preferences.locations.includes(loc) ? "bg-purple-600" : ""}
                    >
                      {loc}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Furnishing */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Furnishing Preference</label>
                <Select value={preferences.furnishing} onValueChange={(val) => setPreferences({ ...preferences, furnishing: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Any</SelectItem>
                    <SelectItem value="Fully Furnished">Fully Furnished</SelectItem>
                    <SelectItem value="Semi-Furnished">Semi-Furnished</SelectItem>
                    <SelectItem value="Unfurnished">Unfurnished</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Lifestyle Needs - THE KEY DIFFERENTIATOR */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Lifestyle & Special Needs (Important!)</label>
                <Textarea
                  placeholder="e.g., 'Moving from US, need expat-friendly building with international community. Work from home, need quiet area. Pet-friendly preferred. Close to good schools.'"
                  value={preferences.lifestyle}
                  onChange={(e) => setPreferences({ ...preferences, lifestyle: e.target.value })}
                  className="h-24"
                />
              </div>

              {/* Must-Have Amenities */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Must-Have Amenities</label>
                <Input
                  placeholder="e.g., Gym, Swimming Pool, Security"
                  value={preferences.mustHaveAmenities}
                  onChange={(e) => setPreferences({ ...preferences, mustHaveAmenities: e.target.value })}
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Additional Notes (Optional)</label>
                <Textarea
                  placeholder="Any other preferences or requirements..."
                  value={preferences.additionalNotes}
                  onChange={(e) => setPreferences({ ...preferences, additionalNotes: e.target.value })}
                  className="h-20"
                />
              </div>

              {/* Action Button */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleFindMatches}
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white flex-1 h-12 text-lg font-bold"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Find My Perfect Matches
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Show Matches */}
          {step === 2 && matches.properties && (
            <motion.div
              key="matches"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Summary */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
                <p className="text-sm text-green-900 font-medium">
                  <CheckCircle2 className="w-4 h-4 inline mr-2" />
                  {matches.summary}
                </p>
              </div>

              {/* Matches */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {matches.properties.map((match, idx) => (
                  <motion.div
                    key={match.property.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-2xl border-2 border-purple-200 p-5 hover:shadow-lg transition-all"
                  >
                    {/* Match Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-600 text-white border-0">
                          #{idx + 1} Match
                        </Badge>
                        <Badge className="bg-green-500/20 text-green-700 border-green-500">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          {match.match_score}/100
                        </Badge>
                        {match.property.broker_trust_score >= 70 && (
                          <Badge className="bg-blue-500/20 text-blue-700 border-blue-500">
                            <Shield className="w-3 h-3 mr-1" />
                            Trusted
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Property Title */}
                    <h3 className="text-lg font-bold text-[#111111] mb-2">
                      {match.property.ai_title || `${match.property.bhk} in ${match.property.location}`}
                    </h3>

                    {/* Property Details */}
                    <div className="flex items-center gap-4 text-sm text-[#3B3B3B] mb-3">
                      <span className="flex items-center gap-1">
                        <Home className="w-4 h-4" />
                        {match.property.bhk}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {match.property.location}
                      </span>
                      <span className="font-bold text-lg text-amber-600">
                        ₹{match.property.price}{match.property.price_unit === 'crores' ? ' Cr' : 'L'}
                      </span>
                    </div>

                    {/* Why Perfect */}
                    <div className="mb-3">
                      <p className="text-sm text-[#3B3B3B] italic bg-purple-50 p-3 rounded-lg border border-purple-200">
                        ""{match.why_perfect}""
                      </p>
                    </div>

                    {/* Pros */}
                    {match.pros && match.pros.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-[#111111] mb-2">✅ Why This Works:</p>
                        <div className="space-y-1">
                          {match.pros.map((pro, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-[#3B3B3B]">
                              <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{pro}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Considerations */}
                    {match.considerations && match.considerations.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-[#111111] mb-2">💡 Things to Note:</p>
                        <div className="space-y-1">
                          {match.considerations.map((con, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-orange-700">
                              <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span>{con}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Best For */}
                    {match.best_for && (
                      <Badge variant="outline" className="mb-3 text-xs border-purple-300">
                        🎯 {match.best_for}
                      </Badge>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-purple-100">
                      <Button
                        onClick={() => {
                          const url = match.property.slug
                            ? `/propertydetails?slug=${match.property.slug}`
                            : `/propertydetails?id=${match.property.id}`;
                          window.open(url, '_blank');
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button
                        onClick={() => handleWhatsApp(match.property, match)}
                        size="sm"
                        className="bg-[#25D366] hover:bg-[#20BD5A] text-white flex-1"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => {
                    setStep(1);
                    setMatches([]);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Adjust Preferences
                </Button>
                <Button
                  onClick={onClose}
                  className="bg-[#111111] text-white flex-1"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}