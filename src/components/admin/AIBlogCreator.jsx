import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2, CheckCircle2, BookOpen, Wand2, Copy, X, Database, TrendingUp, Building2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";

export default function AIBlogCreator() {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Mode selection
  const [mode, setMode] = useState("data-driven"); // "data-driven" or "custom"
  
  // Data-driven inputs
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedDeveloper, setSelectedDeveloper] = useState("");
  const [dataTemplate, setDataTemplate] = useState("location_deep_dive");
  
  // Custom mode inputs
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("Neighborhood Guide");
  const [customPrompt, setCustomPrompt] = useState("");
  
  // Available data
  const [locations, setLocations] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [developers, setDevelopers] = useState([]);
  
  // Generated content
  const [generatedContent, setGeneratedContent] = useState(null);
  const [marketData, setMarketData] = useState(null);

  const categories = [
    "Neighborhood Guide",
    "Rental & Legal",
    "Expat Series",
    "Market Insights",
    "Real Stories"
  ];

  const dataTemplates = [
    { value: "location_deep_dive", label: "📍 Location Deep Dive", category: "Neighborhood Guide" },
    { value: "building_spotlight", label: "🏢 Building Spotlight", category: "Neighborhood Guide" },
    { value: "developer_profile", label: "🏗️ Developer Profile", category: "Market Insights" },
    { value: "pricing_trends", label: "💰 Pricing Trends", category: "Market Insights" },
    { value: "location_comparison", label: "⚖️ Location vs Location", category: "Neighborhood Guide" },
  ];

  // Load available data on mount
  useEffect(() => {
    if (isExpanded && mode === "data-driven") {
      loadAvailableData();
    }
  }, [isExpanded, mode]);

  const loadAvailableData = async () => {
    setIsLoadingData(true);
    try {
      const [props, bldgs, devs] = await Promise.all([
        base44.entities.Property.list('-created_date', 1000),
        base44.entities.Building.list('-updated_date', 500),
        base44.entities.Developer.list('-updated_date', 200)
      ]);

      // Extract unique locations with property counts
      const locationMap = {};
      props.forEach(p => {
        if (p.location && p.status === 'Active') {
          locationMap[p.location] = (locationMap[p.location] || 0) + 1;
        }
      });
      const locs = Object.entries(locationMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
      
      setLocations(locs);
      setBuildings(bldgs.filter(b => b.active_listings > 0).slice(0, 100));
      setDevelopers(devs.filter(d => d.total_buildings_tracked > 0).slice(0, 50));
      
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load data for blog generation");
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchMarketData = async () => {
    setIsLoadingData(true);
    try {
      let data = {};
      
      if (dataTemplate === "location_deep_dive" && selectedLocation) {
        // Fetch all properties in this location
        const allProps = await base44.entities.Property.list('-created_date', 2000);
        const locationProps = allProps.filter(p => 
          p.location === selectedLocation && p.status === 'Active' && !p.is_duplicate
        );
        
        // Calculate stats
        const rentals = locationProps.filter(p => p.listing_type === 'Rent');
        const sales = locationProps.filter(p => p.listing_type === 'Sale');
        
        const bhkBreakdown = {};
        locationProps.forEach(p => {
          bhkBreakdown[p.bhk] = (bhkBreakdown[p.bhk] || 0) + 1;
        });
        
        // Average prices by BHK for rentals
        const avgRentByBhk = {};
        rentals.forEach(p => {
          const priceInLakhs = p.price_unit === 'crores' ? p.price * 100 : p.price;
          if (!avgRentByBhk[p.bhk]) avgRentByBhk[p.bhk] = [];
          avgRentByBhk[p.bhk].push(priceInLakhs);
        });
        Object.keys(avgRentByBhk).forEach(bhk => {
          const prices = avgRentByBhk[bhk];
          avgRentByBhk[bhk] = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
        });
        
        // Average prices by BHK for sales
        const avgSaleByBhk = {};
        sales.forEach(p => {
          const priceInCrores = p.price_unit === 'crores' ? p.price : p.price / 100;
          if (!avgSaleByBhk[p.bhk]) avgSaleByBhk[p.bhk] = [];
          avgSaleByBhk[p.bhk].push(priceInCrores);
        });
        Object.keys(avgSaleByBhk).forEach(bhk => {
          const prices = avgSaleByBhk[bhk];
          avgSaleByBhk[bhk] = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
        });
        
        // Top buildings in area
        const buildingCounts = {};
        locationProps.forEach(p => {
          if (p.building_name) {
            buildingCounts[p.building_name] = (buildingCounts[p.building_name] || 0) + 1;
          }
        });
        const topBuildings = Object.entries(buildingCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, listings: count }));
        
        // Furnishing breakdown
        const furnishingCounts = {};
        locationProps.forEach(p => {
          if (p.furnishing) {
            furnishingCounts[p.furnishing] = (furnishingCounts[p.furnishing] || 0) + 1;
          }
        });
        
        data = {
          location: selectedLocation,
          totalListings: locationProps.length,
          activeRentals: rentals.length,
          activeSales: sales.length,
          bhkBreakdown,
          avgRentByBhk,
          avgSaleByBhk,
          topBuildings,
          furnishingCounts,
          sampleProperties: locationProps.slice(0, 3).map(p => ({
            bhk: p.bhk,
            price: p.price,
            price_unit: p.price_unit,
            building: p.building_name,
            furnishing: p.furnishing
          }))
        };
        
      } else if (dataTemplate === "building_spotlight" && selectedBuilding) {
        const allBuildings = await base44.entities.Building.list();
        const building = allBuildings.find(b => b.id === selectedBuilding);
        
        if (building) {
          const allProps = await base44.entities.Property.list('-created_date', 2000);
          const buildingProps = allProps.filter(p => p.building_id === building.id);
          
          data = {
            building: building.name,
            location: building.location,
            developer: building.developer_name,
            developerTier: building.developer_tier,
            totalListings: building.total_listings || buildingProps.length,
            activeListings: building.active_listings || buildingProps.filter(p => p.status === 'Active').length,
            avgRent2BHK: building.avg_rent_2bhk,
            avgRent3BHK: building.avg_rent_3bhk,
            avgSale2BHK: building.avg_sale_2bhk,
            avgSale3BHK: building.avg_sale_3bhk,
            amenities: building.amenities || [],
            tags: building.tags || [],
            buildingSummary: building.building_summary,
            yearBuilt: building.year_built,
            totalFloors: building.total_floors
          };
        }
        
      } else if (dataTemplate === "developer_profile" && selectedDeveloper) {
        const allDevelopers = await base44.entities.Developer.list();
        const developer = allDevelopers.find(d => d.id === selectedDeveloper);
        
        if (developer) {
          const allBuildings = await base44.entities.Building.list();
          const devBuildings = allBuildings.filter(b => b.developer_id === developer.id);
          
          data = {
            name: developer.name,
            tier: developer.tier,
            totalProjects: developer.total_projects,
            totalBuildings: developer.total_buildings_tracked,
            keyFocusAreas: developer.key_focus_areas || [],
            notableProjects: developer.notable_projects || [],
            specializations: developer.specializations || [],
            locationsActive: developer.locations_active || [],
            reputationScore: developer.reputation_score,
            deliveryTrackRecord: developer.delivery_track_record,
            marketSegment: developer.market_segment,
            avgPricePerSqft: developer.avg_price_per_sqft,
            buildings: devBuildings.slice(0, 10).map(b => ({
              name: b.name,
              location: b.location,
              activeListings: b.active_listings
            }))
          };
        }
      }
      
      setMarketData(data);
      return data;
      
    } catch (error) {
      console.error("Failed to fetch market data:", error);
      toast.error("Failed to fetch market data");
      return null;
    } finally {
      setIsLoadingData(false);
    }
  };

  const generateDataDrivenBlog = async () => {
    const data = await fetchMarketData();
    if (!data) return;

    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      let prompt = "";
      let targetCategory = "";
      
      if (dataTemplate === "location_deep_dive") {
        targetCategory = "Neighborhood Guide";
        prompt = `Write a HUMAN neighborhood guide about ${data.location}, Mumbai.

**USE THESE EXACT REAL NUMBERS:**
- Active Listings: ${data.totalListings} (${data.activeRentals} rent, ${data.activeSales} sale)
- BHK Split: ${JSON.stringify(data.bhkBreakdown)}
- Avg Rent: ${JSON.stringify(data.avgRentByBhk)}
- Avg Sale: ${JSON.stringify(data.avgSaleByBhk)}
- Top Buildings: ${data.topBuildings.map(b => b.name).join(', ')}

**Recent Examples:**
${data.sampleProperties.map(p => `${p.bhk} ₹${p.price}${p.price_unit === 'crores' ? 'Cr' : 'L'} ${p.building || ''} ${p.furnishing || ''}`).join('\n')}

**CRITICAL - WRITE LIKE A HUMAN:**

❌ BANNED:
"Let's dive into", "When it comes to", "vibrant", "dynamic", "comprehensive"
Exclamation marks everywhere!!! Overly enthusiastic tone!!!

✅ DO THIS:
- Short sentences. Get to the point.
- Real data first. Examples second.
- Name actual buildings/streets
- Active voice only
- No marketing speak

**EXAMPLES:**

❌ BAD: "Bandra West has emerged as one of Mumbai's most vibrant and dynamic neighborhoods, offering a comprehensive range of premium lifestyle amenities!"

✅ GOOD: "${data.location} has ${data.totalListings} active listings. 2BHK rents average ₹${data.avgRentByBhk['2 BHK'] || 'X'}L. Here's what that buys you."

**STRUCTURE (MAX 800 WORDS):**

1. **Opening** (2 sentences):
   - Data point + what it means
   - Example: "${data.location}: ${data.totalListings} listings, mostly ${Object.keys(data.bhkBreakdown)[0]}. Prices just hit ₹XL."

2. **Pricing Table** (clean markdown):
   - Rent and Sale prices by BHK
   - Use actual numbers from data

3. **Top Buildings** (3-4 sentences):
   - List ${data.topBuildings.slice(0, 3).map(b => b.name).join(', ')}
   - Why they're popular

4. **Who Lives Here** (2-3 sentences):
   - Infer from furnishing data (${data.furnishingCounts.Furnished ? 'mostly furnished = expats/corporates' : 'unfurnished = families'})

5. **Reality Check** (3 short bullets):
   - 1 pro, 1 con, 1 verdict

Return JSON: title (under 60 chars), excerpt (under 150 chars), content (markdown), tags (5 max), read_time.`;

      } else if (dataTemplate === "building_spotlight") {
        targetCategory = "Neighborhood Guide";
        prompt = `Write about ${data.building}, ${data.location}.

**DATA (use exact numbers):**
- ${data.totalListings} listings tracked (${data.activeListings} active now)
- Developer: ${data.developer}${data.developerTier ? ` (${data.developerTier})` : ''}
- 2BHK rent: ${data.avgRent2BHK ? `₹${data.avgRent2BHK}L` : 'varies'} | sale: ${data.avgSale2BHK ? `₹${data.avgSale2BHK}Cr` : 'varies'}
- 3BHK rent: ${data.avgRent3BHK ? `₹${data.avgRent3BHK}L` : 'varies'} | sale: ${data.avgSale3BHK ? `₹${data.avgSale3BHK}Cr` : 'varies'}
- Built: ${data.yearBuilt || 'unknown'}
- Amenities: ${data.amenities?.slice(0, 5).join(', ') || 'basic'}

${data.buildingSummary ? `\nContext: ${data.buildingSummary}` : ''}

**WRITE LIKE A HUMAN (MAX 600 WORDS):**

❌ NO: "Let's explore this stunning building!", "vibrant community", "nestled in"
✅ YES: "${data.building} costs ₹XL for 2BHK. ${data.developer} built it. Here's if it's worth it."

**FORMAT:**

**Opening** (1 sentence): 
"${data.building}: ${data.activeListings} active listings, ₹XL avg rent."

**Pricing** (markdown table):
| BHK | Rent | Sale |
|-----|------|------|
| 2   | ₹XL  | ₹XCr |
| 3   | ₹XL  | ₹XCr |

**What You Get** (3 bullets):
- Developer tier
- Key amenities
- Building age

**Who It's For** (2 sentences):
Based on furnishing/pricing data

**Verdict** (1 sentence):
Worth it? Skip it?

Return JSON: title (under 50 chars), excerpt (under 120 chars, no fluff), content (markdown), tags (3-5), read_time.`;

      } else if (dataTemplate === "developer_profile") {
        targetCategory = "Market Insights";
        prompt = `Write about ${data.name} (${data.tier} developer).

**DATA:**
- ${data.totalBuildings} buildings tracked
- ${data.totalProjects || 'Multiple'} total projects
- Segment: ${data.marketSegment}
- Delivery: ${data.deliveryTrackRecord}
- Avg ₹/sqft: ${data.avgPricePerSqft ? `₹${data.avgPricePerSqft}` : 'varies'}
- Active in: ${data.locationsActive?.slice(0, 3).join(', ') || 'Mumbai'}

**Their Buildings:**
${data.buildings?.slice(0, 5).map(b => `${b.name} (${b.location})`).join(', ') || 'Multiple projects'}

**WRITE LIKE A HUMAN (MAX 500 WORDS):**

NO AI fluff. Just facts.

**Opening:** 
"${data.name}: ${data.tier}, ${data.totalBuildings} buildings tracked. ${data.deliveryTrackRecord} delivery record."

**What They Build:**
- Projects: ${data.notableProjects?.slice(0, 3).join(', ') || 'various'}
- Focus: ${data.keyFocusAreas?.join(', ') || data.marketSegment}

**Pricing Strategy** (if data available):
Avg ₹${data.avgPricePerSqft || 'X'}/sqft. ${data.marketSegment} segment.

**Track Record:**
Delivery: ${data.deliveryTrackRecord}. Reputation: ${data.reputationScore || 'TBD'}/100.

**Buildings Table:**
| Building | Location | Activity |
|----------|----------|----------|
${data.buildings?.slice(0, 5).map(b => `| ${b.name} | ${b.location} | ${b.activeListings || 0} active |`).join('\n') || '| N/A | N/A | N/A |'}

**Verdict** (2 sentences):
Who should buy from them? What to watch for?

Return JSON: title (developer name + 1 insight), excerpt (1 sentence summary), content (markdown), tags (3-4), read_time.`;

      }
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            excerpt: { type: "string" },
            content: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            read_time: { type: "number" }
          },
          required: ["title", "excerpt", "content"]
        }
      });

      setGeneratedContent(response);
      setCategory(targetCategory);
      
      toast.success("✨ Data-Driven Blog Generated!", {
        description: "Review the real market insights and publish",
        duration: 3000
      });

    } catch (error) {
      console.error("Generation failed:", error);
      toast.error("Failed to generate blog", {
        description: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCustomBlog = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const prompt = customPrompt || `Write a blog post about: "${topic}"

Category: ${category}

**CRITICAL WRITING STYLE RULES:**

1. **NO AI CLICHÉS** - Banned words/phrases:
   - "Navigating the...", "Let's dive into", "In this comprehensive guide"
   - "When it comes to", "At the end of the day", "It's important to note"
   - "Delve", "Landscape", "Ecosystem", "Vibrant", "Dynamic"
   - Exclamation points everywhere!!!

2. **Write Like a Human:**
   - Start with a real observation or data point
   - Use short sentences. No purple prose.
   - Real examples: "Bandra rents hit ₹2.5L for 2BHK this month" NOT "The vibrant neighborhood landscape of Bandra..."
   - Active voice only
   - Numbers > adjectives

3. **Structure (TIGHT):**
   - Opening: 1 sentence of truth + 1 question
   - Body: 3-5 short sections with data
   - Close: 1 sentence takeaway

4. **Specificity:**
   - Use real Mumbai locations, buildings, streets
   - Actual price points (₹1.8L, ₹5Cr)
   - Month/year context ("As of Nov 2025...")
   - Named examples when possible

5. **Tone:**
   - Conversational but direct
   - Skip the setup, jump to the point
   - No marketing speak
   - No patronizing "you might be wondering..."

**BAD Example:**
"When it comes to navigating Mumbai's vibrant real estate landscape, Bandra emerges as a truly dynamic neighborhood that offers a comprehensive range of premium amenities and lifestyle options!"

**GOOD Example:**
"Bandra 2BHKs now cost ₹2.5L/month. Here's what that gets you—and where you're overpaying."

Return JSON with title, excerpt, content (markdown), tags, read_time.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            excerpt: { type: "string" },
            content: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            read_time: { type: "number" }
          },
          required: ["title", "excerpt", "content"]
        }
      });

      setGeneratedContent(response);
      
      toast.success("✨ Blog Generated!", {
        description: "Review and publish when ready",
        duration: 3000
      });

    } catch (error) {
      console.error("Generation failed:", error);
      toast.error("Failed to generate blog", {
        description: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const publishBlog = async () => {
    if (!generatedContent) return;

    setIsPublishing(true);

    try {
      const slug = generatedContent.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      await base44.entities.Blog.create({
        title: generatedContent.title,
        slug,
        category,
        excerpt: generatedContent.excerpt,
        content: generatedContent.content,
        tags: generatedContent.tags || [],
        read_time: generatedContent.read_time || 5,
        status: "Published",
        author: "Chariot AI",
        ai_generated: true,
        featured: false
      });

      toast.success("🎉 Blog Published!", {
        description: "Live on PropAI Insights",
        duration: 5000
      });

      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      
      // Reset form
      setTopic("");
      setCustomPrompt("");
      setSelectedLocation("");
      setSelectedBuilding("");
      setSelectedDeveloper("");
      setGeneratedContent(null);
      setMarketData(null);
      setIsExpanded(false);

    } catch (error) {
      console.error("Publishing failed:", error);
      toast.error("Failed to publish", {
        description: error.message
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (!isExpanded) {
    return (
      <Button
        onClick={() => setIsExpanded(true)}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg"
      >
        <Wand2 className="w-4 h-4 mr-2" />
        AI Blog Creator
      </Button>
    );
  }

  return (
    <Card className="p-6 mb-8 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">AI Blog Creator</h3>
            <p className="text-sm text-slate-600">Generate content from your real market data</p>
          </div>
        </div>
        <Button
          onClick={() => {
            setIsExpanded(false);
            setGeneratedContent(null);
            setMarketData(null);
          }}
          variant="ghost"
          size="icon"
          className="hover:bg-purple-100"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Mode Selector */}
      {!generatedContent && (
        <div className="mb-6 flex gap-2">
          <Button
            onClick={() => setMode("data-driven")}
            variant={mode === "data-driven" ? "default" : "outline"}
            className={`flex-1 rounded-xl ${mode === "data-driven" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white" : "border-purple-300"}`}
          >
            <Database className="w-4 h-4 mr-2" />
            Data-Driven
          </Button>
          <Button
            onClick={() => setMode("custom")}
            variant={mode === "custom" ? "default" : "outline"}
            className={`flex-1 rounded-xl ${mode === "custom" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white" : "border-purple-300"}`}
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Custom Topic
          </Button>
        </div>
      )}

      {/* Data-Driven Mode */}
      {!generatedContent && mode === "data-driven" && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-900 mb-2 block">
              Blog Template
            </label>
            <Select value={dataTemplate} onValueChange={setDataTemplate}>
              <SelectTrigger className="border-purple-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dataTemplates.map((template) => (
                  <SelectItem key={template.value} value={template.value}>
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Deep Dive */}
          {dataTemplate === "location_deep_dive" && (
            <div>
              <label className="text-sm font-semibold text-slate-900 mb-2 block flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-600" />
                Select Location
              </label>
              {isLoadingData ? (
                <div className="text-sm text-slate-600">Loading locations...</div>
              ) : (
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="border-purple-200">
                    <SelectValue placeholder="Choose a location..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {locations.slice(0, 30).map((loc) => (
                      <SelectItem key={loc.name} value={loc.name}>
                        {loc.name} ({loc.count} properties)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Building Spotlight */}
          {dataTemplate === "building_spotlight" && (
            <div>
              <label className="text-sm font-semibold text-slate-900 mb-2 block flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-600" />
                Select Building
              </label>
              {isLoadingData ? (
                <div className="text-sm text-slate-600">Loading buildings...</div>
              ) : (
                <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                  <SelectTrigger className="border-purple-200">
                    <SelectValue placeholder="Choose a building..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {buildings.map((building) => (
                      <SelectItem key={building.id} value={building.id}>
                        {building.name} - {building.location} ({building.active_listings || 0} active)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Developer Profile */}
          {dataTemplate === "developer_profile" && (
            <div>
              <label className="text-sm font-semibold text-slate-900 mb-2 block flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                Select Developer
              </label>
              {isLoadingData ? (
                <div className="text-sm text-slate-600">Loading developers...</div>
              ) : (
                <Select value={selectedDeveloper} onValueChange={setSelectedDeveloper}>
                  <SelectTrigger className="border-purple-200">
                    <SelectValue placeholder="Choose a developer..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {developers.map((dev) => (
                      <SelectItem key={dev.id} value={dev.id}>
                        {dev.name} ({dev.tier}) - {dev.total_buildings_tracked} buildings
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <Button
            onClick={generateDataDrivenBlog}
            disabled={isGenerating || isLoadingData || 
              (dataTemplate === "location_deep_dive" && !selectedLocation) ||
              (dataTemplate === "building_spotlight" && !selectedBuilding) ||
              (dataTemplate === "developer_profile" && !selectedDeveloper)
            }
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold h-12 rounded-xl shadow-md"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Data...
              </>
            ) : (
              <>
                <Database className="w-5 h-5 mr-2" />
                Generate from Real Data
              </>
            )}
          </Button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              💡 <strong>Data-Driven Mode:</strong> Pulls REAL numbers from your {locations.length}+ locations, {buildings.length}+ buildings, and {developers.length}+ developers. No made-up stats.
            </p>
          </div>
        </div>
      )}

      {/* Custom Mode */}
      {!generatedContent && mode === "custom" && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-900 mb-2 block">
              Topic / Title Idea
            </label>
            <Input
              placeholder="e.g., Living in Pali Hill: What ₹3L/month gets you"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="border-purple-200 focus-visible:ring-purple-500"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-900 mb-2 block">
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="border-purple-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-900 mb-2 block">
              Custom Prompt (Optional)
            </label>
            <Textarea
              placeholder="Add specific instructions, data points, or angle..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="border-purple-200 focus-visible:ring-purple-500 h-24"
            />
          </div>

          <Button
            onClick={generateCustomBlog}
            disabled={isGenerating || !topic.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold h-12 rounded-xl shadow-md"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Blog Post
              </>
            )}
          </Button>
        </div>
      )}

      {/* Generated Content Preview */}
      {generatedContent && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-600 text-white border-0">
                  {category}
                </Badge>
                {mode === "data-driven" && (
                  <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0">
                    <Database className="w-3 h-3 mr-1" />
                    Real Data
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(generatedContent.title)}
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copy Title
                </button>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-3 leading-tight">
              {generatedContent.title}
            </h2>

            <p className="text-slate-600 mb-4 italic">
              {generatedContent.excerpt}
            </p>

            <div className="flex items-center gap-4 text-sm text-slate-500 mb-4 pb-4 border-b border-slate-200">
              <span>📖 {generatedContent.read_time || 5} min read</span>
              <span>🤖 AI Generated</span>
              {mode === "data-driven" && <span>📊 Real Market Data</span>}
            </div>

            {generatedContent.tags && generatedContent.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {generatedContent.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto prose prose-sm max-w-none">
              <ReactMarkdown>{generatedContent.content}</ReactMarkdown>
            </div>

            <button
              onClick={() => copyToClipboard(generatedContent.content)}
              className="w-full mt-4 text-sm text-purple-600 hover:text-purple-700 font-semibold flex items-center justify-center gap-2 py-2 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy Full Content
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={publishBlog}
              disabled={isPublishing}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold h-12 rounded-xl shadow-md"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Publish to PropAI Insights
                </>
              )}
            </Button>

            <Button
              onClick={() => {
                setGeneratedContent(null);
                setTopic("");
                setCustomPrompt("");
                setSelectedLocation("");
                setSelectedBuilding("");
                setSelectedDeveloper("");
                setMarketData(null);
              }}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              Start Over
            </Button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              ⚠️ Review AI content before publishing. All data is pulled from your live database.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}