import { useEffect } from 'react';

// Default OG image - PropAI Live branded screenshot
const DEFAULT_OG_IMAGE = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690cfb8070b3f94428fee21c/b779b3c9f_Screenshot_2025-11-08-06-49-19-86_40deb401b9ffe8e1df2f1cc5ba480b122.jpg';

export default function SEO({ 
  title = 'PropAI Live | AI-Powered Mumbai Real Estate Intelligence', 
  description = 'Stop losing deals in WhatsApp chaos. AI turns messy broker chats into structured listings in seconds. Powered by Building-Level Intelligence.',
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

    // Use provided image or default branded screenshot
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
    setOGTag('og:image:width', '1080');
    setOGTag('og:image:height', '1920');
    setOGTag('og:image:alt', 'PropAI Live - WhatsApp to Organized Properties, Instantly');
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
    setTwitterTag('twitter:image:alt', 'PropAI Live - WhatsApp to Organized Properties, Instantly');

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