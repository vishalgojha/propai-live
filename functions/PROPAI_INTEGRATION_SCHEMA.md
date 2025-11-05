# PropAI Live Integration Schema

**Version:** 1.0  
**Last Updated:** 2025-11-05  
**Integration Type:** Real-time property data sync from Chariot Realty

---

## Overview

Chariot Realty sends property data to PropAI Live in real-time whenever:
- A new property is created (`data_type: "property_created"`)
- An existing property is updated (`data_type: "property_updated"`)

All payloads are sent via `POST` to your `/api/receive` endpoint.

---

## API Contract

### Endpoint
```
POST https://propai-live.deno.dev/api/receive
```

### Headers
```json
{
  "Content-Type": "application/json",
  "x-api-key": "YOUR_SHARED_API_KEY"
}
```

### Request Payload Structure
```json
{
  "data_type": "property_created" | "property_updated",
  "data": { /* Property object - see full schema below */ }
}
```

### Response Expected
```json
{
  "success": true,
  "message": "Property received successfully",
  "property_id": "CHT-BND-0234"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid API key" | "Missing required field: bhk" | "Validation failed"
}
```

---

## Full Property Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Internal Chariot database ID (UUID)"
    },
    "custom_id": {
      "type": "string",
      "pattern": "^CHT-[A-Z]{3}-[0-9]{4}$",
      "description": "Human-readable Chariot ID (e.g., CHT-BND-0234)",
      "example": "CHT-BND-0234"
    },
    "property_category": {
      "type": "string",
      "enum": ["Residential", "Commercial"],
      "description": "Top-level property classification"
    },
    "bhk": {
      "type": "string",
      "description": "BHK for residential (e.g., '2 BHK', '3 BHK') OR space type for commercial (e.g., 'Office Space', 'Retail Shop')",
      "examples": ["2 BHK", "3 BHK", "Office Space", "Retail Shop", "Showroom"]
    },
    "jodi_flag": {
      "type": "boolean",
      "description": "True if property is a combined flat (2 units merged). Residential only.",
      "default": false
    },
    "price": {
      "type": "number",
      "description": "Property price as a number",
      "example": 150
    },
    "price_unit": {
      "type": "string",
      "enum": ["lakhs", "crores"],
      "description": "Unit for price field",
      "example": "lakhs"
    },
    "carpet_area": {
      "type": "number",
      "description": "Carpet area in square feet",
      "example": 1200
    },
    "built_up_area": {
      "type": "number",
      "description": "Built-up area in square feet",
      "example": 1400
    },
    "floor": {
      "type": "string",
      "description": "Floor number or description",
      "examples": ["12", "Ground Floor", "15-18"]
    },
    "total_floors": {
      "type": "string",
      "description": "Total floors in building",
      "example": "25"
    },
    "furnishing": {
      "type": "string",
      "enum": ["Unfurnished", "Semi-Furnished", "Fully Furnished", "Bare Shell", "Warm Shell"],
      "description": "Furnishing status. 'Bare Shell'/'Warm Shell' are commercial-specific."
    },
    "parking": {
      "type": "string",
      "description": "Parking details",
      "examples": ["2 Covered Parking", "1 Car + 1 Bike", "No Parking"]
    },
    "possession": {
      "type": "string",
      "description": "Possession status or date",
      "examples": ["Immediate", "Ready to Move", "Dec 2025", "Under Construction"]
    },
    "property_type": {
      "type": "string",
      "enum": ["Apartment", "Villa", "Penthouse", "Studio", "Builder Floor", "Office Space", "Retail Shop", "Showroom", "Warehouse", "Commercial Complex"],
      "description": "Specific property type"
    },
    "amenities": {
      "type": "array",
      "items": { "type": "string" },
      "description": "List of amenities",
      "examples": [["Gym", "Swimming Pool", "Club House", "Garden", "Security"]]
    },
    "view": {
      "type": "string",
      "description": "View from property",
      "examples": ["Sea View", "Garden Facing", "City View", "Pool View"]
    },
    "veg_nonveg": {
      "type": "string",
      "enum": ["Veg Only", "Non-Veg Allowed", "Both", "N/A"],
      "description": "Food preference restrictions (Residential only)"
    },
    "city": {
      "type": "string",
      "description": "City name - always 'Mumbai' for Chariot",
      "default": "Mumbai"
    },
    "location": {
      "type": "string",
      "description": "Primary market zone - MAIN DISPLAY FIELD",
      "examples": ["Bandra West", "Khar West", "Juhu", "Andheri East", "BKC"]
    },
    "pocket": {
      "type": "string",
      "description": "Micro-area/neighborhood within location",
      "examples": ["Pali Hill", "Carter Road", "Linking Road", "Hill Road"]
    },
    "landmark": {
      "type": "string",
      "description": "Nearby landmark (optional)",
      "examples": ["Near Khar Gymkhana", "Opposite Shoppers Stop", "Behind Mount Mary"]
    },
    "building_name": {
      "type": "string",
      "description": "Building or society name",
      "examples": ["Oberoi Sky Heights", "Rustomjee Paramount", "Kanhaiya Shopping Center"]
    },
    "building_id": {
      "type": "string",
      "format": "uuid",
      "description": "Reference to Chariot's Building entity (UUID)"
    },
    "expat_friendly": {
      "type": "boolean",
      "description": "Curated for expat clients (fully furnished + good amenities + expat-friendly building)",
      "default": false
    },
    "ai_title": {
      "type": "string",
      "description": "AI-generated natural language title (12-18 words)",
      "example": "Stunning 2 BHK Sea View Apartment in Oberoi Sky Heights, Bandra West with Modern Amenities"
    },
    "ai_description": {
      "type": "string",
      "description": "AI-generated engaging description (40-80 words, full paragraph)",
      "example": "Experience luxury living in this beautifully designed 2 BHK apartment at Oberoi Sky Heights, Bandra West. Featuring breathtaking sea views, modern Italian-style kitchen, spacious balconies, and premium wooden flooring. The building offers world-class amenities including a gym, pool, and 24/7 security. Located in the heart of Bandra, you're minutes away from Linking Road shopping, trendy cafes, and excellent schools."
    },
    "description": {
      "type": "string",
      "description": "Full property description (fallback if no AI description)"
    },
    "source_text": {
      "type": "string",
      "description": "Original broker message/text that was parsed"
    },
    "broker_id": {
      "type": "string",
      "format": "uuid",
      "description": "Reference to external broker who provided listing (UUID)"
    },
    "broker_contact": {
      "type": "string",
      "description": "Broker phone number (cached for performance)",
      "example": "+919876543210"
    },
    "broker_trust_score": {
      "type": "number",
      "minimum": 0,
      "maximum": 100,
      "description": "Broker's trust score at time of listing (0-100). Higher = more reliable broker."
    },
    "assigned_agent_id": {
      "type": "string",
      "format": "uuid",
      "description": "Internal Chariot agent (Vishal/Kapil) assigned to handle this property"
    },
    "assigned_agent_name": {
      "type": "string",
      "description": "Cached agent name",
      "examples": ["Vishal", "Kapil"]
    },
    "images": {
      "type": "array",
      "items": { 
        "type": "string",
        "format": "uri"
      },
      "description": "Array of image URLs (publicly accessible)"
    },
    "status": {
      "type": "string",
      "enum": ["Active", "Sold", "Rented", "On Hold", "Draft"],
      "description": "Property listing status",
      "default": "Active"
    },
    "listing_type": {
      "type": "string",
      "enum": ["Sale", "Rent", "Lease", "Pre Leased"],
      "description": "Listing type. 'Pre Leased' = commercial property already leased to tenant"
    },
    "featured": {
      "type": "boolean",
      "description": "Featured property flag",
      "default": false
    },
    "views_count": {
      "type": "number",
      "description": "Number of times viewed on Chariot platform",
      "default": 0
    },
    "slug": {
      "type": "string",
      "description": "SEO-friendly URL slug",
      "example": "bandra-west-2bhk-oberoi-sky-heights"
    },
    "is_duplicate": {
      "type": "boolean",
      "description": "Marked as duplicate (exact match with another listing)",
      "default": false
    },
    "duplicate_of": {
      "type": "string",
      "format": "uuid",
      "description": "ID of original property if this is a duplicate"
    },
    "price_per_sqft": {
      "type": "number",
      "description": "Calculated price per square foot (for market analysis)"
    },
    "price_change_history": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "old_price": { "type": "number" },
          "new_price": { "type": "number" },
          "date": { "type": "string", "format": "date-time" }
        }
      },
      "description": "Track price changes over time"
    },
    "created_date": {
      "type": "string",
      "format": "date-time",
      "description": "Timestamp when property was created"
    },
    "updated_date": {
      "type": "string",
      "format": "date-time",
      "description": "Timestamp when property was last updated"
    },
    "created_by": {
      "type": "string",
      "description": "Email of user who created the property (usually admin)"
    }
  },
  "required": [
    "custom_id",
    "bhk",
    "price",
    "price_unit",
    "listing_type",
    "location",
    "property_category",
    "broker_id",
    "status"
  ]
}
```

---

## Related Schemas

### Broker Entity (Referenced by `broker_id`)
```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "custom_id": { "type": "string", "example": "CHR-BRK-0001" },
    "name": { "type": "string", "example": "Robert Dsilva" },
    "phone": { "type": "string", "example": "+919876543210" },
    "agency_name": { "type": "string", "example": "Global Real Estate Consultants" },
    "trust_score": { "type": "number", "minimum": 0, "maximum": 100 },
    "status": { "type": "string", "enum": ["Active", "Dormant", "Blacklisted", "Verified"] },
    "areas_covered": { "type": "array", "items": { "type": "string" } }
  }
}
```

### Building Entity (Referenced by `building_id`)
```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "custom_id": { "type": "string", "example": "CHR-BLD-0001" },
    "name": { "type": "string", "example": "Oberoi Sky Heights" },
    "location": { "type": "string", "example": "Bandra West" },
    "pocket": { "type": "string", "example": "Pali Hill" },
    "total_floors": { "type": "number" },
    "year_built": { "type": "number" },
    "amenities": { "type": "array", "items": { "type": "string" } },
    "avg_rent_2bhk": { "type": "number" },
    "market_activity": { "type": "string", "enum": ["High Activity", "Moderate", "Low Activity", "Unknown"] }
  }
}
```

---

## Example Payloads

### Example 1: Residential Property (Sale)
```json
{
  "data_type": "property_created",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "custom_id": "CHT-BND-0234",
    "property_category": "Residential",
    "bhk": "2 BHK",
    "jodi_flag": false,
    "price": 180,
    "price_unit": "lakhs",
    "carpet_area": 1200,
    "built_up_area": 1400,
    "floor": "12",
    "total_floors": "25",
    "furnishing": "Semi-Furnished",
    "parking": "1 Covered Parking",
    "possession": "Ready to Move",
    "property_type": "Apartment",
    "amenities": ["Gym", "Swimming Pool", "Security", "Garden"],
    "view": "Sea View",
    "veg_nonveg": "Both",
    "city": "Mumbai",
    "location": "Bandra West",
    "pocket": "Pali Hill",
    "landmark": "Near Khar Gymkhana",
    "building_name": "Oberoi Sky Heights",
    "building_id": "660e8400-e29b-41d4-a716-446655440001",
    "expat_friendly": true,
    "ai_title": "Stunning 2 BHK Sea View Apartment in Oberoi Sky Heights, Bandra West",
    "ai_description": "Experience luxury living in this beautifully designed 2 BHK apartment at Oberoi Sky Heights, Bandra West. Featuring breathtaking sea views, modern kitchen, and premium flooring.",
    "broker_id": "770e8400-e29b-41d4-a716-446655440002",
    "broker_contact": "+919876543210",
    "broker_trust_score": 85,
    "assigned_agent_name": "Vishal",
    "images": [
      "https://storage.chariot.com/properties/img1.jpg",
      "https://storage.chariot.com/properties/img2.jpg"
    ],
    "status": "Active",
    "listing_type": "Sale",
    "slug": "bandra-west-2bhk-oberoi-sky-heights",
    "is_duplicate": false,
    "price_per_sqft": 15000,
    "created_date": "2025-11-05T10:30:00Z",
    "updated_date": "2025-11-05T10:30:00Z",
    "created_by": "vishal@chariotrealty.com"
  }
}
```

### Example 2: Commercial Property (Lease)
```json
{
  "data_type": "property_created",
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "custom_id": "CHT-BKC-0045",
    "property_category": "Commercial",
    "bhk": "Office Space",
    "price": 2,
    "price_unit": "lakhs",
    "carpet_area": 600,
    "floor": "3",
    "total_floors": "8",
    "furnishing": "Warm Shell",
    "parking": "2 Reserved Parking",
    "possession": "Immediate",
    "property_type": "Office Space",
    "amenities": ["24/7 Power Backup", "Cafeteria", "Conference Room"],
    "city": "Mumbai",
    "location": "BKC",
    "building_name": "Kanhaiya Shopping Center",
    "building_id": "990e8400-e29b-41d4-a716-446655440004",
    "expat_friendly": false,
    "ai_title": "Premium 600 Sq.Ft Office Space in Kanhaiya Shopping Center, BKC",
    "ai_description": "Modern office space in the heart of BKC, Mumbai's prime business district. Warm shell finish ready for your interior design. Excellent connectivity and amenities.",
    "broker_id": "aa0e8400-e29b-41d4-a716-446655440005",
    "broker_contact": "+919123456789",
    "broker_trust_score": 78,
    "images": [],
    "status": "Active",
    "listing_type": "Lease",
    "slug": "bkc-office-space-kanhaiya-shopping-center",
    "is_duplicate": false,
    "price_per_sqft": 3333,
    "created_date": "2025-11-05T11:15:00Z",
    "updated_date": "2025-11-05T11:15:00Z"
  }
}
```

### Example 3: Property Update
```json
{
  "data_type": "property_updated",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "custom_id": "CHT-BND-0234",
    "price": 175,
    "price_unit": "lakhs",
    "images": [
      "https://storage.chariot.com/properties/img1.jpg",
      "https://storage.chariot.com/properties/img2.jpg",
      "https://storage.chariot.com/properties/img3.jpg"
    ],
    "price_change_history": [
      {
        "old_price": 180,
        "new_price": 175,
        "date": "2025-11-05T14:20:00Z"
      }
    ],
    "updated_date": "2025-11-05T14:20:00Z"
  }
}
```

---

## Field Usage Patterns

### Location Hierarchy
```
city → location → pocket → landmark → building_name
```
- **city**: Always "Mumbai" (for SEO)
- **location**: Primary market zone (MAIN FILTER) - e.g., "Bandra West"
- **pocket**: Micro-area (SECONDARY TAG) - e.g., "Pali Hill"
- **landmark**: Optional reference point - e.g., "Near Khar Gymkhana"
- **building_name**: Specific building - e.g., "Oberoi Sky Heights"

### Price Display Logic
```javascript
if (property_category === "Residential") {
  if (listing_type === "Sale") {
    // Use crores for display if price_unit = "crores"
    display = `₹${price} ${price_unit === 'crores' ? 'Cr' : 'L'}`
  } else {
    // Rent always in lakhs
    display = `₹${price}L/month`
  }
} else if (property_category === "Commercial") {
  // Commercial can be lakhs or crores
  display = `₹${price} ${price_unit === 'crores' ? 'Cr' : 'L'}/month`
}
```

### BHK Field Interpretation
```javascript
if (property_category === "Residential") {
  // bhk = "1 BHK", "2 BHK", "3 BHK", "4 BHK", "5+ BHK", "Studio"
} else if (property_category === "Commercial") {
  // bhk = "Office Space", "Retail Shop", "Showroom", "Warehouse"
}
```

---

## Data Quality Notes

### High-Quality Indicators
- ✅ `broker_trust_score >= 80` → Reliable data source
- ✅ `images.length >= 3` → Well-documented property
- ✅ `ai_description` present → Professionally presented
- ✅ `building_id` present → Linked to building intelligence
- ✅ `expat_friendly = true` → Curated for international audience

### Duplicate Detection
- Properties with `is_duplicate: true` should be filtered out
- `duplicate_of` field links to original property
- Duplicates are auto-detected via AI analysis

---

## Rate Limits & Volume

**Expected Volume:**
- **Peak Hours**: 10-20 properties/hour (broker activity high 10 AM - 6 PM IST)
- **Average**: 50-100 properties/day
- **Spikes**: Up to 100 properties/hour during bulk parsing sessions

**Rate Limits:**
- No hard rate limits from Chariot side
- We expect 200ms response time from PropAI endpoint
- Failed requests will be retried (max 3 attempts)

---

## Webhook Reliability

### Retry Logic
```javascript
// Chariot's sendToPropAI function behavior:
- Attempt 1: Immediate
- Attempt 2: After 2 seconds (if failed)
- Attempt 3: After 5 seconds (if failed)
- If all 3 fail: Log error and continue (non-blocking)
```

### Success Criteria
- HTTP 200-299 status code = Success
- HTTP 400-499 = Client error (won't retry)
- HTTP 500-599 = Server error (will retry)
- Network timeout = Retry

---

## Security

### API Key Validation
```javascript
const PROPAI_API_KEY = Deno.env.get('PROPAI_LIVE_API_KEY');

// Chariot sends in header:
headers: {
  'x-api-key': PROPAI_API_KEY
}

// PropAI should validate:
if (request.headers.get('x-api-key') !== YOUR_EXPECTED_KEY) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## Testing

### Test Payload (Use for Validation)
```bash
curl -X POST https://propai-live.deno.dev/api/receive \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_KEY" \
  -d '{
    "data_type": "test_ping",
    "data": {
      "source": "chariot_realty",
      "test": true,
      "timestamp": "2025-11-05T15:00:00Z",
      "message": "Testing connection from Chariot Realty"
    }
  }'
```

### Chariot's Test Function
We have a `testPropAIConnection` function that sends test pings. Expected response:
```json
{
  "success": true,
  "message": "Test ping received successfully"
}
```

---

## Contact

**Chariot Realty Team:**
- Vishal (Founder): +91 98194 71310 / vishal@chariotrealty.com
- Kapil (Partner): +91 97737 57759 / kapil@chariotrealty.com

**Technical Integration:**
- Schema Version: 1.0
- Last Updated: 2025-11-05
- Questions: Refer to this document first, then contact Vishal for clarifications

---

## Version History

**v1.0** (2025-11-05)
- Initial schema documentation
- Defined payload structure
- Added example payloads for residential and commercial properties
- Documented retry logic and security