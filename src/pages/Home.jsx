
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, Sparkles, TrendingUp, Shield, Building2,
  CheckCircle2, ArrowRight, MessageCircle, Eye, Brain,
  Zap, BookOpen, Globe, Bot
} from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import SEO from "../components/SEO";

export default function Home() {
  const navigate = useNavigate();

  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "Chariot Realty",
    "description": "AI-powered real estate platform for Mumbai, delivering transparent, verified property listings without the noise.",
    "url": "https://chariotrealtors.in",
    "areaServed": {
      "@type": "City",
      "name": "Mumbai"
    },
    "priceRange": "$$"
  };

  // WhatsApp AI Assistant URL
  const whatsappAIUrl = base44.agents.getWhatsAppConnectURL('chariot_master');

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <SEO
        title="Chariot Realty | Mumbai Real Estate, Reimagined by AI"
        description="Find verified Mumbai properties with AI-powered intelligence. Building Memory™, BrokerTrust™ scoring, and Expat Mode — real estate without the noise."
        schema={homeSchema}
        canonical="https://chariotrealtors.in"
      />

      {/* Hero Section - FIXED: Removed white box by proper section closure */}
      <section className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 pb-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <Badge className="mb-6 bg-[#FFD300] text-black border-0 px-4 py-2 text-sm font-bold inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Powered by Building-Level Intelligence
            </Badge>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Mumbai Real Estate,
              <br />
              <span className="bg-gradient-to-r from-[#FFD300] via-[#FFC700] to-[#FFD300] bg-clip-text text-transparent">
                Decoded by AI
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-stone-300 mb-10 leading-relaxed font-light">
              Every building has a story. Every street has a pulse. We don't just list properties—
              <br className="hidden md:block" />
              <span className="text-[#FFD300] font-medium">we understand them at a contextual level.</span>
            </p>

            {/* CTA Buttons - WITH AI ASSISTANT */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                onClick={() => navigate(createPageUrl("SmartFeed"))}
                size="lg"
                className="bg-[#FFD300] hover:bg-[#FFC700] text-black font-bold h-14 px-8 rounded-2xl shadow-xl text-lg group"
              >
                <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Explore SmartFeed
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                onClick={() => navigate(createPageUrl("Buildings"))}
                size="lg"
                className="bg-white/10 hover:bg-white/20 border-2 border-white/40 text-white font-semibold h-14 px-8 rounded-2xl backdrop-blur-sm text-lg"
              >
                <Building2 className="w-5 h-5 mr-2" />
                Building Intelligence
              </Button>
              {/* NEW: WhatsApp AI Assistant Button */}
              <Button
                onClick={() => window.open(whatsappAIUrl, '_blank')}
                size="lg"
                className="bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold h-14 px-8 rounded-2xl shadow-xl text-lg group"
              >
                <Bot className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Chat with AI Assistant
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-stone-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FFD300]" />
                <span>AI-Verified Data</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FFD300]" />
                <span>No Bait-and-Switch</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FFD300]" />
                <span>Broker Trust Scoring</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-auto">
            <path
              fill="#F7F7F7"
              d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
            />
          </svg>
        </div>
      </section>

      {/* Why Chariot - The Unfair Advantages */}
      <section className="py-20 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-stone-900 text-white border-0 px-4 py-2">
              What Makes Us Different
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-[#111111] mb-4">
              Your Unfair Advantages
            </h2>
            <p className="text-xl text-[#3B3B3B] max-w-2xl mx-auto font-light">
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
              <h3 className="text-2xl font-bold text-[#111111] mb-3">Building Memory™</h3>
              <p className="text-[#3B3B3B] mb-4 leading-relaxed">
                Every building becomes a living knowledge object. Historical pricing, broker activity, tenant profiles—
                <span className="font-semibold text-amber-700"> auto-learned from parsed data.</span>
              </p>
              <div className="space-y-2 text-sm text-[#3B3B3B]">
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
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border-2 border-blue-200 hover:shadow-xl transition-all group"
            >
              <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#111111] mb-3">BrokerTrust™ Layer</h3>
              <p className="text-[#3B3B3B] mb-4 leading-relaxed">
                Invisible quality filter. Properties from high-trust brokers rise to the top—
                <span className="font-semibold text-blue-700"> you see the clean data first.</span>
              </p>
              <div className="space-y-2 text-sm text-[#3B3B3B]">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Auto-scores brokers: duplicate rate, response time, photo sharing</span>
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
              <h3 className="text-2xl font-bold text-[#111111] mb-3">AI Deals Radar</h3>
              <p className="text-[#3B3B3B] mb-4 leading-relaxed">
                Spot underpriced listings, price drops, and hidden matches—
                <span className="font-semibold text-emerald-700"> before they hit portals.</span>
              </p>
              <div className="space-y-2 text-sm text-[#3B3B3B]">
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
            <div className="bg-white rounded-2xl p-6 border border-stone-200 hover:shadow-md transition-all">
              <Globe className="w-10 h-10 text-[#FFD300] mb-4" />
              <h4 className="font-bold text-[#111111] mb-2">Expat Mode™</h4>
              <p className="text-sm text-[#3B3B3B]">One-toggle curation: Fully furnished + expat-friendly buildings + good amenities. Built for the global crowd.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-stone-200 hover:shadow-md transition-all">
              <Eye className="w-10 h-10 text-[#FFD300] mb-4" />
              <h4 className="font-bold text-[#111111] mb-2">Semantic Search</h4>
              <p className="text-sm text-[#3B3B3B]">"Modern flat near Pali Hill with balcony" understands context—not just keyword matching. Google-level property discovery.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-stone-200 hover:shadow-md transition-all">
              <Zap className="w-10 h-10 text-[#FFD300] mb-4" />
              <h4 className="font-bold text-[#111111] mb-2">Mumbai Street Smarts</h4>
              <p className="text-sm text-[#3B3B3B]">AI trained on broker lingo, location vibes, and cultural nuances. Pali Hill ≠ Hill Road—we get it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Actually Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#111111] mb-4">
              The Intelligence Layer
            </h2>
            <p className="text-xl text-[#3B3B3B] max-w-3xl mx-auto font-light">
              You see properties. We see patterns, relationships, and context that generic portals miss.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Visual */}
            <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-8 text-white">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#FFD300] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-black">1</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">WhatsApp → Structured Data</h4>
                    <p className="text-sm text-stone-300">Broker forwards: "2bhk sf mod kit 2cp Pali Hill 80L". AI parses, links to building, extracts intelligence.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#FFD300] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-black">2</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Building Becomes Knowledge Node</h4>
                    <p className="text-sm text-stone-300">"Raheja Classique" accumulates context: pricing, broker trust, tenant profiles, amenities—self-learning.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#FFD300] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-black">3</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">SmartFeed Ranks by Trust</h4>
                    <p className="text-sm text-stone-300">High-trust brokers rise. Duplicates hidden. You see the clean, curated feed—decades ahead of MagicBricks.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#FFD300] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-black">4</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Intelligence Compounds</h4>
                    <p className="text-sm text-stone-300">Every parse enriches the system. Building Memory™ grows. Deals Radar gets smarter. Your advantage scales.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Benefits for Clients Only */}
            <div className="space-y-6">
              <div className="bg-[#F7F7F7] rounded-2xl p-6">
                <h4 className="font-bold text-[#111111] mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#FFD300]" />
                  What You Get
                </h4>
                <ul className="space-y-2 text-[#3B3B3B]">
                  <li>→ See building context (pricing, activity, vibes) upfront</li>
                  <li>→ Trust the data—it's ranked by broker reliability</li>
                  <li>→ No spam, no duplicates, no bait-and-switch</li>
                  <li>→ Expat Mode: instant curation for international moves</li>
                  <li>→ Building Memory: historical pricing & market intelligence</li>
                  <li>→ Semantic search: understands context, not just keywords</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-[#FFD300] to-[#FFC700] rounded-2xl p-6">
                <h4 className="font-bold text-black mb-2">The Moat</h4>
                <p className="text-sm text-black/80">
                  MagicBricks has listings. You have <span className="font-bold">living intelligence</span>. That's not a feature gap—it's a decade gap.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Trust Section */}
      <section className="py-20 bg-[#F7F7F7]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-[#111111] mb-6">
            Built in Mumbai. Powered by AI. Driven by People.
          </h2>
          <p className="text-lg text-[#3B3B3B] mb-8 leading-relaxed max-w-3xl mx-auto">
            We're not a portal dumping 10,000 listings. We're a boutique consultancy that uses AI to understand Mumbai real estate at a <span className="font-semibold text-[#111111]">contextual, street-level depth</span>—then shows you the 3 properties that actually fit.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate(createPageUrl("SmartFeed"))}
              size="lg"
              className="bg-[#111111] hover:bg-[#FFD300] hover:text-black text-white font-bold h-14 px-8 rounded-2xl"
            >
              <Search className="w-5 h-5 mr-2" />
              Browse Properties
            </Button>
            <Button
              onClick={() => navigate(createPageUrl("Blogs"))}
              size="lg"
              variant="outline"
              className="border-2 border-[#111111] hover:bg-[#111111] hover:text-white font-semibold h-14 px-8 rounded-2xl"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Read Insights
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section - with AI + Vishal + Kapil */}
      <section className="py-16 bg-gradient-to-br from-stone-900 to-stone-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to See the Difference?
          </h2>
          <p className="text-xl text-stone-300 mb-8">
            Chat with our AI Assistant or connect directly with Vishal & Kapil
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => window.open(whatsappAIUrl, '_blank')}
              size="lg"
              className="bg-[#128C7E] hover:bg-[#0F7A6E] text-white font-bold h-14 px-8 rounded-2xl"
            >
              <Bot className="w-5 h-5 mr-2" />
              Chat with AI Assistant
            </Button>
            <Button
              onClick={() => window.open('https://wa.me/919819471310?text=Hi%20Vishal,%20I%20found%20Chariot%20Realty%20and%20would%20love%20to%20explore%20properties%20in%20Mumbai', '_blank')}
              size="lg"
              className="bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold h-14 px-8 rounded-2xl"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              WhatsApp Vishal
            </Button>
            <Button
              onClick={() => window.open('https://wa.me/919773757759?text=Hi%20Kapil,%20I%20found%20Chariot%20Realty%20and%20would%20love%20to%20explore%20properties%20in%20Mumbai', '_blank')}
              size="lg"
              className="bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold h-14 px-8 rounded-2xl"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              WhatsApp Kapil
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
