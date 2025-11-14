/**
 * JSON-LD Schema Helpers for PropAI Live
 */

export function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "PropAI Live",
    "url": "https://propai.live",
    "logo": "https://propai.live/logo.png",
    "description": "AI-powered real estate intelligence platform for Mumbai. Real-time property listings, broker trust scoring, and building-level intelligence.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Mumbai",
      "addressRegion": "Maharashtra",
      "addressCountry": "IN"
    },
    "areaServed": {
      "@type": "City",
      "name": "Mumbai"
    },
    "sameAs": [
      "https://instagram.com/propailive",
      "https://linkedin.com/company/propai-live"
    ]
  };
}

export function generateWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "PropAI Live",
    "url": "https://propai.live",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://propai.live/smartfeed?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };
}

export function generateBreadcrumbJsonLd(crumbs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
}

export function generatePropertyJsonLd(property) {
  const priceInINR = property.price_unit === "crores" 
    ? property.price * 10000000 
    : property.price * 100000;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://propai.live';
  const propertyUrl = property.slug 
    ? `${baseUrl}/propertydetails?slug=${property.slug}` 
    : `${baseUrl}/propertydetails?id=${property.id}`;

  return {
    "@context": "https://schema.org",
    "@type": property.property_category === "Commercial" ? "CommercialRealEstateListing" : "RealEstateListing",
    "name": property.ai_title || `${property.bhk} in ${property.location}`,
    "description": property.ai_description || property.description || `${property.bhk} property for ${property.listing_type} in ${property.location}`,
    "url": propertyUrl,
    "identifier": property.custom_id || property.id,
    "datePosted": property.created_date,
    "validThrough": property.status === "Active" ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": property.building_name || property.pocket || "",
      "addressLocality": property.location || "Mumbai",
      "addressRegion": "Maharashtra",
      "postalCode": "400000",
      "addressCountry": "IN"
    },
    "geo": property.location ? {
      "@type": "GeoCoordinates",
      "address": `${property.location}, Mumbai, India`
    } : undefined,
    "floorSize": property.carpet_area ? {
      "@type": "QuantitativeValue",
      "value": property.carpet_area,
      "unitText": "square feet"
    } : undefined,
    "numberOfRooms": property.bhk ? parseInt(property.bhk.split(' ')[0]) || undefined : undefined,
    "numberOfBedrooms": property.bhk ? parseInt(property.bhk.split(' ')[0]) || undefined : undefined,
    "floorLevel": property.floor,
    "petsAllowed": property.veg_nonveg === "Both" || property.veg_nonveg === "Non-Veg Allowed",
    "smokingAllowed": false,
    "accommodationCategory": property.property_type || "Apartment",
    "amenityFeature": property.amenities?.map(a => ({
      "@type": "LocationFeatureSpecification",
      "name": a,
      "value": true
    })) || [],
    "image": property.images && property.images.length > 0 ? property.images : undefined,
    "offers": {
      "@type": "Offer",
      "price": priceInINR,
      "priceCurrency": "INR",
      "availability": property.status === "Active" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": property.price,
        "priceCurrency": "INR",
        "unitText": property.price_unit === "crores" ? "crore" : "lakh"
      },
      "validFrom": property.created_date,
      "seller": {
        "@type": "RealEstateAgent",
        "name": property.broker_name || "PropAI Live Broker",
        "telephone": property.broker_contact
      }
    },
    "additionalProperty": [
      property.furnishing ? {
        "@type": "PropertyValue",
        "name": "Furnishing",
        "value": property.furnishing
      } : null,
      property.parking ? {
        "@type": "PropertyValue",
        "name": "Parking",
        "value": property.parking
      } : null,
      property.possession ? {
        "@type": "PropertyValue",
        "name": "Possession",
        "value": property.possession
      } : null,
      property.view ? {
        "@type": "PropertyValue",
        "name": "View",
        "value": property.view
      } : null
    ].filter(Boolean)
  };
}

export function generateRequirementJsonLd(requirement) {
  return {
    "@context": "https://schema.org",
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `https://propai.live/smartfeed?bhk=${requirement.bhk_preference?.join(',')}&location=${requirement.preferred_locations?.join(',')}`
    },
    "query": `${requirement.bhk_preference?.join(' or ')} in ${requirement.preferred_locations?.join(' or ')}`
  };
}