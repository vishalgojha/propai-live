import { useEffect } from "react";

/**
 * SEO Component - Manages meta tags and structured data
 * @param {string} title - Page title
 * @param {string} description - Page description
 * @param {string} ogImage - Open Graph image URL
 * @param {Object|Array} schema - Schema.org JSON-LD data (single object or array)
 * @param {string} canonical - Canonical URL
 * @param {Object} organization - Organization schema (optional, auto-added if not provided)
 * @param {Object} breadcrumbs - Breadcrumb schema (optional)
 */
export default function SEO({ 
  title, 
  description, 
  ogImage, 
  schema, 
  canonical,
  organization,
  breadcrumbs
}) {
  useEffect(() => {
    // Update title
    if (title) {
      document.title = title;
    }

    // Helper function to set/update meta tags
    const setMetaTag = (name, content, isProperty = false) => {
      if (!content) return;
      
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let tag = document.querySelector(selector);
      
      if (tag) {
        tag.setAttribute('content', content);
      } else {
        tag = document.createElement('meta');
        if (isProperty) {
          tag.setAttribute('property', name);
        } else {
          tag.setAttribute('name', name);
        }
        tag.setAttribute('content', content);
        document.head.appendChild(tag);
      }
    };

    // Set description
    if (description) {
      setMetaTag('description', description);
      setMetaTag('og:description', description, true);
      setMetaTag('twitter:description', description);
    }

    // Set Open Graph image
    if (ogImage) {
      setMetaTag('og:image', ogImage, true);
      setMetaTag('twitter:image', ogImage);
    }

    // Set canonical URL
    if (canonical) {
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) {
        canonicalLink.setAttribute('href', canonical);
      } else {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        canonicalLink.setAttribute('href', canonical);
        document.head.appendChild(canonicalLink);
      }
      setMetaTag('og:url', canonical, true);
    }

    // Set Open Graph title
    if (title) {
      setMetaTag('og:title', title, true);
      setMetaTag('twitter:title', title);
    }

    // Handle Schema.org JSON-LD structured data
    if (schema || organization || breadcrumbs) {
      // Remove all existing JSON-LD scripts added by SEO component
      const existingScripts = document.querySelectorAll('script[type="application/ld+json"][data-seo-component="true"]');
      existingScripts.forEach(script => script.remove());

      // Array to hold all schemas to insert
      const schemasToInsert = [];

      // Add provided schema(s)
      if (schema) {
        if (Array.isArray(schema)) {
          schemasToInsert.push(...schema);
        } else {
          schemasToInsert.push(schema);
        }
      }

      // Add organization schema if provided
      if (organization) {
        schemasToInsert.push(organization);
      }

      // Add breadcrumbs schema if provided
      if (breadcrumbs) {
        schemasToInsert.push(breadcrumbs);
      }

      // Insert all schemas
      schemasToInsert.forEach(schemaData => {
        if (schemaData) {
          const script = document.createElement('script');
          script.setAttribute('type', 'application/ld+json');
          script.setAttribute('data-seo-component', 'true');
          script.textContent = JSON.stringify(schemaData);
          document.head.appendChild(script);
        }
      });
    }

    // Cleanup function
    return () => {
      // Optional: Clean up on unmount if needed
      // For now, we'll leave the tags as they are helpful for navigation
    };
  }, [title, description, ogImage, schema, canonical, organization, breadcrumbs]);

  return null; // This component doesn't render anything
}