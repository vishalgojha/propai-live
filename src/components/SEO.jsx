import { useEffect } from 'react';

// Default OG image - using Unsplash placeholder for Mumbai skyline
const DEFAULT_OG_IMAGE = 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200&h=630&fit=crop';

export default function SEO({ 
  title = 'PropAI Live | AI-Powered Mumbai Real Estate Intelligence', 
  description = 'Real-time property data for Mumbai. AI-powered matching, building intelligence, and broker trust scoring. Find verified properties with transparent pricing.',
  ogImage, 
  schema,
  canonical 
}) {
  useEffect(() => {
    // Set document title
    if (title) {
      document.title = title;
    }

    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && description) {
      metaDescription.setAttribute('content', description);
    } else if (description) {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }

    // Use provided image or default
    const imageUrl = ogImage || DEFAULT_OG_IMAGE;

    // Set OG tags
    const setOGTag = (property, content) => {
      if (!content) return;
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (tag) {
        tag.setAttribute('content', content);
      } else {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        tag.setAttribute('content', content);
        document.head.appendChild(tag);
      }
    };

    setOGTag('og:title', title);
    setOGTag('og:description', description);
    setOGTag('og:image', imageUrl);
    setOGTag('og:image:width', '1200');
    setOGTag('og:image:height', '630');
    setOGTag('og:image:alt', title);
    setOGTag('og:type', 'website');
    setOGTag('og:url', canonical || window.location.href);
    setOGTag('og:site_name', 'PropAI Live');

    // Set Twitter Card tags
    const setTwitterTag = (name, content) => {
      if (!content) return;
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (tag) {
        tag.setAttribute('content', content);
      } else {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        tag.setAttribute('content', content);
        document.head.appendChild(tag);
      }
    };

    setTwitterTag('twitter:card', 'summary_large_image');
    setTwitterTag('twitter:site', '@propailive');
    setTwitterTag('twitter:title', title);
    setTwitterTag('twitter:description', description);
    setTwitterTag('twitter:image', imageUrl);
    setTwitterTag('twitter:image:alt', title);

    // Set canonical URL
    const canonicalUrl = canonical || window.location.href.split('?')[0]; // Remove query params
    let link = document.querySelector('link[rel="canonical"]');
    if (link) {
      link.setAttribute('href', canonicalUrl);
    } else {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', canonicalUrl);
      document.head.appendChild(link);
    }

    // Add Schema.org JSON-LD
    if (schema) {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (script) {
        script.textContent = JSON.stringify(schema);
      } else {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
      }
    }
  }, [title, description, ogImage, schema, canonical]);

  return null;
}