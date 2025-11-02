
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
      icon: MessageCircle,
      title: "WhatsApp-First",
      description: "No forms, no portals. Just text us what you need and we'll handle the rest"
    },
    {
      icon: Sparkles,
      title: "AI-Curated Matches",
      description: "Smart algorithms scan Mumbai daily, we hand-pick what actually fits you"
    },
    {
      icon: Shield,
      title: "Verified & Real",
      description: "Every listing checked by our team. No fake photos, no bait-and-switch"
    },
    {
      icon: TrendingUp,
      title: "Live SmartFeed",
      description: "Your personalized feed updates as new properties hit the market"
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
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxs-cnVpZT0iZXZlbm9kZCI+PGcgZmlsbD0iI0ZGRDMwMCIgZmlsbC1vcGFjaXR5PSIwLjA1Ij48cGF0aCBkPSJNMzYgMTZ2OEgyNHYtOGgxMnpNMzYgMjR2OEgyNHYtOGgxMnoiLz48L2c+PC9zdmc+')] opacity-50"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Badge className="mb-6 bg-[#FFD300] text-black border-0 text-sm px-4 py-1.5 font-bold tracking-wide shadow-lg shadow-[#FFD300]/30">
              MUMBAI'S SMARTEST WAY TO FIND HOMES
            </Badge>
            
            <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
              Find Your Perfect Home.
              <br />
              <span className="text-[#FFD300]">Effortlessly.</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-3 max-w-2xl mx-auto leading-relaxed font-light">
              AI precision. Human warmth.
            </p>
            <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto font-light">
              We match you with verified homes in Mumbai — no spam, no stress, just results.
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
                Browse Properties
              </Button>
              <Button
                onClick={() => handleWhatsApp("Vishal")}
                size="lg"
                variant="outline"
                className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white h-14 px-8 rounded-2xl font-semibold"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Chat with Us
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
                <p className="text-gray-600 text-lg">Verified homes, ready for viewing</p>
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

      {/* How It Works - Client-Focused */}
      <section className="py-20 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#111111] mb-4 tracking-tight">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 font-light max-w-2xl mx-auto">
              Effortless property discovery, powered by people who actually know Mumbai
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Tell Us What You Need",
                description: "Message us on WhatsApp — your budget, area, bedrooms, and vibe. That's it. No forms, no logins, no spam."
              },
              {
                step: "2",
                title: "We Curate Options",
                description: "Our AI scans the latest listings. Our advisors hand-pick what actually fits you — real homes, not recycled junk."
              },
              {
                step: "3",
                title: "You Get Your SmartFeed",
                description: "A live feed of verified homes with details and instant contact. Updates automatically when new matches appear."
              },
              {
                step: "4",
                title: "Visit & Move In",
                description: "We handle scheduling and coordination. You just walk in, check the place, and focus on the decision."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#FFD300] to-[#FFC700] rounded-3xl flex items-center justify-center text-2xl font-bold text-black mx-auto mb-4 shadow-xl shadow-[#FFD300]/30">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-[#111111] mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed font-light text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-gray-500 italic">
              Like having your own property manager inside WhatsApp.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Chariot - Client Pain Points */}
      <section className="py-20 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-[#111111]">
              Because House-Hunting in Mumbai
              <br />
              <span className="text-[#FFD300]">Shouldn't Be This Hard.</span>
            </h2>
            
            <div className="space-y-6 text-lg text-gray-600 leading-relaxed font-light">
              <p>
                You scroll through 50 fake listings. Half the photos are stolen from Pinterest.
                <br />
                The "broker" doesn't pick up. The address doesn't exist.
              </p>
              
              <p className="text-xl text-[#111111] font-normal">
                We built Chariot to fix that.
                <br />
                Every listing verified. Every detail real. Every conversation honest.
              </p>
              
              <div className="inline-block bg-[#FFD300] text-black px-8 py-4 rounded-3xl my-4">
                <p className="text-2xl font-bold">
                  AI does the scanning. Humans do the vetting.
                </p>
              </div>
              
              <p>
                You get clean property cards, transparent pricing, and advisors who actually respond.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid - Client Benefits */}
      <section className="py-20 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#FFD300] text-black border-0 font-bold shadow-lg shadow-[#FFD300]/30">
              THE CHARIOT ADVANTAGE
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-[#111111] mb-4 tracking-tight">
              Why Clients Choose Us
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

      {/* About Us - Human + AI */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#111111] tracking-tight">
              Not Robots.
              <br />
              <span className="text-[#FFD300]">Real People Who Know Mumbai.</span>
            </h2>
            
            <div className="space-y-6 text-lg text-gray-600 leading-relaxed font-light">
              <p>
                Chariot Realty is Vishal and Kapil — two advisors who've spent years navigating Mumbai's property chaos.
                <br />
                We know Bandra like the back of our hand. We know when brokers are lying.
              </p>
              
              <p>
                We use AI to scan thousands of listings so you don't have to.
                <br />
                But <span className="font-semibold text-[#111111]">we review every match before it reaches you.</span>
              </p>
              
              <p className="text-xl text-[#111111] font-normal">
                Think of us as your property concierge — tech-powered, human-delivered.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#FFD300] to-[#FFC700]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-12 h-12 text-black" />
                <h2 className="text-4xl md:text-5xl font-bold text-black tracking-tight">
                  Ready to Find Home?
                </h2>
              </div>
              <p className="text-black/70 text-xl mb-8 leading-relaxed font-medium">
                Tell us what you're looking for.
                <br />
                We'll send you matches within hours.
              </p>
              
              <div className="space-y-4">
                {['No fake listings', 'Instant WhatsApp responses', 'Only verified properties'].map((item, i) => (
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
                <p className="text-gray-600 text-sm mb-6">Property Advisor</p>
                
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
                  Chat with Vishal
                </Button>
              </div>

              {/* Kapil Card */}
              <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-xl">
                <div className="w-16 h-16 bg-[#111111] rounded-2xl flex items-center justify-center text-2xl font-bold mb-4 text-white">
                  K
                </div>
                <h3 className="text-2xl font-bold mb-2 text-[#111111]">Kapil</h3>
                <p className="text-gray-600 text-sm mb-6">Property Advisor</p>
                
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
                  Chat with Kapil
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
