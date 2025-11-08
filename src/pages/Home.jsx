
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Sparkles, TrendingUp, Shield, Building2,
  CheckCircle2, ArrowRight, MessageCircle, Eye, Brain,
  Zap, BookOpen, Globe, Bot, Home as HomeIcon, MapPin
} from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import SEO from "../components/SEO";
import InlineChatWidget from "../components/InlineChatWidget";

export default function Home() {
  const navigate = useNavigate();
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [showInlineChat, setShowInlineChat] = useState(false);

  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "PropAI Live",
    "description": "AI-powered real estate intelligence platform for Mumbai, delivering real-time property data and smart matching.",
    "url": "https://propai.live",
    "areaServed": {
      "@type": "City",
      "name": "Mumbai"
    },
    "priceRange": "$$"
  };

  // Mock data fetching for featured properties
  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      setIsLoadingProperties(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockProperties = [
        {
          id: "1",
          ai_title: "Luxurious 3 BHK Apartment in Bandra West",
          bhk: "3 BHK",
          location: "Bandra West, Mumbai",
          price: "6.50",
          price_unit: "crores",
          listing_type: "Sale",
          images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"],
        },
        {
          id: "2",
          ai_title: "Spacious 2 BHK Flat with Sea View in Worli",
          bhk: "2 BHK",
          location: "Worli, Mumbai",
          price: "3.20",
          price_unit: "crores",
          listing_type: "Rent",
          images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"],
        },
        {
          id: "3",
          ai_title: "Modern Office Space in BKC",
          bhk: "Office",
          location: "Bandra Kurla Complex, Mumbai",
          price: "1.80",
          price_unit: "crores",
          listing_type: "Sale",
          images: ["https://images.unsplash.com/photo-1549887534-1541e932662f?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"],
        },
        {
          id: "4", // Example of property without image
          ai_title: "1 BHK for rent in Andheri East",
          bhk: "1 BHK",
          location: "Andheri East, Mumbai",
          price: "50000",
          price_unit: "L",
          listing_type: "Rent",
          images: [],
        }
      ];
      setFeaturedProperties(mockProperties);
      setIsLoadingProperties(false);
    };

    fetchFeaturedProperties();
  }, []);

  const stats = [
    { number: "250+", label: "Buildings Mapped" },
    { number: "10,000+", label: "Properties Tracked" },
    { number: "500+", label: "Trusted Brokers" },
    { number: "24/7", label: "AI Monitoring" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <SEO
        title="PropAI Live | AI-Powered Mumbai Real Estate Intelligence Platform"
        description="Real-time property data for Mumbai. AI-powered matching, building intelligence, and broker trust scoring. Find verified properties with transparent pricing."
        canonical="https://propai.live/"
        schema={homeSchema}
      />

      {/* Hero Section - Light & Clean */}
      <section className="relative bg-gradient-to-br from-purple-100 via-blue-50 to-purple-50 overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <Badge className="mb-6 bg-white border-2 border-purple-200 text-purple-700 px-4 py-2 text-sm font-bold inline-flex items-center gap-2 shadow-sm">
              <Sparkles className="w-4 h-4" />
              Powered by Building-Level Intelligence
            </Badge>

            {/* NEW Headline - Screenshot Version */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-slate-900">
              WhatsApp → Organized Properties.
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Instantly.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed font-light">
              Stop losing deals in WhatsApp chaos. AI turns messy broker chats
              <br className="hidden md:block" />
              <span className="text-slate-700 font-medium">into structured listings in seconds.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                onClick={() => navigate(createPageUrl("SmartFeed"))}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold h-14 px-8 rounded-2xl shadow-lg text-lg group"
              >
                <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Explore SmartFeed
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                onClick={() => setShowInlineChat(!showInlineChat)}
                size="lg"
                className="bg-white hover:bg-purple-50 border-2 border-purple-200 text-purple-700 font-semibold h-14 px-8 rounded-2xl text-lg group"
              >
                <Bot className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Chat with AI Assistant
              </Button>
            </div>

            {/* Inline Chat Widget */}
            {showInlineChat && (
              <div className="mb-12">
                <InlineChatWidget
                  isOpen={showInlineChat}
                  onClose={() => setShowInlineChat(false)}
                />
              </div>
            )}

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>AI-Verified Data</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Real-Time Updates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Broker Trust Scoring</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Properties Section - NO IMAGES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Featured Properties</h2>
            <p className="text-slate-600">Handpicked listings • Verified availability</p>
          </div>
          <Button
            onClick={() => navigate(createPageUrl("SmartFeed"))}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-2xl"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {isLoadingProperties ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProperties.slice(0, 3).map((property) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl overflow-hidden border-2 border-slate-100 hover:border-sky-200 hover:shadow-xl transition-all cursor-pointer"
                onClick={() => navigate(createPageUrl("PropertyDetails") + `?id=${property.id}`)}
              >
                {/* NO IMAGE SECTION - Removed */}
                
                <div className="p-6">
                  <Badge className="mb-3 bg-sky-600 text-white border-0">
                    {property.listing_type}
                  </Badge>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">
                    {property.ai_title || `${property.bhk} in ${property.location}`}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-600 mb-4">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{property.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-sky-600">
                      ₹{property.price}{property.price_unit === 'crores' ? ' Cr' : 'L'}
                    </span>
                    <Badge variant="outline">{property.bhk}</Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Why PropAI - The Unfair Advantages */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white border-2 border-purple-200 text-purple-700 px-4 py-2">
              What Makes Us Different
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Your Unfair Advantages
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto font-light">
              Features MagicBricks and Housing will never build
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Building Memory™ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl p-8 border-2 border-amber-200 hover:shadow-xl transition-all group"
            >
              <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Building Memory™</h3>
              <p className="text-slate-700 mb-4 leading-relaxed">
                Every building becomes a living knowledge object. Historical pricing, broker activity, tenant profiles—
                <span className="font-semibold text-amber-700"> auto-learned from parsed data.</span>
              </p>
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>"Oberoi Sky Heights: 47 listings, avg ₹2.34L for 2BHK, High Activity"</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>Contextual summaries generated from message patterns</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>Street-level pricing intelligence on autopilot</span>
                </div>
              </div>
            </motion.div>

            {/* BrokerTrust™ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-8 border-2 border-purple-200 hover:shadow-xl transition-all group"
            >
              <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">BrokerTrust™ Layer</h3>
              <p className="text-slate-700 mb-4 leading-relaxed">
                Invisible quality filter. Properties from high-trust brokers rise to the top—
                <span className="font-semibold text-blue-700"> you see the clean data first.</span>
              </p>
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Auto-scores brokers: duplicate rate, response time, data accuracy</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>SmartFeed ranking: Trust Score 85+ properties shown first</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Your data quality improves with every parse</span>
                </div>
              </div>
            </motion.div>

            {/* AI Deals Radar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl p-8 border-2 border-emerald-200 hover:shadow-xl transition-all group"
            >
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">AI Deals Radar</h3>
              <p className="text-slate-700 mb-4 leading-relaxed">
                Spot underpriced listings, price drops, and hidden matches—
                <span className="font-semibold text-emerald-700"> before they hit portals.</span>
              </p>
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Flags properties 15%+ below building avg</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Tracks price reductions in real-time</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Matches draft properties to active requirements</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Additional Features Row */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200 hover:shadow-md transition-all">
              <Globe className="w-10 h-10 text-blue-600 mb-4" />
              <h4 className="font-bold text-slate-900 mb-2">Expat Mode™</h4>
              <p className="text-sm text-slate-700">One-toggle curation: Fully furnished + expat-friendly buildings + good amenities. Built for the global crowd.</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200 hover:shadow-md transition-all">
              <Eye className="w-10 h-10 text-blue-600 mb-4" />
              <h4 className="font-bold text-slate-900 mb-2">Semantic Search</h4>
              <p className="text-sm text-slate-700">"Modern flat near Pali Hill with balcony" understands context—not just keyword matching. Google-level property discovery.</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200 hover:shadow-md transition-all">
              <Zap className="w-10 h-10 text-blue-600 mb-4" />
              <h4 className="font-bold text-slate-900 mb-2">Mumbai Street Smarts</h4>
              <p className="text-sm text-slate-700">AI trained on broker lingo, location vibes, and cultural nuances. Pali Hill ≠ Hill Road—we get it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Actually Works */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              The Intelligence Layer
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto font-light">
              You see properties. We see patterns, relationships, and context that generic portals miss.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Visual */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-8 text-white shadow-xl">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">WhatsApp → Structured Data</h4>
                    <p className="text-sm text-blue-100">Broker forwards: "2bhk sf mod kit 2cp Pali Hill 80L". AI parses, links to building, extracts intelligence.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-blue-600">2</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Building Becomes Knowledge Node</h4>
                    <p className="text-sm text-blue-100">"Raheja Classique" accumulates context: pricing, broker trust, tenant profiles, amenities—self-learning.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-blue-600">3</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">SmartFeed Ranks by Trust</h4>
                    <p className="text-sm text-blue-100">High-trust brokers rise. Duplicates hidden. You see the clean, curated feed—decades ahead of MagicBricks.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-blue-600">4</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Intelligence Compounds</h4>
                    <p className="text-sm text-blue-100">Every parse enriches the system. Building Memory™ grows. Deals Radar gets smarter. Your advantage scales.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Benefits for Clients Only */}
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  What You Get
                </h4>
                <ul className="space-y-2 text-slate-700">
                  <li>→ See building context (pricing, activity, vibes) upfront</li>
                  <li>→ Trust the data—it's ranked by broker reliability</li>
                  <li>→ No spam, no duplicates, no bait-and-switch</li>
                  <li>→ Expat Mode: instant curation for international moves</li>
                  <li>→ Building Memory: historical pricing & market intelligence</li>
                  <li>→ Semantic search: understands context, not just keywords</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-6 border border-purple-200">
                <h4 className="font-bold text-slate-900 mb-2">The Moat</h4>
                <p className="text-sm text-slate-700">
                  MagicBricks has listings. You have <span className="font-bold text-blue-700">living intelligence</span>. That's not a feature gap—it's a decade gap.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators - Images with lazy loading */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Honest Disclaimer with Humor */}
          <div className="text-center mb-8">
            <p className="text-white/90 text-sm font-light italic">
              ⚠️ Real talk: These numbers are 100% made up. But we're building something real—and we plan to blow past these fake stats. Watch this space. 🚀
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                <div className="text-blue-100 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Aspirational Footer */}
          <div className="text-center mt-8">
            <p className="text-white/80 text-xs font-light">
              (Aspirational AF. But give us a minute—we'll make the real numbers even better.) 💪✨
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof / Trust Section */}
      <section className="py-20 bg-white/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">
            Built in Mumbai. Powered by AI. Real-time data.
          </h2>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-3xl mx-auto">
            We're not a portal dumping 10,000 listings. We're an intelligence platform that uses AI to understand Mumbai real estate at a <span className="font-semibold text-slate-900">contextual, street-level depth</span>—then shows you the 3 properties that actually fit.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate(createPageUrl("SmartFeed"))}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold h-14 px-8 rounded-2xl"
            >
              <Search className="w-5 h-5 mr-2" />
              Browse Properties
            </Button>
            <Button
              onClick={() => navigate(createPageUrl("Blogs"))}
              size="lg"
              className="bg-white hover:bg-purple-50 border-2 border-purple-200 text-purple-700 font-semibold h-14 px-8 rounded-2xl"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Read Insights
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section - Light */}
      <section className="py-16 bg-gradient-to-br from-purple-100 via-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Ready to See the Difference?
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Chat with our AI assistant or explore our smart feed
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setShowInlineChat(true)}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold h-14 px-8 rounded-2xl shadow-lg"
            >
              <Bot className="w-5 h-5 mr-2" />
              Chat with AI Assistant
            </Button>
            <Button
              onClick={() => navigate(createPageUrl("SmartFeed"))}
              size="lg"
              className="bg-white hover:bg-purple-50 border-2 border-purple-200 text-purple-700 font-semibold h-14 px-8 rounded-2xl"
            >
              <Search className="w-5 h-5 mr-2" />
              Explore Properties
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
