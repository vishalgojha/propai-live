import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Play, RefreshCw, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AIDebugConsole({ properties }) {
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [generationTime, setGenerationTime] = useState(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);

  // Find selected property
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  const generateEnrichment = async () => {
    if (!selectedProperty) {
      toast.error("Please select a property first");
      return;
    }

    setIsGenerating(true);
    setResult(null);
    setGenerationTime(null);
    const startTime = performance.now();

    try {
      // ✅ Price validation
      const priceInLakhs = selectedProperty.price_unit === 'crores' 
        ? selectedProperty.price * 100 
        : selectedProperty.price;
      
      let priceWarning = '';
      
      if (selectedProperty.listing_type === 'Sale' || selectedProperty.listing_type === 'Pre Leased') {
        if (selectedProperty.property_category === 'Residential') {
          if (priceInLakhs > 10000) {
            priceWarning = '⚠️ WARNING: Price seems unusually high for residential (>100 Cr). Verify data accuracy.';
          } else if (priceInLakhs < 50) {
            priceWarning = '⚠️ WARNING: Price seems too low for Mumbai property (<50L). Verify data accuracy.';
          }
        } else if (selectedProperty.property_category === 'Commercial') {
          if (priceInLakhs > 20000) {
            priceWarning = '⚠️ WARNING: Price seems extremely high for commercial (>200 Cr). Verify data accuracy.';
          }
        }
      } else if (selectedProperty.listing_type === 'Rent' || selectedProperty.listing_type === 'Lease') {
        if (selectedProperty.property_category === 'Residential') {
          if (priceInLakhs > 20) {
            priceWarning = '⚠️ WARNING: Monthly rent seems very high (>20L/month). Verify data accuracy.';
          }
        } else if (selectedProperty.property_category === 'Commercial') {
          if (priceInLakhs > 50) {
            priceWarning = '⚠️ WARNING: Monthly rent seems very high (>50L/month). Verify data accuracy.';
          }
        }
      }

      const defaultPrompt = `You are writing property listings for a Mumbai real estate platform. Write naturally, like a knowledgeable local broker who's direct and informative.

**Property Details:**
- Type: ${selectedProperty.bhk} ${selectedProperty.property_category || 'Residential'}
- Price: ₹${selectedProperty.price} ${selectedProperty.price_unit} ${priceWarning ? `\n${priceWarning}` : ''}
- Listing: ${selectedProperty.listing_type}
- Location: ${selectedProperty.location}${selectedProperty.pocket ? ` (${selectedProperty.pocket})` : ''}
- Building: ${selectedProperty.building_name || 'Not specified'}
- Area: ${selectedProperty.carpet_area || 'Not specified'} sq.ft
- Furnishing: ${selectedProperty.furnishing || 'Not specified'}
- Floor: ${selectedProperty.floor || 'N/A'}${selectedProperty.total_floors ? ` of ${selectedProperty.total_floors}` : ''}
- Parking: ${selectedProperty.parking || 'Not specified'}
- View: ${selectedProperty.view || 'N/A'}
- Amenities: ${selectedProperty.amenities?.slice(0, 5).join(', ') || 'Standard amenities'}

**Mumbai Real Estate Context (Typical Pricing):**
- Residential Sale: ₹1-30 Cr (premium areas like Bandra, Worli, BKC can go ₹5-50 Cr)
- Residential Rent: ₹50k-5L/month (luxury can be ₹10-20L/month)
- Commercial Sale: ₹5-100 Cr (depends heavily on location and size)
- Commercial Rent: ₹2L-30L/month (Grade A buildings command premium)

**Generate JSON:**
{
  "title": "Natural title here",
  "description": "Natural description here"
}

**Title Rules (12-18 words):**
❌ NEVER use: "Charming", "Stunning", "Luxurious", "Premium", "Elegant", "Exquisite", "Heart of", "Just steps from", "Nestled in", "Boasts"
✅ DO use: Specific features, actual amenities, real location details
✅ Format: "[Size/Type] [Key Feature] in [Specific Location]"
✅ Examples:
  - "Fully Furnished 3 BHK with Sea View in Bandra West, 2 Covered Parking"
  - "Spacious 2 BHK Office Space in BKC with Modern Fit-Out and Metro Access"
  - "1800 sq.ft 4 BHK Apartment in Worli, Top Floor with City Views"
⚠️ If price seems unusual: DO NOT mention the price in title/description, let the numbers speak

**Description Rules (40-80 words, one paragraph):**
❌ NEVER use: Generic adjectives, flowery language, "offers", "features", "boasts"
✅ DO write: Direct, factual, specific
✅ Start with: What makes it practical/useful
✅ Mention: Building reputation (if known), connectivity, specific amenities, tenant suitability
✅ Examples:
  - "This 2 BHK in Oberoi Sky Heights comes fully furnished with modular kitchen, split ACs, and 2 covered parking. Located on Linking Road, you're walking distance to Bandra station and major restaurants. Building has 24/7 security and backup power."
  - "Commercial space on the 8th floor of a Grade A building in BKC. Modern glass facade, central AC, 2 washrooms, and pantry area included. Direct metro access makes client meetings easy. Suitable for consulting firms or small tech companies."
⚠️ If price seems unusual: Focus on property features, avoid price commentary

**Mumbai Context:**
- Mention metro stations, railway stations if nearby
- Reference known buildings by name if applicable
- Note if expat-friendly, pet-friendly, veg-only (if specified)
- Connectivity matters: mention if near highways, airports
- Area vibe: Bandra = trendy/expat hub, BKC = corporate, Worli = sea-facing luxury, Lower Parel = mills redevelopment

Return ONLY the JSON, nothing else.`;

      const prompt = useCustomPrompt ? customPrompt : defaultPrompt;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" }
          },
          required: ["title", "description"]
        }
      });

      const endTime = performance.now();
      setGenerationTime(Math.round(endTime - startTime));

      setResult({
        title: response.title,
        description: response.description,
        priceWarning,
        prompt: prompt
      });

      toast.success("✅ AI Enrichment Complete!", {
        description: `Generated in ${Math.round(endTime - startTime)}ms`
      });

    } catch (error) {
      console.error("AI generation failed:", error);
      toast.error("❌ Generation Failed", {
        description: error.message
      });
      setResult({ error: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(result?.prompt || "");
    toast.success("Prompt copied to clipboard");
  };

  const applyToProperty = async () => {
    if (!result || !selectedProperty) return;

    try {
      await base44.entities.Property.update(selectedProperty.id, {
        ai_title: result.title,
        ai_description: result.description
      });
      toast.success("✅ Property Updated!", {
        description: "Title and description applied successfully"
      });
    } catch (error) {
      toast.error("Failed to update property", {
        description: error.message
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">AI Enrichment Debug Console</h3>
            <p className="text-sm text-slate-600">Test AI generation on individual properties</p>
          </div>
        </div>

        {/* Property Selector */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">
              Select Property to Test
            </label>
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a property..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {properties.slice(0, 50).map((prop) => (
                  <SelectItem key={prop.id} value={prop.id}>
                    {prop.custom_id || prop.id} - {prop.bhk} in {prop.location} (₹{prop.price}{prop.price_unit === 'crores' ? 'Cr' : 'L'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Prompt Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="use-custom-prompt"
              checked={useCustomPrompt}
              onChange={(e) => setUseCustomPrompt(e.target.checked)}
              className="w-4 h-4 rounded accent-purple-600"
            />
            <label htmlFor="use-custom-prompt" className="text-sm font-semibold text-slate-700 cursor-pointer">
              Use Custom Prompt
            </label>
          </div>

          {useCustomPrompt && (
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Enter your custom prompt here..."
              className="min-h-[200px] font-mono text-xs"
            />
          )}

          {/* Selected Property Preview */}
          {selectedProperty && (
            <div className="bg-white rounded-xl p-4 border border-purple-200">
              <h4 className="font-semibold text-slate-900 mb-2">Property Details:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-500">ID:</span> <span className="font-mono">{selectedProperty.custom_id}</span></div>
                <div><span className="text-slate-500">Type:</span> {selectedProperty.bhk}</div>
                <div><span className="text-slate-500">Location:</span> {selectedProperty.location}</div>
                <div><span className="text-slate-500">Price:</span> ₹{selectedProperty.price} {selectedProperty.price_unit}</div>
                <div><span className="text-slate-500">Area:</span> {selectedProperty.carpet_area || 'N/A'} sq.ft</div>
                <div><span className="text-slate-500">Furnishing:</span> {selectedProperty.furnishing || 'N/A'}</div>
              </div>
              
              {selectedProperty.ai_title && (
                <div className="mt-3 pt-3 border-t border-purple-100">
                  <p className="text-xs text-slate-500 mb-1">Current AI Title:</p>
                  <p className="text-sm font-semibold text-slate-700">{selectedProperty.ai_title}</p>
                </div>
              )}
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={generateEnrichment}
            disabled={!selectedProperty || isGenerating}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold h-12"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Generate AI Enrichment
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {result && (
        <Card className="p-6 border-2 border-green-200 bg-green-50/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h4 className="font-bold text-slate-900">Generation Result</h4>
              {generationTime && (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  {generationTime}ms
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={copyPrompt}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy Prompt
              </Button>
              <Button
                onClick={applyToProperty}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white text-xs"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Apply to Property
              </Button>
            </div>
          </div>

          {result.error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 mb-1">Error</p>
                  <p className="text-sm text-red-700">{result.error}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Price Warning */}
              {result.priceWarning && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900 mb-1">Price Validation</p>
                      <p className="text-sm text-amber-700">{result.priceWarning}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Generated Title */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Generated Title ({result.title?.split(' ').length || 0} words)
                </label>
                <div className="bg-white border border-green-200 rounded-xl p-4">
                  <p className="text-slate-900 font-semibold">{result.title}</p>
                </div>
              </div>

              {/* Generated Description */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Generated Description ({result.description?.split(' ').length || 0} words)
                </label>
                <div className="bg-white border border-green-200 rounded-xl p-4">
                  <p className="text-slate-900 leading-relaxed">{result.description}</p>
                </div>
              </div>

              {/* Prompt Preview */}
              <details className="group">
                <summary className="cursor-pointer font-semibold text-slate-700 text-sm hover:text-purple-700 transition-colors">
                  View Full Prompt
                  <span className="ml-2 text-xs text-slate-500">(click to expand)</span>
                </summary>
                <div className="mt-2 bg-slate-900 rounded-xl p-4 overflow-auto">
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                    {result.prompt}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}