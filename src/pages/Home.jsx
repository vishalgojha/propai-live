import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
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

  // Get active properties and featured properties
  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const props = await base44.entities.Property.list('-created_date');
      return props.filter(p => p.status === "Active" && !p.is_duplicate);
    },
    initialData: [],
  });

  // Get featured properties (max 3)
  const featuredProperties = properties.filter(p => p.featured).slice(0, 3);
  
  // If no featured properties, show latest 3
  const displayProperties = featuredProperties.length > 0 
    ? featuredProperties 
    : properties.slice(0, 3);

  const activeListings = properties.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2a2826] via-[#3a3633] to-[#2a2826]">
      <SEO
        title="Chariot Realty | AI-Powered Real Estate in Mumbai"
        description="Find verified properties in Bandra, Juhu, Andheri & more. AI-powered property search with transparent pricing."
        schema={homeSchema}
        canonical="https://chariotrealtors.in"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        
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

        {/* Featured Properties Section */}
        {displayProperties.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-16"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {featuredProperties.length > 0 ? 'Featured Properties' : 'Latest Properties'}
                </h2>
                <p className="text-white/60 text-sm">Handpicked listings for you</p>
              </div>
              <Link to={createPageUrl("SmartFeed")}>
                <Button
                  variant="outline"
                  className="border-2 border-white/20 text-white hover:bg-white hover:text-black font-semibold rounded-2xl"
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onViewDetails={() => {}}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-6"
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
    </div>
  );
}