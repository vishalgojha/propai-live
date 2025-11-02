import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PropertyCard from "../components/property/PropertyCard";
import { 
  Sparkles, Search, MessageCircle, ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import SEO from "../components/SEO";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "Chariot Realty",
    "description": "AI-powered real estate platform for Mumbai. Transparent property listings in Bandra, Juhu, Andheri and more.",
    "url": "https://chariotrealtors.in",
    "telephone": "+919819471310",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Bandra West, Mumbai",
      "addressRegion": "Maharashtra",
      "addressCountry": "IN"
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = createPageUrl("SmartFeed") + `?search=${encodeURIComponent(searchQuery)}`;
    } else {
      window.location.href = createPageUrl("SmartFeed");
    }
  };

  const handleWhatsAppAI = () => {
    const whatsappURL = base44.agents.getWhatsAppConnectURL('chariot_master');
    window.open(whatsappURL, '_blank');
  };

  // Fetch featured properties (max 5)
  const { data: featuredProperties = [] } = useQuery({
    queryKey: ['featured-properties'],
    queryFn: async () => {
      const properties = await base44.entities.Property.filter(
        { status: "Active", featured: true, is_duplicate: false },
        '-created_date',
        5
      );
      return properties;
    },
    initialData: [],
  });

  // Get stats
  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const props = await base44.entities.Property.list();
      return props.filter(p => p.status === "Active" && !p.is_duplicate);
    },
    initialData: [],
  });

  const activeListings = properties.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2a2826] via-[#3a3633] to-[#2a2826]">
      <SEO
        title="Chariot Realty | AI-Powered Real Estate in Mumbai"
        description="Find verified properties in Bandra, Juhu, Andheri & more. AI-powered property search with transparent pricing."
        schema={homeSchema}
        canonical="https://chariotrealtors.in"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        
        {/* Logo & Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#FFD300] to-[#FFC700] rounded-3xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Chariot Realty
            </h1>
          </div>
        </motion.div>

        {/* NLP Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Input
                type="text"
                placeholder="Try: 3 BHK in Bandra, sea view, furnished..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-16 px-6 text-lg rounded-3xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/60 focus:border-[#FFD300] focus:bg-white/20 shadow-xl"
              />
            </div>
          </form>
        </motion.div>

        {/* Search Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <Button
            onClick={handleSearch}
            className="w-full bg-gradient-to-r from-[#FFD300] to-[#FFC700] hover:from-[#FFC700] hover:to-[#FFB600] text-black font-bold text-xl h-16 rounded-3xl shadow-2xl"
          >
            <Search className="w-6 h-6 mr-3" />
            Search Properties
          </Button>
        </motion.div>

        {/* WhatsApp AI Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <p className="text-white/70 text-lg mb-6 font-light">
            Or connect instantly with our AI assistant:
          </p>
          
          <Button
            onClick={handleWhatsAppAI}
            className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-lg h-16 rounded-3xl shadow-2xl flex items-center justify-center gap-4"
          >
            <MessageCircle className="w-6 h-6" />
            <div className="text-left">
              <p className="text-lg font-bold">Connect with WhatsApp AI</p>
              <p className="text-xs text-white/80 font-normal">Instant property search & recommendations</p>
            </div>
          </Button>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-6 mt-16"
        >
          <div className="text-center">
            <p className="text-6xl md:text-7xl font-bold text-[#FFD300] mb-2">
              {activeListings}+
            </p>
            <p className="text-white/60 uppercase tracking-wider text-sm font-semibold">
              Active Listings
            </p>
          </div>
          <div className="text-center">
            <p className="text-6xl md:text-7xl font-bold text-[#FFD300] mb-2">
              1200+
            </p>
            <p className="text-white/60 uppercase tracking-wider text-sm font-semibold">
              Happy Clients
            </p>
          </div>
          <div className="text-center">
            <p className="text-6xl md:text-7xl font-bold text-[#FFD300] mb-2">
              50+
            </p>
            <p className="text-white/60 uppercase tracking-wider text-sm font-semibold">
              Expert Brokers
            </p>
          </div>
          <div className="text-center">
            <p className="text-6xl md:text-7xl font-bold text-[#FFD300] mb-2">
              10+
            </p>
            <p className="text-white/60 uppercase tracking-wider text-sm font-semibold">
              Mumbai Zones
            </p>
          </div>
        </motion.div>
      </div>

      {/* Featured Properties Section (Below Stats) */}
      {featuredProperties.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-[#FFD300] text-black border-0 text-sm px-4 py-2 rounded-full font-bold">
                <Sparkles className="w-4 h-4 inline mr-2" />
                Featured Properties
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-[#111111] mb-5 tracking-tight">
                Handpicked For You
              </h2>
              <p className="text-lg text-gray-600 font-light max-w-2xl mx-auto">
                Verified listings personally selected by our team
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            <div className="text-center">
              <Link to={createPageUrl("SmartFeed")}>
                <Button size="lg" className="bg-gradient-to-r from-[#FFD300] to-[#FFC700] hover:from-[#FFC700] hover:to-[#FFB600] text-black font-bold px-8 py-6 rounded-2xl shadow-lg">
                  View All Properties
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}