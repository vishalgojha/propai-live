/**
 * JSON-LD Schema Helper Functions for PropAI Live
 * These are inlined helper functions to avoid module resolution issues
 */

export const generateOrganizationJsonLd = () => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://propai.live';
  
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PropAI Live",
    "url": origin,
    "logo": `${origin}/logo.png`,
    "description": "AI-powered real estate intelligence platform for Mumbai",
    "sameAs": [
      "https://www.linkedin.com/company/propai-live",
      "https://instagram.com/propailive"
    ]
  };
};

export const generateWebSiteJsonLd = () => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://propai.live';
  
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "PropAI Live",
    "url": origin,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${origin}/smartfeed?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
};

export const generateBreadcrumbJsonLd = (breadcrumbs) => {
  if (!breadcrumbs || breadcrumbs.length === 0) return null;
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
};

export const generatePropertyJsonLd = (property) => {
  if (!property) return null;
  
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://propai.live';
  const priceInINR = property.price_unit === 'crores' ? property.price * 10000000 : property.price * 100000;
  const propertyUrl = property.slug ? `${origin}/propertydetails?slug=${property.slug}` : `${origin}/propertydetails?id=${property.id}`;
  
  return {
    "@context": "https://schema.org",
    "@type": "Residence",
    "name": property.ai_title || `${property.bhk} in ${property.location}`,
    "description": property.ai_description || property.description || `${property.bhk} property in ${property.location}`,
    "url": propertyUrl,
    "image": property.images && property.images.length > 0 ? property.images : undefined,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": property.location,
      "addressRegion": "Maharashtra",
      "addressCountry": "IN"
    },
    "offers": {
      "@type": "Offer",
      "price": priceInINR,
      "priceCurrency": "INR",
      "url": propertyUrl
    }
  };
};

export const generateRequirementJsonLd = (requirement) => {
  if (!requirement) return null;
  
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://propai.live';
  const requirementUrl = requirement.slug ? `${origin}/requirementdetails?slug=${requirement.slug}` : `${origin}/requirementdetails?id=${requirement.id}`;
  
  return {
    "@context": "https://schema.org",
    "@type": "SearchAction",
    "name": `Property Search: ${requirement.bhk_preference?.join(' / ') || 'Property'} in ${requirement.preferred_locations?.join(', ') || 'Mumbai'}`,
    "target": requirementUrl
  };
};