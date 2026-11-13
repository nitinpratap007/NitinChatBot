const { getSupabase } = require('./_lib/supabase');
const { corsResponse, handleCors } = require('./_lib/cors');

exports.handler = async (event) => {
  const corsResult = handleCors(event);
  if (corsResult) return corsResult;

  const supabase = getSupabase();
  const method = event.httpMethod;
  const params = event.queryStringParameters || {};
  const id = params.id;

  // ── GET /api/collections  (list all with note count) ──
  if (method === 'GET' && !id) {
    try {
      const { data, error } = await supabase
        .from('study_collections')
        .select('id, name, description, created_at, updated_at, learning_notes(count)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Flatten note count
      const collections = (data || []).map(c => ({
        ...c,
        note_count: c.learning_notes?.[0]?.count ?? 0,
        learning_notes: undefined,
      }));

      return corsResponse(200, { collections });
    } catch (err) {
      return corsResponse(500, { error: 'Failed to fetch collections', details: err.message });
    }
  }

  // ── GET /api/collections/:id ──
  if (method === 'GET' && id) {
    if (isNaN(Number(id))) return corsResponse(400, { error: 'Invalid collection ID' });
    try {
      const { data, error } = await supabase
        .from('study_collections')
        .select('id, name, description, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error && error.code === 'PGRST116') return corsResponse(404, { error: 'Collection not found' });
      if (error) throw error;
      return corsResponse(200, { collection: data });
    } catch (err) {
      return corsResponse(500, { error: 'Failed to fetch collection', details: err.message });
    }
  }

  // ── POST /api/collections  (create) ──
  if (method === 'POST') {
    let body;
    try { body = JSON.parse(event.body); } catch { return corsResponse(400, { error: 'Invalid JSON body' }); }

    const name        = (body.name        || '').trim();
    const description = (body.description || '').trim();

    if (!name)             return corsResponse(400, { error: 'Name is required' });
    if (name.length > 100) return corsResponse(400, { error: 'Name must be 100 characters or less' });
    if (description.length > 500) return corsResponse(400, { error: 'Description must be 500 characters or less' });

    try {
      const { data, error } = await supabase
        .from('study_collections')
        .insert({ name, description })
        .select('id, name, description, created_at, updated_at')
        .single();

      if (error) throw error;
      return corsResponse(201, { collection: data });
    } catch (err) {
      return corsResponse(500, { error: 'Failed to create collection', details: err.message });
    }
  }

  // ── PUT /api/collections/:id  (update) ──
  if (method === 'PUT' && id) {
    if (isNaN(Number(id))) return corsResponse(400, { error: 'Invalid collection ID' });

    let body;
    try { body = JSON.parse(event.body); } catch { return corsResponse(400, { error: 'Invalid JSON body' }); }

    const updates = {};

    if (body.name !== undefined) {
      const name = (body.name || '').trim();
      if (!name)             return corsResponse(400, { error: 'Name cannot be empty' });
      if (name.length > 100) return corsResponse(400, { error: 'Name must be 100 characters or less' });
      updates.name = name;
    }
    if (body.description !== undefined) {
      const description = (body.description || '').trim();
      if (description.length > 500) return corsResponse(400, { error: 'Description must be 500 characters or less' });
      updates.description = description;
    }

    if (Object.keys(updates).length === 0) return corsResponse(400, { error: 'No fields to update' });
    updates.updated_at = new Date().toISOString();

    try {
      const { data, error } = await supabase
        .from('study_collections')
        .update(updates)
        .eq('id', id)
        .select('id, name, description, created_at, updated_at')
        .single();

      if (error && error.code === 'PGRST116') return corsResponse(404, { error: 'Collection not found' });
      if (error) throw error;
      return corsResponse(200, { collection: data });
    } catch (err) {
      return corsResponse(500, { error: 'Failed to update collection', details: err.message });
    }
  }

  // ── DELETE /api/collections/:id ──
  if (method === 'DELETE' && id) {
    if (isNaN(Number(id))) return corsResponse(400, { error: 'Invalid collection ID' });

    try {
      // Notes with this collection_id become NULL (ON DELETE SET NULL — handled in DB schema)
      const { error } = await supabase
        .from('study_collections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return corsResponse(200, { message: 'Collection deleted successfully. Notes have been unassigned.' });
    } catch (err) {
      return corsResponse(500, { error: 'Failed to delete collection', details: err.message });
    }
  }

  return corsResponse(405, { error: 'Method not allowed' });
};
