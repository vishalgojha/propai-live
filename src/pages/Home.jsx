
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import PropertyCard from "../components/property/PropertyCard";
import PropertyDetailsModal from "../components/property/PropertyDetailsModal";
import {
  Building2,
  Sparkles,
  Shield,
  TrendingUp,
  MessageCircle,
  Search,
  ArrowRight,
  Phone,
  Check,
  Zap,
  Brain,
  Target
} from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);

  const { data: featuredProperties = [] } = useQuery({
    queryKey: ['featured-properties'],
    queryFn: () => base44.entities.Property.filter({ status: "Active", featured: true }, "-created_date", 6),
    initialData: [],
  });

  const { data: recentProperties = [] } = useQuery({
    queryKey: ['recent-properties'],
    queryFn: () => base44.entities.Property.filter({ status: "Active" }, "-created_date", 3),
    initialData: [],
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(createPageUrl("SmartFeed") + `?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(createPageUrl("SmartFeed"));
    }
  };

  const handleWhatsApp = (agent) => {
    const phone = agent === "Kapil" ? "919773757759" : "919819471310";
    const message = `Hi ${agent}, I found your contact on Chariot Realty website. I'd like to discuss property requirements.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const features = [
    {
      icon: Brain,
      title: "AI Parser",
      description: "Extracts every detail from chat — from BHK to facing to building name"
    },
    {
      icon: Sparkles,
      title: "SmartFeed",
      description: "Learns your style, your zones, your clientele for perfect matches"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp-First",
      description: "Everything you do stays synced with WhatsApp. No duplicate work"
    },
    {
      icon: Target,
      title: "Mumbai-Only Focus",
      description: "Local precision = sharper recommendations, faster matches"
    }
  ];

  const stats = [
    { label: "Active Listings", value: "500+" },
    { label: "Happy Clients", value: "1200+" },
    { label: "Areas Covered", value: "50+" },
    { label: "Years Experience", value: "10+" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section - Dark Gray instead of Pure Black */}
      <section className="relative bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNGRkQzMDAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2djhIMjR2LThoMTJ6bTAgMjR2OEgyNHYtOGgxMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Badge className="mb-6 bg-[#FFD300] text-black border-0 text-sm px-4 py-1.5 font-bold tracking-wide shadow-lg shadow-[#FFD300]/30">
              THE FUTURE OF MUMBAI REAL ESTATE
            </Badge>
            
            <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
              Where Mumbai's Listings
              <br />
              Meet <span className="text-[#FFD300]">AI Clarity.</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-3 max-w-2xl mx-auto leading-relaxed font-light">
              Real homes. Real data. Real-time — directly from WhatsApp.
            </p>
            <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto font-light">
              No spam, no fake listings. Just verified properties powered by AI.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-10">
              <div className="flex gap-2 bg-white/10 rounded-3xl p-2.5 border border-white/20 hover:border-[#FFD300]/50 transition-all backdrop-blur-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search Bandra | Juhu | Khar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-12 bg-white/5 border-0 h-14 text-white placeholder:text-gray-400 text-lg focus-visible:ring-2 focus-visible:ring-[#FFD300]"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  size="lg"
                  className="bg-[#FFD300] hover:bg-[#FFC700] text-black font-bold px-10 h-14 rounded-2xl shadow-xl shadow-[#FFD300]/30 border-0"
                >
                  Search
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                onClick={() => navigate(createPageUrl("SmartFeed"))}
                size="lg"
                className="bg-white text-black hover:bg-gray-100 font-semibold h-14 px-8 rounded-2xl shadow-lg border-0"
              >
                <Building2 className="w-5 h-5 mr-2" />
                Explore Live Listings
              </Button>
              <Button
                onClick={() => handleWhatsApp("Vishal")}
                size="lg"
                variant="outline"
                className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white h-14 px-8 rounded-2xl font-semibold"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Contact on WhatsApp
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2 text-[#FFD300]">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Properties */}
      {(featuredProperties.length > 0 || recentProperties.length > 0) && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-4xl font-bold text-[#111111] mb-2 tracking-tight">Featured Properties</h2>
                <p className="text-gray-600 text-lg">Hand-picked luxury homes in Mumbai's finest locations</p>
              </div>
              <Button
                onClick={() => navigate(createPageUrl("SmartFeed"))}
                variant="outline"
                className="hidden md:flex border-2 border-[#111111] text-[#111111] hover:bg-[#FFD300] hover:text-black hover:border-[#FFD300] font-semibold"
              >
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(featuredProperties.length > 0 ? featuredProperties : recentProperties).slice(0, 3).map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onViewDetails={setSelectedProperty}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works - 3 Bold Steps */}
      <section className="py-20 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#111111] mb-4 tracking-tight">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 font-light max-w-2xl mx-auto">
              Simple, smart, and built for Mumbai realtors who mean business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "1",
                title: "You Post or Forward a Listing",
                description: "On WhatsApp or directly into Chariot AI. The system parses every word — BHK, rent, amenities, vibe — everything."
              },
              {
                step: "2",
                title: "Our AI Cleans, Tags & Generates",
                description: "It creates a clean card with title, description, price, and even captions like \"Modern 2BHK with balcony near Pali Hill.\""
              },
              {
                step: "3",
                title: "You Get Live Cards & SmartFeed",
                description: "Auto-updating, shareable, SEO-friendly cards that can be sent on WhatsApp, linked in bios, or embedded anywhere."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-[#FFD300] to-[#FFC700] rounded-3xl flex items-center justify-center text-3xl font-bold text-black mx-auto mb-6 shadow-xl shadow-[#FFD300]/30">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold text-[#111111] mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed font-light">{item.description}</p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-10 -right-6 text-[#FFD300]/30">
                    <ArrowRight className="w-10 h-10" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Chariot Exists - White Background */}
      <section className="py-20 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-[#111111]">
              Because Mumbai Real Estate
              <br />
              <span className="text-[#FFD300]">Deserved Better Tech.</span>
            </h2>
            
            <div className="space-y-6 text-lg text-gray-600 leading-relaxed font-light">
              <p>
                Every broker WhatsApps. Every buyer scrolls listings.
                <br />
                But the tools never caught up — messy chats, repeated data, fake numbers, half-baked portals.
              </p>
              
              <p className="text-xl text-[#111111] font-normal">
                So we built Chariot Realty:
                <br />
                An AI-driven, WhatsApp-first platform built for Mumbai brokers who mean business.
              </p>
              
              <div className="inline-block bg-[#FFD300] text-black px-8 py-4 rounded-3xl my-4">
                <p className="text-2xl font-bold">
                  We don't automate you — we amplify you.
                </p>
              </div>
              
              <p>
                Every chat → every property → structured, verified, and ready to share.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Our Edge - Feature Grid */}
      <section className="py-20 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#FFD300] text-black border-0 font-bold shadow-lg shadow-[#FFD300]/30">
              OUR EDGE
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-[#111111] mb-4 tracking-tight">
              What Makes Us Different
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-[#FFD300] hover:shadow-xl transition-all"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-[#FFD300] to-[#FFC700] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#FFD300]/20">
                  <feature.icon className="w-7 h-7 text-black" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#111111]">{feature.title}</h3>
                <p className="text-[#3B3B3B] text-sm leading-relaxed font-light">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us - Not a Portal, A Movement */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#111111] tracking-tight">
              Not a portal.
              <br />
              <span className="text-[#FFD300]">A movement for realtors who play smart.</span>
            </h2>
            
            <div className="space-y-6 text-lg text-gray-600 leading-relaxed font-light">
              <p>
                Founded in Bandra, run by realtors, and powered by AI —
                <br />
                Chariot Realty blends <span className="font-semibold text-[#111111]">street sense with system sense.</span>
              </p>
              
              <p>
                We build for the agent who's too busy hustling to fill forms.
                <br />
                We believe the future of Indian real estate isn't corporate — <span className="font-semibold text-[#111111]">it's connected.</span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section - Yellow with Better Contrast */}
      <section className="py-20 bg-gradient-to-br from-[#FFD300] to-[#FFC700]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-12 h-12 text-black" />
                <h2 className="text-4xl md:text-5xl font-bold text-black tracking-tight">
                  Go Live in 10 Seconds
                </h2>
              </div>
              <p className="text-black/70 text-xl mb-8 leading-relaxed font-medium">
                Send your next property on WhatsApp.
                <br />
                We'll do the rest.
              </p>
              
              <div className="space-y-4">
                {['Instant AI parsing & structuring', 'Professional property cards', 'Direct client connections'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-black">
                    <Check className="w-5 h-5 flex-shrink-0 font-bold" />
                    <span className="font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vishal Card */}
              <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-xl">
                <div className="w-16 h-16 bg-[#111111] rounded-2xl flex items-center justify-center text-2xl font-bold mb-4 text-white">
                  V
                </div>
                <h3 className="text-2xl font-bold mb-2 text-[#111111]">Vishal</h3>
                <p className="text-gray-600 text-sm mb-6">Co-Founder & Property Expert</p>
                
                <div className="space-y-3 mb-6">
                  <a href="tel:+919819471310" className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#111111]">
                    <Phone className="w-4 h-4" />
                    +91 98194 71310
                  </a>
                </div>

                <Button
                  onClick={() => handleWhatsApp("Vishal")}
                  className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold h-12 rounded-2xl shadow-lg border-0"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Listing
                </Button>
              </div>

              {/* Kapil Card */}
              <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-xl">
                <div className="w-16 h-16 bg-[#111111] rounded-2xl flex items-center justify-center text-2xl font-bold mb-4 text-white">
                  K
                </div>
                <h3 className="text-2xl font-bold mb-2 text-[#111111]">Kapil</h3>
                <p className="text-gray-600 text-sm mb-6">Co-Founder & Property Expert</p>
                
                <div className="space-y-3 mb-6">
                  <a href="tel:+919773757759" className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#111111]">
                    <Phone className="w-4 h-4" />
                    +91 97737 57759
                  </a>
                </div>

                <Button
                  onClick={() => handleWhatsApp("Kapil")}
                  className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold h-12 rounded-2xl shadow-lg border-0"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Listing
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PropertyDetailsModal
        property={selectedProperty}
        isOpen={!!selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />
    </div>
  );
}
