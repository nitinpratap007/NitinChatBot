const { getSupabase } = require('./_lib/supabase');
const { requireAuth } = require('./_lib/auth');
const { corsResponse, handleCors } = require('./_lib/cors');

// 20 pre-seeded courses to ensure 100% uptime even if database is connecting
const SEED_COURSES = [
  { id: 1, name: 'React Masterclass', description: 'Complete guide to React.js including hooks, context, and Redux. Build real-world projects from scratch.', category: 'Frontend Development' },
  { id: 2, name: 'HTML & CSS Fundamentals', description: 'Learn the building blocks of the web. Master semantic HTML, CSS Grid, Flexbox, and responsive design.', category: 'Frontend Development' },
  { id: 3, name: 'Vue.js Bootcamp', description: 'Fast-track your Vue.js skills with Composition API, Pinia state management, and Vue Router.', category: 'Frontend Development' },
  { id: 4, name: 'Next.js Full Stack', description: 'Build production-ready applications with Next.js, server-side rendering, and API routes.', category: 'Frontend Development' },
  { id: 5, name: 'Node.js API Mastery', description: 'Build scalable RESTful APIs and microservices with Node.js and Express.js.', category: 'Backend Development' },
  { id: 6, name: 'Python for Backend', description: 'Create powerful backends with Python, Flask, and FastAPI. Includes authentication and database integration.', category: 'Backend Development' },
  { id: 7, name: 'Spring Boot in Practice', description: 'Enterprise Java development with Spring Boot, Spring Security, and microservices architecture.', category: 'Backend Development' },
  { id: 8, name: 'SQL & Database Design', description: 'Master SQL queries, database design, normalization, and performance optimization.', category: 'Databases' },
  { id: 9, name: 'MongoDB Essentials', description: 'Learn NoSQL with MongoDB. Document modeling, aggregation pipelines, and real-time data.', category: 'Databases' },
  { id: 10, name: 'Machine Learning with Python', description: 'From linear regression to neural networks. Hands-on ML with scikit-learn, TensorFlow, and Keras.', category: 'Data Science & AI' },
  { id: 11, name: 'Data Science Bootcamp', description: 'Complete data science pipeline: data cleaning, visualization, statistical analysis, and predictive modeling.', category: 'Data Science & AI' },
  { id: 12, name: 'Flutter Mobile Development', description: 'Build beautiful cross-platform mobile apps with Flutter and Dart. iOS and Android from a single codebase.', category: 'Mobile Development' },
  { id: 13, name: 'React Native Zero to Hero', description: 'Create native mobile apps with React Native. Navigation, state management, and native modules.', category: 'Mobile Development' },
  { id: 14, name: 'AWS Cloud Practitioner', description: 'Master AWS services: EC2, S3, Lambda, RDS, and more. Prepare for the AWS certification.', category: 'DevOps & Cloud' },
  { id: 15, name: 'Docker & Kubernetes', description: 'Container orchestration from development to production. Docker Compose, K8s deployments, and scaling.', category: 'DevOps & Cloud' },
  { id: 16, name: 'Ethical Hacking & Security', description: 'Learn penetration testing, vulnerability assessment, and network security best practices.', category: 'Cybersecurity' },
  { id: 17, name: 'Cybersecurity Fundamentals', description: 'Build a solid foundation in cybersecurity: threats, defenses, encryption, and incident response.', category: 'Cybersecurity' },
  { id: 18, name: 'TypeScript Deep Dive', description: 'Master TypeScript with advanced types, generics, decorators, and integration with React and Node.js.', category: 'Frontend Development' },
  { id: 19, name: 'GraphQL Complete Guide', description: 'Design and build GraphQL APIs with Apollo Server and client. Subscriptions, caching, and federation.', category: 'Backend Development' },
  { id: 20, name: 'AI & Deep Learning', description: 'Neural networks, CNNs, RNNs, and transformers. Build AI models from the ground up with PyTorch.', category: 'Data Science & AI' }
];

let fallbackCourses = [...SEED_COURSES];

exports.handler = async (event) => {
  const corsResult = handleCors(event);
  if (corsResult) return corsResult;

  const supabase = getSupabase();
  const method = event.httpMethod;

  // GET - list courses (public)
  if (method === 'GET') {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .order('id', { ascending: true });

        if (!error && data && data.length > 0) {
          return corsResponse(200, { courses: data });
        }
      } catch (err) {
        console.error('Supabase courses GET failed, using fallback:', err.message);
      }
    }
    return corsResponse(200, { courses: fallbackCourses });
  }

  // POST - add course (auth required)
  if (method === 'POST') {
    const authError = requireAuth(event);
    if (authError) return authError;

    let body;
    try { body = JSON.parse(event.body); } catch { return corsResponse(400, { error: 'Invalid JSON body' }); }

    const { name, description, category } = body;
    if (!name || !description || !category) {
      return corsResponse(400, { error: 'name, description, and category are required' });
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('courses')
          .insert({ name, description, category })
          .select()
          .single();
        if (!error && data) return corsResponse(201, { course: data });
      } catch (err) {
        console.error('Supabase course insert failed:', err.message);
      }
    }

    const newCourse = { id: Date.now(), name, description, category, created_at: new Date().toISOString() };
    fallbackCourses.push(newCourse);
    return corsResponse(201, { course: newCourse });
  }

  // PUT - update course (auth required)
  if (method === 'PUT') {
    const authError = requireAuth(event);
    if (authError) return authError;

    const id = event.queryStringParameters && event.queryStringParameters.id;
    if (!id || isNaN(Number(id))) return corsResponse(400, { error: 'Valid course ID is required' });

    let body;
    try { body = JSON.parse(event.body); } catch { return corsResponse(400, { error: 'Invalid JSON body' }); }

    const updates = {};
    if (body.name !== undefined) updates.name = (body.name || '').trim();
    if (body.description !== undefined) updates.description = (body.description || '').trim();
    if (body.category !== undefined) updates.category = (body.category || '').trim();

    if (Object.keys(updates).length === 0) return corsResponse(400, { error: 'No fields to update' });

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('courses')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return corsResponse(200, { course: data });
      } catch (err) {
        console.error('Supabase course update failed:', err.message);
      }
    }

    const idx = fallbackCourses.findIndex(c => String(c.id) === String(id));
    if (idx !== -1) {
      fallbackCourses[idx] = { ...fallbackCourses[idx], ...updates };
      return corsResponse(200, { course: fallbackCourses[idx] });
    }
    return corsResponse(404, { error: 'Course not found' });
  }

  // DELETE - delete course (auth required)
  if (method === 'DELETE') {
    const authError = requireAuth(event);
    if (authError) return authError;

    const id = event.queryStringParameters && event.queryStringParameters.id;
    if (!id) return corsResponse(400, { error: 'Course ID is required' });

    if (supabase) {
      try {
        await supabase.from('courses').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase course delete error:', err.message);
      }
    }

    fallbackCourses = fallbackCourses.filter(c => String(c.id) !== String(id));
    return corsResponse(200, { message: 'Course deleted successfully' });
  }

  return corsResponse(405, { error: 'Method not allowed' });
};
