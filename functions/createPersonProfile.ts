import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHash } from 'node:crypto';

/**
 * Create Person entity for authenticated User
 * Computes canonical_person_id for identity resolution
 * Links Person to User via created_by
 * 
 * This is Step B of progressive onboarding
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Parse request body
    const { name, agency_name } = await req.json();

    if (!name || !name.trim()) {
      return Response.json({ 
        success: false, 
        error: 'Name is required' 
      }, { status: 400 });
    }

    // Check if Person already exists for this User
    const existingPeople = await base44.entities.Person.filter({
      created_by: user.email
    });

    if (existingPeople.length > 0) {
      return Response.json({ 
        success: true, 
        person: existingPeople[0],
        message: 'Person profile already exists'
      });
    }

    // Normalize name for canonical ID
    const normalized_name = name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const normalized_agency = agency_name?.trim().toLowerCase() || '';

    // Compute canonical_person_id
    // Format: hash(normalized_name + agency + optional_primary_phone)
    // Note: At onboarding, we don't have phone yet - it's optional
    const identity_string = `${normalized_name}::${normalized_agency}`;
    const canonical_person_id = createHash('sha256')
      .update(identity_string)
      .digest('hex')
      .substring(0, 16);

    // Create Person entity
    const person = await base44.entities.Person.create({
      canonical_person_id,
      name: name.trim(),
      normalized_name,
      raw_name_variants: [name.trim()],
      agency_name: agency_name?.trim() || null,
      person_type: 'broker',
      source: 'manual',
      ingestion_timestamp: new Date().toISOString(),
      status: 'Active',
      total_listings_count: 0,
      active_listings_count: 0,
      trust_score: 50 // Default starting trust score
    });

    // Optional: Link User email to Person if not already set
    if (user.email && !person.email) {
      await base44.entities.Person.update(person.id, {
        email: user.email
      });
    }

    return Response.json({ 
      success: true, 
      person,
      message: 'Person profile created successfully'
    });

  } catch (error) {
    console.error('Error creating Person profile:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
});