const { getSupabase } = require('./_lib/supabase');
const { corsResponse, handleCors } = require('./_lib/cors');

exports.handler = async (event) => {
  const corsResult = handleCors(event);
  if (corsResult) return corsResult;

  const supabase = getSupabase();
  const method = event.httpMethod;
  const params = event.queryStringParameters || {};
  const id = params.id;

  // ── GET /api/notes  (list all, optional ?collection_id= filter) ──
  if (method === 'GET' && !id) {
    try {
      let query = supabase
        .from('learning_notes')
        .select('id, title, content, collection_id, created_at, updated_at, study_collections(id, name)')
        .order('created_at', { ascending: false });

      if (params.collection_id) {
        query = query.eq('collection_id', params.collection_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return corsResponse(200, { notes: data || [] });
    } catch (err) {
      return corsResponse(500, { error: 'Failed to fetch notes', details: err.message });
    }
  }

  // ── GET /api/notes/:id ──
  if (method === 'GET' && id) {
    if (isNaN(Number(id))) return corsResponse(400, { error: 'Invalid note ID' });
    try {
      const { data, error } = await supabase
        .from('learning_notes')
        .select('id, title, content, collection_id, created_at, updated_at, study_collections(id, name)')
        .eq('id', id)
        .single();

      if (error && error.code === 'PGRST116') return corsResponse(404, { error: 'Note not found' });
      if (error) throw error;
      return corsResponse(200, { note: data });
    } catch (err) {
      return corsResponse(500, { error: 'Failed to fetch note', details: err.message });
    }
  }

  // ── POST /api/notes  (create) ──
  if (method === 'POST') {
    let body;
    try { body = JSON.parse(event.body); } catch { return corsResponse(400, { error: 'Invalid JSON body' }); }

    const title   = (body.title   || '').trim();
    const content = (body.content || '').trim();
    const collection_id = body.collection_id || null;

    if (!title)              return corsResponse(400, { error: 'Title is required' });
    if (!content)            return corsResponse(400, { error: 'Content is required' });
    if (title.length > 200)  return corsResponse(400, { error: 'Title must be 200 characters or less' });
    if (content.length > 10000) return corsResponse(400, { error: 'Content must be 10,000 characters or less' });
    if (collection_id && isNaN(Number(collection_id))) return corsResponse(400, { error: 'Invalid collection_id' });

    try {
      const { data, error } = await supabase
        .from('learning_notes')
        .insert({ title, content, collection_id })
        .select('id, title, content, collection_id, created_at, updated_at, study_collections(id, name)')
        .single();

      if (error) throw error;
      return corsResponse(201, { note: data });
    } catch (err) {
      return corsResponse(500, { error: 'Failed to create note', details: err.message });
    }
  }

  // ── PUT /api/notes/:id  (update) ──
  if (method === 'PUT' && id) {
    if (isNaN(Number(id))) return corsResponse(400, { error: 'Invalid note ID' });

    let body;
    try { body = JSON.parse(event.body); } catch { return corsResponse(400, { error: 'Invalid JSON body' }); }

    const updates = {};

    if (body.title !== undefined) {
      const title = (body.title || '').trim();
      if (!title)             return corsResponse(400, { error: 'Title cannot be empty' });
      if (title.length > 200) return corsResponse(400, { error: 'Title must be 200 characters or less' });
      updates.title = title;
    }
    if (body.content !== undefined) {
      const content = (body.content || '').trim();
      if (!content)                return corsResponse(400, { error: 'Content cannot be empty' });
      if (content.length > 10000)  return corsResponse(400, { error: 'Content must be 10,000 characters or less' });
      updates.content = content;
    }
    if (body.collection_id !== undefined) {
      if (body.collection_id !== null && isNaN(Number(body.collection_id)))
        return corsResponse(400, { error: 'Invalid collection_id' });
      updates.collection_id = body.collection_id;
    }

    if (Object.keys(updates).length === 0) return corsResponse(400, { error: 'No fields to update' });
    updates.updated_at = new Date().toISOString();

    try {
      const { data, error } = await supabase
        .from('learning_notes')
        .update(updates)
        .eq('id', id)
        .select('id, title, content, collection_id, created_at, updated_at, study_collections(id, name)')
        .single();

      if (error && error.code === 'PGRST116') return corsResponse(404, { error: 'Note not found' });
      if (error) throw error;
      return corsResponse(200, { note: data });
    } catch (err) {
      return corsResponse(500, { error: 'Failed to update note', details: err.message });
    }
  }

  // ── DELETE /api/notes/:id ──
  if (method === 'DELETE' && id) {
    if (isNaN(Number(id))) return corsResponse(400, { error: 'Invalid note ID' });

    try {
      const { error } = await supabase
        .from('learning_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return corsResponse(200, { message: 'Note deleted successfully' });
    } catch (err) {
      return corsResponse(500, { error: 'Failed to delete note', details: err.message });
    }
  }

  return corsResponse(405, { error: 'Method not allowed' });
};
