const { getSupabase } = require('./_lib/supabase');
const { requireAuth } = require('./_lib/auth');
const { corsResponse, handleCors } = require('./_lib/cors');

exports.handler = async (event) => {
  const corsResult = handleCors(event);
  if (corsResult) return corsResult;

  const supabase = getSupabase();
  const method = event.httpMethod;

  // GET - list courses (public)
  if (method === 'GET') {
    try {
      const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      return corsResponse(200, { courses: courses || [] });
    } catch (err) {
      return corsResponse(500, { error: 'Failed to fetch courses', details: err.message });
    }
  }

  // POST - add course (auth required)
  if (method === 'POST') {
    const authError = requireAuth(event);
    if (authError) return authError;

    let body;
    try {
      body = JSON.parse(event.body);
    } catch {
      return corsResponse(400, { error: 'Invalid JSON body' });
    }

    const { name, description, category } = body;
    if (!name || !description || !category) {
      return corsResponse(400, { error: 'name, description, and category are required' });
    }

    try {
      const { data, error } = await supabase
        .from('courses')
        .insert({ name, description, category })
        .select()
        .single();

      if (error) throw error;
      return corsResponse(201, { course: data });
    } catch (err) {
      return corsResponse(500, { error: 'Failed to add course', details: err.message });
    }
  }

  // PUT - update course (auth required)
  if (method === 'PUT') {
    const authError = requireAuth(event);
    if (authError) return authError;

    const id = event.queryStringParameters && event.queryStringParameters.id;
    if (!id || isNaN(Number(id))) {
      return corsResponse(400, { error: 'Valid course ID is required' });
    }

    let body;
    try {
      body = JSON.parse(event.body);
    } catch {
      return corsResponse(400, { error: 'Invalid JSON body' });
    }

    const updates = {};
    if (body.name !== undefined) {
      const name = (body.name || '').trim();
      if (!name) return corsResponse(400, { error: 'Name cannot be empty' });
      updates.name = name;
    }
    if (body.description !== undefined) {
      const description = (body.description || '').trim();
      if (!description) return corsResponse(400, { error: 'Description cannot be empty' });
      updates.description = description;
    }
    if (body.category !== undefined) {
      const category = (body.category || '').trim();
      if (!category) return corsResponse(400, { error: 'Category cannot be empty' });
      updates.category = category;
    }

    if (Object.keys(updates).length === 0) {
      return corsResponse(400, { error: 'No fields to update' });
    }

    try {
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error && error.code === 'PGRST116') return corsResponse(404, { error: 'Course not found' });
      if (error) throw error;
      return corsResponse(200, { course: data });
    } catch (err) {
      return corsResponse(500, { error: 'Failed to update course', details: err.message });
    }
  }

  // DELETE - delete course (auth required)
  if (method === 'DELETE') {
    const authError = requireAuth(event);
    if (authError) return authError;

    const id = event.queryStringParameters && event.queryStringParameters.id;
    if (!id) {
      return corsResponse(400, { error: 'Course ID is required' });
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return corsResponse(200, { message: 'Course deleted successfully' });
    } catch (err) {
      return corsResponse(500, { error: 'Failed to delete course', details: err.message });
    }
  }

  return corsResponse(405, { error: 'Method not allowed' });
};
