/**
 * Client-side property utilities
 * Replaces backend normalization and slug generation functions
 */

/**
 * Generate a URL-friendly slug from property details
 */
export function generatePropertySlug(property) {
  if (!property) return '';
  
  const parts = [];
  
  // Location (primary)
  if (property.location) {
    parts.push(property.location.toLowerCase());
  }
  
  // BHK
  if (property.bhk) {
    parts.push(property.bhk.toLowerCase().replace(/\s+/g, '-'));
  }
  
  // Building name (if available)
  if (property.building_name) {
    parts.push(property.building_name.toLowerCase());
  }
  
  // Listing type
  if (property.listing_type) {
    parts.push(property.listing_type.toLowerCase());
  }
  
  // Create slug
  let slug = parts
    .join('-')
    .replace(/[^a-z0-9-]/g, '-') // Remove special chars
    .replace(/-+/g, '-')          // Collapse multiple hyphens
    .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
  
  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  slug += `-${randomSuffix}`;
  
  return slug;
}

/**
 * Normalize Indian phone number
 * Returns format: 919819635608
 */
export function normalizePhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // Extract last 10 digits
  cleaned = cleaned.slice(-10);
  
  // Validate (must be 10 digits starting with 6/7/8/9)
  if (cleaned.length !== 10 || !['6', '7', '8', '9'].includes(cleaned[0])) {
    return null;
  }
  
  // Add country code
  return '91' + cleaned;
}

/**
 * Normalize BHK values
 */
export function normalizeBhk(bhk) {
  if (!bhk) return bhk;
  
  const bhkStr = String(bhk).toUpperCase().trim();
  
  // Extract number
  const match = bhkStr.match(/(\d+)/);
  if (!match) return bhk;
  
  const number = match[1];
  
  // Standardize format
  return `${number} BHK`;
}

/**
 * Normalize parking values
 */
export function normalizeParking(parking) {
  if (!parking) return parking;
  
  const parkingStr = String(parking).toLowerCase().trim();
  
  // Common patterns
  if (parkingStr.match(/^[0-9]+$/)) {
    const num = parseInt(parkingStr);
    return num === 1 ? '1 Covered' : `${num} Covered`;
  }
  
  if (parkingStr.includes('covered') || parkingStr.includes('cov')) {
    return parkingStr.replace(/cov\b/g, 'Covered');
  }
  
  if (parkingStr.includes('open')) {
    return parkingStr.replace(/open/g, 'Open');
  }
  
  if (parkingStr.match(/no|none|nil/)) {
    return 'No Parking';
  }
  
  return parking;
}

/**
 * Normalize location names (Mumbai-specific)
 */
export function normalizeLocation(location) {
  if (!location) return location;
  
  const locationStr = String(location).trim();
  
  // Common Mumbai location normalizations
  const normalizations = {
    'Bandra W': 'Bandra West',
    'Bandra E': 'Bandra East',
    'Andheri W': 'Andheri West',
    'Andheri E': 'Andheri East',
    'Santacruz W': 'Santacruz West',
    'Santacruz E': 'Santacruz East',
    'Juhu': 'Juhu',
    'Worli': 'Worli',
    'BKC': 'Bandra Kurla Complex',
    'Powai': 'Powai',
    'Lower Parel': 'Lower Parel',
    'Prabhadevi': 'Prabhadevi',
    'Dadar W': 'Dadar West',
    'Dadar E': 'Dadar East',
    'Malad W': 'Malad West',
    'Malad E': 'Malad East',
    'Goregaon W': 'Goregaon West',
    'Goregaon E': 'Goregaon East',
  };
  
  // Check for direct match
  for (const [abbr, full] of Object.entries(normalizations)) {
    if (locationStr.toLowerCase() === abbr.toLowerCase()) {
      return full;
    }
  }
  
  // Proper case
  return locationStr
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Generate custom ID (e.g., CHR-PROP-0001)
 */
export function generateCustomId(type, count) {
  const prefix = type === 'property' ? 'CHR-PROP' : 
                 type === 'broker' ? 'CHR-BRK' : 
                 type === 'requirement' ? 'CHR-REQ' : 
                 type === 'building' ? 'CHR-BLD' : 'CHR';
  
  const paddedCount = String(count + 1).padStart(4, '0');
  return `${prefix}-${paddedCount}`;
}

/**
 * Detect potential duplicate properties
 */
export function detectDuplicateProperty(property, existingProperties) {
  if (!property || !existingProperties) return [];
  
  const matches = [];
  
  // Create fingerprint
  const fingerprint = [
    property.bhk,
    Math.round(property.price),
    property.carpet_area,
    property.building_name,
    property.location,
    property.floor
  ].filter(Boolean).join('|').toLowerCase();
  
  for (const existing of existingProperties) {
    if (existing.id === property.id) continue;
    
    const existingFingerprint = [
      existing.bhk,
      Math.round(existing.price),
      existing.carpet_area,
      existing.building_name,
      existing.location,
      existing.floor
    ].filter(Boolean).join('|').toLowerCase();
    
    if (fingerprint === existingFingerprint) {
      matches.push(existing);
    }
  }
  
  return matches;
}

/**
 * Format price for display
 */
export function formatPrice(price, unit) {
  if (!price) return 'Price on request';
  
  if (unit === 'crores') {
    if (price < 1) {
      const lakhs = price * 100;
      return `₹${lakhs} ${lakhs === 1 ? 'Lakh' : 'Lakhs'}`;
    }
    return `₹${price} Cr`;
  }
  
  if (price >= 100) {
    const crores = (price / 100).toFixed(2);
    return `₹${crores} Cr`;
  } else if (price < 1) {
    const thousands = (price * 100).toFixed(0);
    return `₹${thousands}K`;
  }
  
  return `₹${price} ${price === 1 ? 'Lakh' : 'Lakhs'}`;
}

/**
 * Validate property data before submission
 */
export function validatePropertyData(property) {
  const errors = [];
  
  if (!property.bhk) errors.push('BHK is required');
  if (!property.price) errors.push('Price is required');
  if (!property.listing_type) errors.push('Listing type is required');
  if (!property.location) errors.push('Location is required');
  if (!property.property_category) errors.push('Property category is required');
  if (!property.broker_id) errors.push('Broker information is required');
  
  // Validate phone if provided
  if (property.broker_contact) {
    const normalized = normalizePhoneNumber(property.broker_contact);
    if (!normalized) {
      errors.push('Invalid phone number (must be 10-digit Indian number)');
    }
  }
  
  return errors;
}

/**
 * Clean and prepare property data for submission
 */
export function preparePropertyData(property) {
  const cleaned = { ...property };
  
  // Normalize fields
  if (cleaned.bhk) cleaned.bhk = normalizeBhk(cleaned.bhk);
  if (cleaned.parking) cleaned.parking = normalizeParking(cleaned.parking);
  if (cleaned.location) cleaned.location = normalizeLocation(cleaned.location);
  if (cleaned.broker_contact) cleaned.broker_contact = normalizePhoneNumber(cleaned.broker_contact);
  
  // Generate slug if missing
  if (!cleaned.slug) {
    cleaned.slug = generatePropertySlug(cleaned);
  }
  
  // Set defaults
  if (!cleaned.status) cleaned.status = 'Active';
  if (!cleaned.visibility) cleaned.visibility = 'public';
  if (cleaned.views_count === undefined) cleaned.views_count = 0;
  
  return cleaned;
}