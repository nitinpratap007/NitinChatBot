const { getSupabase } = require('./_lib/supabase');
const { corsResponse, handleCors } = require('./_lib/cors');

// Seed notes for initial empty state
let memoryNotes = [
  {
    id: 1,
    title: 'React Hooks Overview',
    content: 'Mastered useState, useEffect, useCallback, and useMemo for performance optimization. Always obey hooks rules!',
    collection_id: 1,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    study_collections: { id: 1, name: 'Web Development' }
  },
  {
    id: 2,
    title: 'Database Normalization Notes',
    content: '1NF: Atomic values. 2NF: No partial dependency. 3NF: No transitive dependency. Essential for robust schema design.',
    collection_id: 2,
    created_at: new Date(Date.now() - 43200000).toISOString(),
    updated_at: new Date(Date.now() - 43200000).toISOString(),
    study_collections: { id: 2, name: 'Databases & SQL' }
  }
];

exports.handler = async (event) => {
  const corsResult = handleCors(event);
  if (corsResult) return corsResult;

  const supabase = getSupabase();
  const method = event.httpMethod;
  const params = event.queryStringParameters || {};
  const id = params.id;

  // ── GET /api/notes (list all) ──
  if (method === 'GET' && !id) {
    if (supabase) {
      try {
        let query = supabase
          .from('learning_notes')
          .select('id, title, content, collection_id, created_at, updated_at, study_collections(id, name)')
          .order('created_at', { ascending: false });

        if (params.collection_id) {
          query = query.eq('collection_id', params.collection_id);
        }

        const { data, error } = await query;
        if (!error && data) {
          return corsResponse(200, { notes: data });
        }
      } catch (err) {
        console.error('Supabase notes GET failed, using memory store:', err.message);
      }
    }

    let list = [...memoryNotes];
    if (params.collection_id) {
      list = list.filter(n => String(n.collection_id) === String(params.collection_id));
    }
    return corsResponse(200, { notes: list });
  }

  // ── GET /api/notes/:id ──
  if (method === 'GET' && id) {
    if (isNaN(Number(id))) return corsResponse(400, { error: 'Invalid note ID' });

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('learning_notes')
          .select('id, title, content, collection_id, created_at, updated_at, study_collections(id, name)')
          .eq('id', id)
          .single();

        if (!error && data) return corsResponse(200, { note: data });
      } catch (err) {
        console.error('Supabase note get error:', err.message);
      }
    }

    const note = memoryNotes.find(n => String(n.id) === String(id));
    if (note) return corsResponse(200, { note });
    return corsResponse(404, { error: 'Note not found' });
  }

  // ── POST /api/notes (create) ──
  if (method === 'POST') {
    let body;
    try { body = JSON.parse(event.body); } catch { return corsResponse(400, { error: 'Invalid JSON body' }); }

    const title   = (body.title   || '').trim();
    const content = (body.content || '').trim();
    const collection_id = body.collection_id || null;

    if (!title)   return corsResponse(400, { error: 'Title is required' });
    if (!content) return corsResponse(400, { error: 'Content is required' });
    if (title.length > 200) return corsResponse(400, { error: 'Title must be 200 characters or less' });
    if (content.length > 10000) return corsResponse(400, { error: 'Content must be 10,000 characters or less' });

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('learning_notes')
          .insert({ title, content, collection_id })
          .select('id, title, content, collection_id, created_at, updated_at, study_collections(id, name)')
          .single();

        if (!error && data) return corsResponse(201, { note: data });
      } catch (err) {
        console.error('Supabase note create error:', err.message);
      }
    }

    const newNote = {
      id: Date.now(),
      title,
      content,
      collection_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      study_collections: collection_id ? { id: collection_id, name: 'Collection ' + collection_id } : null
    };
    memoryNotes.unshift(newNote);
    return corsResponse(201, { note: newNote });
  }

  // ── PUT /api/notes/:id (update) ──
  if (method === 'PUT' && id) {
    if (isNaN(Number(id))) return corsResponse(400, { error: 'Invalid note ID' });

    let body;
    try { body = JSON.parse(event.body); } catch { return corsResponse(400, { error: 'Invalid JSON body' }); }

    const updates = {};
    if (body.title !== undefined) {
      const title = (body.title || '').trim();
      if (!title) return corsResponse(400, { error: 'Title cannot be empty' });
      updates.title = title;
    }
    if (body.content !== undefined) {
      const content = (body.content || '').trim();
      if (!content) return corsResponse(400, { error: 'Content cannot be empty' });
      updates.content = content;
    }
    if (body.collection_id !== undefined) {
      updates.collection_id = body.collection_id;
    }

    if (Object.keys(updates).length === 0) return corsResponse(400, { error: 'No fields to update' });
    updates.updated_at = new Date().toISOString();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('learning_notes')
          .update(updates)
          .eq('id', id)
          .select('id, title, content, collection_id, created_at, updated_at, study_collections(id, name)')
          .single();

        if (!error && data) return corsResponse(200, { note: data });
      } catch (err) {
        console.error('Supabase note update error:', err.message);
      }
    }

    const idx = memoryNotes.findIndex(n => String(n.id) === String(id));
    if (idx !== -1) {
      memoryNotes[idx] = { ...memoryNotes[idx], ...updates };
      return corsResponse(200, { note: memoryNotes[idx] });
    }
    return corsResponse(404, { error: 'Note not found' });
  }

  // ── DELETE /api/notes/:id ──
  if (method === 'DELETE' && id) {
    if (isNaN(Number(id))) return corsResponse(400, { error: 'Invalid note ID' });

    if (supabase) {
      try {
        await supabase.from('learning_notes').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase note delete error:', err.message);
      }
    }

    memoryNotes = memoryNotes.filter(n => String(n.id) !== String(id));
    return corsResponse(200, { message: 'Note deleted successfully' });
  }

  return corsResponse(405, { error: 'Method not allowed' });
};
