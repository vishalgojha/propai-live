import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Generate SEO-friendly slug
function generateSlug(property) {
  let parts = [];
  
  // Add BHK
  if (property.bhk) {
    const bhkPart = property.bhk.toLowerCase().replace(/\s+/g, '');
    parts.push(bhkPart);
  }
  
  // Add building name or pocket
  if (property.building_name) {
    const buildingPart = property.building_name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
    parts.push(buildingPart);
  } else if (property.pocket) {
    const pocketPart = property.pocket
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    parts.push(pocketPart);
  }
  
  // Add location
  if (property.location) {
    const locationPart = property.location
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    parts.push(locationPart);
  }
  
  let slug = parts.join('-');
  
  // Ensure slug is not too long
  if (slug.length > 60) {
    slug = slug.substring(0, 60);
  }
  
  // Remove trailing hyphen if any
  slug = slug.replace(/-+$/, '');
  
  return slug;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const { propertyId, generateForAll } = await req.json();

    // Get all properties
    const properties = await base44.asServiceRole.entities.Property.list();
    
    let toUpdate = [];
    
    if (generateForAll) {
      // Generate slugs for ALL properties without slugs
      toUpdate = properties.filter(p => !p.slug);
    } else if (propertyId) {
      // Generate slug for specific property
      const prop = properties.find(p => p.id === propertyId);
      if (prop) toUpdate = [prop];
    } else {
      return Response.json({ error: 'Either propertyId or generateForAll must be provided' }, { status: 400 });
    }

    const results = [];
    const existingSlugs = new Set(properties.filter(p => p.slug).map(p => p.slug));

    for (const property of toUpdate) {
      try {
        let slug = generateSlug(property);
        
        // Check for duplicates and append ID if needed
        let finalSlug = slug;
        let counter = 1;
        while (existingSlugs.has(finalSlug)) {
          finalSlug = `${slug}-${counter}`;
          counter++;
        }
        
        // Update property with new slug
        await base44.asServiceRole.entities.Property.update(property.id, {
          slug: finalSlug
        });
        
        existingSlugs.add(finalSlug);
        
        results.push({
          id: property.id,
          custom_id: property.custom_id,
          slug: finalSlug,
          status: 'success'
        });
      } catch (error) {
        results.push({
          id: property.id,
          custom_id: property.custom_id,
          error: error.message,
          status: 'failed'
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    return Response.json({
      message: `Generated ${successCount} slugs (${failedCount} failed)`,
      totalProcessed: results.length,
      successCount,
      failedCount,
      results
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});