import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { generatePropertySlug } from '../utils/propertyHelpers';

/**
 * Hook to automatically generate slugs for properties without them
 * Runs on-demand when properties are displayed
 */
export function useAutoSlugGeneration(property) {
  useEffect(() => {
    if (!property || property.slug) return;
    
    // Check if already processed in this session
    const processedKey = `slug-generated-${property.id}`;
    if (sessionStorage.getItem(processedKey)) return;
    
    const generateSlug = async () => {
      try {
        const slug = generatePropertySlug(property);
        
        await base44.entities.Property.update(property.id, { slug });
        
        // Mark as processed
        sessionStorage.setItem(processedKey, 'true');
        
        console.log(`Generated slug for property ${property.id}: ${slug}`);
      } catch (error) {
        console.error('Failed to generate slug:', error);
      }
    };
    
    // Debounce - only generate if property visible for 1 second
    const timer = setTimeout(generateSlug, 1000);
    return () => clearTimeout(timer);
    
  }, [property?.id, property?.slug]);
}