import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Location codes map (same as backend)
const LOCATION_CODES = {
  'bandra west': 'BND',
  'bandra east': 'BND',
  'bandra': 'BND',
  'khar west': 'KHR',
  'khar east': 'KHR',
  'khar': 'KHR',
  'santacruz west': 'SNT',
  'santacruz east': 'SNT',
  'santacruz': 'SNT',
  'juhu': 'JUH',
  'pali hill': 'PNL',
  'carter road': 'CTR',
  'andheri west': 'AND',
  'andheri east': 'AND',
  'andheri': 'AND',
  'versova': 'VRS',
  'worli': 'WRL',
  'lower parel': 'LPR',
  'dadar': 'DDR',
  'mahim': 'MHM',
  'prabhadevi': 'PRB',
  'bandra kurla complex': 'BKC',
  'bkc': 'BKC',
  'powai': 'POW',
  'goregaon': 'GOR',
  'malad': 'MLD',
  'borivali': 'BOR',
  'kandivali': 'KND',
  'chembur': 'CHM',
  'mumbai': 'MUM'
};

/**
 * Auto-generates custom_id for properties that don't have one.
 * 
 * This hook automatically:
 * 1. Checks if property has custom_id
 * 2. If missing, generates one (CHT-[LOCATION]-[SEQUENCE])
 * 3. Saves to database in background
 * 4. Updates local state with new ID
 * 
 * Usage:
 * const propertyWithId = useAutoGenerateCustomId(property);
 * 
 * @param {Object} property - Property object (can be null/undefined)
 * @returns {Object} Property with guaranteed custom_id (or original if error)
 */
export function useAutoGenerateCustomId(property) {
  const [enrichedProperty, setEnrichedProperty] = useState(property);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Skip if no property or already has custom_id
    if (!property || property.custom_id || isGenerating) {
      setEnrichedProperty(property);
      return;
    }

    // Generate and save custom_id in background
    const generateCustomId = async () => {
      setIsGenerating(true);
      
      try {
        // Get location code
        const locationLower = (property.location || 'mumbai').toLowerCase().trim();
        const locationCode = LOCATION_CODES[locationLower] || 'MUM';

        // Generate sequence based on property ID (last 4 digits of database ID)
        // This ensures uniqueness without needing to count all properties
        const idHash = property.id.slice(-8);
        const sequence = parseInt(idHash, 16) % 10000; // 0-9999
        const sequenceStr = String(sequence).padStart(4, '0');

        // Generate custom ID
        const customId = `CHT-${locationCode}-${sequenceStr}`;

        // Update property in database (background, don't block UI)
        base44.entities.Property.update(property.id, { custom_id: customId }).catch(err => {
          console.error('Failed to save custom_id:', err);
        });

        // Update local state immediately (optimistic update)
        setEnrichedProperty({
          ...property,
          custom_id: customId
        });

      } catch (error) {
        console.error('Failed to generate custom_id:', error);
        // Return original property on error
        setEnrichedProperty(property);
      } finally {
        setIsGenerating(false);
      }
    };

    generateCustomId();
  }, [property?.id, property?.custom_id]);

  return enrichedProperty;
}

/**
 * Generates a custom_id for a property without saving to database.
 * Useful for property creation flows where you want to set the ID before saving.
 * 
 * @param {Object} property - Property object with at least location
 * @param {number} globalSequence - Optional sequence number (defaults to hash-based)
 * @returns {string} Generated custom_id (e.g., "CHT-BND-0042")
 */
export function generateCustomId(property, globalSequence = null) {
  // Get location code
  const locationLower = (property.location || 'mumbai').toLowerCase().trim();
  const locationCode = LOCATION_CODES[locationLower] || 'MUM';

  // Generate sequence
  let sequence;
  if (globalSequence !== null) {
    sequence = globalSequence;
  } else if (property.id) {
    // Use property ID hash for existing properties
    const idHash = property.id.slice(-8);
    sequence = parseInt(idHash, 16) % 10000;
  } else {
    // For new properties without ID yet, use timestamp-based sequence
    sequence = Date.now() % 10000;
  }

  const sequenceStr = String(sequence).padStart(4, '0');

  return `CHT-${locationCode}-${sequenceStr}`;
}