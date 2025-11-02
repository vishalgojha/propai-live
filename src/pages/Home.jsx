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
  Zap
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
      icon: Sparkles,
      title: "AI-Powered Matching",
      description: "Smart algorithms match you with perfect properties based on your exact needs"
    },
    {
      icon: Shield,
      title: "Verified Listings",
      description: "Every property verified by our team. No fake listings, just real opportunities"
    },
    {
      icon: TrendingUp,
      title: "Transparent Pricing",
      description: "Clear, upfront pricing with no hidden charges. What you see is what you get"
    },
    {
      icon: MessageCircle,
      title: "Instant Support",
      description: "Connect via WhatsApp for quick responses. Vishal & Kapil respond within minutes"
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
      {/* Hero Section - Black with Yellow Accents */}
      <section className="relative bg-[#111111] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNGRkQzMDAiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE2djhIMjR2LThoMTJ6bTAgMjR2OEgyNHYtOGgxMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Badge className="mb-6 bg-[#FFD300]/20 text-[#FFD300] border-[#FFD300]/30 text-sm px-4 py-1.5 font-semibold tracking-wide">
              MUMBAI'S AI-FIRST REAL ESTATE
            </Badge>
            
            <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
              Real Estate.
              <br />
              <span className="text-[#FFD300]">
                Reinvented by AI.
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed font-light">
              Live WhatsApp listings. Zero fluff. Mumbai only.
            </p>

            {/* Search Bar - Yellow accent */}
            <div className="max-w-2xl mx-auto mb-10">
              <div className="flex gap-2 bg-[#1a1a1a] rounded-3xl p-2.5 border border-[#3B3B3B] hover:border-[#FFD300]/30 transition-all">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    placeholder="Search Bandra | Juhu | Khar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-12 bg-transparent border-0 h-14 text-white placeholder:text-gray-500 text-lg focus-visible:ring-0"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  size="lg"
                  className="bg-[#FFD300] hover:bg-[#FFD300]/90 text-black font-bold px-10 h-14 rounded-2xl shadow-lg shadow-[#FFD300]/20"
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
                className="bg-white text-black hover:bg-gray-100 font-semibold h-14 px-8 rounded-2xl"
              >
                <Building2 className="w-5 h-5 mr-2" />
                Browse All Properties
              </Button>
              <Button
                onClick={() => handleWhatsApp("Vishal")}
                size="lg"
                variant="outline"
                className="border-[#3B3B3B] text-white hover:bg-[#1a1a1a] hover:border-[#FFD300]/50 h-14 px-8 rounded-2xl font-semibold"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Chat with Vishal
              </Button>
            </div>
          </motion.div>

          {/* Stats - Yellow accents */}
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
                <div className="text-sm text-gray-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Properties */}
      {(featuredProperties.length > 0 || recentProperties.length > 0) && (
        <section className="py-20 bg-[#F7F7F7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-4xl font-bold text-[#111111] mb-2 tracking-tight">Featured Properties</h2>
                <p className="text-gray-600 text-lg">Hand-picked luxury homes in Mumbai's finest locations</p>
              </div>
              <Button
                onClick={() => navigate(createPageUrl("SmartFeed"))}
                variant="outline"
                className="hidden md:flex border-[#3B3B3B] hover:bg-[#FFD300] hover:text-black hover:border-[#FFD300] font-semibold"
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

      {/* Why Chariot Realty - Black section */}
      <section className="py-20 bg-[#111111] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#FFD300]/20 text-[#FFD300] border-[#FFD300]/30 uppercase tracking-wider font-bold">
              Why Choose Us
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              The Chariot Advantage
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto font-light">
              AI technology meets human expertise for unmatched property search
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-[#1a1a1a] rounded-3xl p-8 border border-[#3B3B3B] hover:border-[#FFD300]/50 transition-all"
              >
                <div className="w-14 h-14 bg-[#FFD300] rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-black" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed font-light">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Light section */}
      <section className="py-20 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#111111] mb-4 tracking-tight">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 font-light">
              Finding your dream home is just 3 simple steps away
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "1",
                title: "Browse Properties",
                description: "Explore our curated collection of verified properties with AI-powered filters"
              },
              {
                step: "2",
                title: "Connect with Us",
                description: "Reach out via WhatsApp or call. Get instant responses from Vishal or Kapil"
              },
              {
                step: "3",
                title: "Visit & Close",
                description: "Schedule viewings, get expert guidance, and finalize your perfect home"
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
                <div className="w-20 h-20 bg-[#FFD300] rounded-3xl flex items-center justify-center text-3xl font-bold text-black mx-auto mb-6 shadow-lg shadow-[#FFD300]/20">
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

      {/* Contact Section - Yellow CTA */}
      <section className="py-20 bg-[#FFD300]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-black tracking-tight">
                Ready to Find Your Dream Home?
              </h2>
              <p className="text-black/70 text-lg mb-8 leading-relaxed font-light">
                Connect with our expert team today. Vishal and Kapil are here to guide you through every step.
              </p>
              
              <div className="space-y-4">
                {['Personalized property recommendations', 'Expert negotiation support', 'End-to-end assistance'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-black">
                    <Check className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vishal Card */}
              <div className="bg-black/90 backdrop-blur-xl rounded-3xl p-8 border border-black">
                <div className="w-16 h-16 bg-[#FFD300] rounded-2xl flex items-center justify-center text-2xl font-bold mb-4 text-black">
                  V
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white">Vishal</h3>
                <p className="text-gray-400 text-sm mb-6">Co-Founder & Property Expert</p>
                
                <div className="space-y-3 mb-6">
                  <a href="tel:+919819471310" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white">
                    <Phone className="w-4 h-4" />
                    +91 98194 71310
                  </a>
                </div>

                <Button
                  onClick={() => handleWhatsApp("Vishal")}
                  className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white font-semibold h-12 rounded-2xl"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp Vishal
                </Button>
              </div>

              {/* Kapil Card */}
              <div className="bg-black/90 backdrop-blur-xl rounded-3xl p-8 border border-black">
                <div className="w-16 h-16 bg-[#FFD300] rounded-2xl flex items-center justify-center text-2xl font-bold mb-4 text-black">
                  K
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white">Kapil</h3>
                <p className="text-gray-400 text-sm mb-6">Co-Founder & Property Expert</p>
                
                <div className="space-y-3 mb-6">
                  <a href="tel:+919773757759" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white">
                    <Phone className="w-4 h-4" />
                    +91 97737 57759
                  </a>
                </div>

                <Button
                  onClick={() => handleWhatsApp("Kapil")}
                  className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white font-semibold h-12 rounded-2xl"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp Kapil
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