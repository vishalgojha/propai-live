
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
  Check
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

  const handleWhatsAppAI = () => {
    const phone = "919819471310";
    const message = `Hi, I'd like to use Chariot AI to find properties in Mumbai. Can you help me get started?`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const features = [
    {
      icon: Shield,
      title: "Real Listings Only",
      description: "Every property is verified by our team. No fake photos, no bait-and-switch"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Convenience",
      description: "No app downloads or endless scrolling. Just simple messaging"
    },
    {
      icon: Sparkles,
      title: "AI That Helps, Not Hypes",
      description: "Smart tech quietly supports our human advisors behind the scenes"
    },
    {
      icon: TrendingUp,
      title: "Personal Advisors",
      description: "A single point of contact who actually remembers you and your needs"
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
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNGRkQzMDAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2djhIMjR2LThoMTJ6bTAgMjR2OEgyNHYtOGgxMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Badge className="mb-6 bg-[#FFD300] text-black border-0 text-sm px-4 py-1.5 font-bold tracking-wide shadow-lg shadow-[#FFD300]/30">
              MUMBAI'S MOST HUMAN HOME SEARCH
            </Badge>
            
            <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
              Finding a Home
              <br />
              <span className="text-[#FFD300]">Shouldn't Feel Like a Job.</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-3 max-w-2xl mx-auto leading-relaxed font-light">
              No spam calls. No endless scrolling. No broker drama.
            </p>
            <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto font-light">
              Just honest guidance, curated options, and a team that listens before showing.
            </p>

            {/* Search Bar - Larger Size */}
            <div className="max-w-3xl mx-auto mb-10">
              <div className="flex gap-3 bg-white/10 rounded-3xl p-3 border border-white/20 hover:border-[#FFD300]/50 transition-all backdrop-blur-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                  <Input
                    placeholder="Search using AI: 3 BHK in Bandra, sea view, furnished..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-14 bg-white/5 border-0 h-16 text-white placeholder:text-gray-400 text-xl focus-visible:ring-2 focus-visible:ring-[#FFD300]"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  size="lg"
                  className="bg-[#FFD300] hover:bg-[#FFC700] text-black font-bold px-12 h-16 rounded-2xl shadow-xl shadow-[#FFD300]/30 border-0 text-lg"
                >
                  Search
                </Button>
              </div>
            </div>

            {/* Quick Actions - Updated */}
            <div className="flex flex-col items-center justify-center gap-4 max-w-md mx-auto">
              <Button
                onClick={() => navigate(createPageUrl("SmartFeed"))}
                size="lg"
                className="w-full bg-white text-black hover:bg-gray-100 font-semibold h-14 px-8 rounded-2xl shadow-lg border-0"
              >
                <Building2 className="w-5 h-5 mr-2" />
                Browse All Properties
              </Button>
              <Button
                onClick={handleWhatsAppAI}
                size="lg"
                className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold h-14 px-8 rounded-2xl shadow-lg border-0"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Connect via WhatsApp AI
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

      {/* How It Works - Simple & Personal */}
      <section className="py-20 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#111111] mb-4 tracking-tight">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 font-light max-w-2xl mx-auto">
              Simple. Personal. Stress-free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Tell Us What You're Looking For",
                description: "Just message us on WhatsApp — your budget, area, and what kind of vibe you want. That's all. No apps, no forms."
              },
              {
                step: "2",
                title: "We Curate & Verify Options",
                description: "Our team personally reviews listings that actually exist — filtered by your taste, not algorithms gone wild."
              },
              {
                step: "3",
                title: "You Get Your SmartFeed",
                description: "A private link with the best matching homes. No clutter. No fake listings. Just real choices."
              },
              {
                step: "4",
                title: "Visit, Decide, Move In",
                description: "We handle calls, visits, and coordination. You just focus on finding \"the one.\""
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
        </div>
      </section>

      {/* Why Choose Chariot */}
      <section className="py-20 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#111111] mb-6 tracking-tight">
              Why Choose Chariot
            </h2>
            <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto">
              Because you deserve a home search that feels human.
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

          <div className="text-center mt-12">
            <div className="inline-block bg-[#FFD300] text-black px-8 py-4 rounded-3xl">
              <p className="text-lg font-bold">
                Chariot Realty — Where AI ends, and actual care begins.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Chariot - Human Story */}
      <section className="py-20 bg-[#F7F7F7]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-[#111111] tracking-tight">
              About Chariot Realty
            </h2>
            
            <div className="space-y-6 text-lg text-gray-600 leading-relaxed font-light">
              <p className="text-2xl text-[#111111] font-normal">
                Finding a home in Mumbai shouldn't feel like a job.
              </p>
              
              <p>
                Chariot Realty is a new-age real estate service built around you.
                <br />
                No spam calls, no endless scrolling, no broker drama.
                <br />
                Just honest guidance, curated options, and a team that listens before showing.
              </p>
              
              <p>
                Behind the scenes, our smart tech quietly filters the city's chaos —
                <br />
                but in front, <span className="font-semibold text-[#111111]">you'll only feel calm, clarity, and care.</span>
              </p>
              
              <div className="pt-6">
                <p className="text-xl text-[#111111] font-medium italic">
                  "We're not here to sell you a flat.
                  <br />
                  We're here to help you find your space in the city."
                </p>
              </div>
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
                <MessageCircle className="w-12 h-12 text-black" />
                <h2 className="text-4xl md:text-5xl font-bold text-black tracking-tight">
                  Ready to Start?
                </h2>
              </div>
              <p className="text-black/70 text-xl mb-8 leading-relaxed font-medium">
                Tell us what you're looking for.
                <br />
                We'll send you matches within hours.
              </p>
              
              <div className="space-y-4">
                {['No spam calls', 'Only verified properties', 'Personal advisors who care'].map((item, i) => (
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
                <p className="text-gray-600 text-sm mb-6">Your Property Advisor</p>
                
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
                  Message Vishal
                </Button>
              </div>

              {/* Kapil Card */}
              <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-xl">
                <div className="w-16 h-16 bg-[#111111] rounded-2xl flex items-center justify-center text-2xl font-bold mb-4 text-white">
                  K
                </div>
                <h3 className="text-2xl font-bold mb-2 text-[#111111]">Kapil</h3>
                <p className="text-gray-600 text-sm mb-6">Your Property Advisor</p>
                
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
                  Message Kapil
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
