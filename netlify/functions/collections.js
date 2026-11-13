const { getSupabase } = require('./_lib/supabase');
const { corsResponse, handleCors } = require('./_lib/cors');

let memoryCollections = [
  { id: 1, name: 'Web Development', description: 'Core web technologies: React, JavaScript, HTML, and CSS.', created_at: new Date(Date.now() - 86400000).toISOString(), note_count: 1 },
  { id: 2, name: 'Databases & SQL', description: 'Relational & NoSQL database architecture and query optimization.', created_at: new Date(Date.now() - 43200000).toISOString(), note_count: 1 },
  { id: 3, name: 'AI & Machine Learning', description: 'Concepts, prompts, neural networks, and model architectures.', created_at: new Date(Date.now() - 21600000).toISOString(), note_count: 0 }
];

exports.handler = async (event) => {
  const corsResult = handleCors(event);
  if (corsResult) return corsResult;

  const supabase = getSupabase();
  const method = event.httpMethod;
  const params = event.queryStringParameters || {};
  const id = params.id;

  // ── GET /api/collections (list all) ──
  if (method === 'GET' && !id) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('study_collections')
          .select('id, name, description, created_at, updated_at, learning_notes(count)')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const collections = data.map(c => ({
            ...c,
            note_count: c.learning_notes?.[0]?.count ?? 0,
            learning_notes: undefined,
          }));
          return corsResponse(200, { collections });
        }
      } catch (err) {
        console.error('Supabase collections GET error, using fallback:', err.message);
      }
    }
    return corsResponse(200, { collections: memoryCollections });
  }

  // ── GET /api/collections/:id ──
  if (method === 'GET' && id) {
    if (isNaN(Number(id))) return corsResponse(400, { error: 'Invalid collection ID' });

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('study_collections')
          .select('id, name, description, created_at, updated_at')
          .eq('id', id)
          .single();

        if (!error && data) return corsResponse(200, { collection: data });
      } catch (err) {
        console.error('Supabase collection get error:', err.message);
      }
    }

    const col = memoryCollections.find(c => String(c.id) === String(id));
    if (col) return corsResponse(200, { collection: col });
    return corsResponse(404, { error: 'Collection not found' });
  }

  // ── POST /api/collections (create) ──
  if (method === 'POST') {
    let body;
    try { body = JSON.parse(event.body); } catch { return corsResponse(400, { error: 'Invalid JSON body' }); }

    const name = (body.name || '').trim();
    const description = (body.description || '').trim();

    if (!name) return corsResponse(400, { error: 'Name is required' });
    if (name.length > 100) return corsResponse(400, { error: 'Name must be 100 characters or less' });
    if (description.length > 500) return corsResponse(400, { error: 'Description must be 500 characters or less' });

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('study_collections')
          .insert({ name, description })
          .select('id, name, description, created_at, updated_at')
          .single();

        if (!error && data) return corsResponse(201, { collection: { ...data, note_count: 0 } });
      } catch (err) {
        console.error('Supabase collection insert error:', err.message);
      }
    }

    const newCol = {
      id: Date.now(),
      name,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      note_count: 0
    };
    memoryCollections.unshift(newCol);
    return corsResponse(201, { collection: newCol });
  }

  // ── PUT /api/collections/:id (update) ──
  if (method === 'PUT' && id) {
    if (isNaN(Number(id))) return corsResponse(400, { error: 'Invalid collection ID' });

    let body;
    try { body = JSON.parse(event.body); } catch { return corsResponse(400, { error: 'Invalid JSON body' }); }

    const updates = {};
    if (body.name !== undefined) {
      const name = (body.name || '').trim();
      if (!name) return corsResponse(400, { error: 'Name cannot be empty' });
      updates.name = name;
    }
    if (body.description !== undefined) {
      updates.description = (body.description || '').trim();
    }

    if (Object.keys(updates).length === 0) return corsResponse(400, { error: 'No fields to update' });
    updates.updated_at = new Date().toISOString();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('study_collections')
          .update(updates)
          .eq('id', id)
          .select('id, name, description, created_at, updated_at')
          .single();

        if (!error && data) return corsResponse(200, { collection: data });
      } catch (err) {
        console.error('Supabase collection update error:', err.message);
      }
    }

    const idx = memoryCollections.findIndex(c => String(c.id) === String(id));
    if (idx !== -1) {
      memoryCollections[idx] = { ...memoryCollections[idx], ...updates };
      return corsResponse(200, { collection: memoryCollections[idx] });
    }
    return corsResponse(404, { error: 'Collection not found' });
  }

  // ── DELETE /api/collections/:id ──
  if (method === 'DELETE' && id) {
    if (isNaN(Number(id))) return corsResponse(400, { error: 'Invalid collection ID' });

    if (supabase) {
      try {
        await supabase.from('study_collections').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase collection delete error:', err.message);
      }
    }

    memoryCollections = memoryCollections.filter(c => String(c.id) !== String(id));
    return corsResponse(200, { message: 'Collection deleted successfully.' });
  }

  return corsResponse(405, { error: 'Method not allowed' });
};
