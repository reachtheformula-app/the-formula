import { neon } from '@neondatabase/serverless';

export default async (request, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  const dbUrl = Netlify.env.get('NEON_DATABASE_URL');
  if (!dbUrl) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers });
  }

  const sql = neon(dbUrl);
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400, headers });
  }

  if (!type || !['children', 'milestones', 'logs', 'settings'].includes(type)) {
    return new Response(JSON.stringify({ error: 'Missing or invalid type' }), { status: 400, headers });
  }

  try {
    // GET
    if (request.method === 'GET') {
      let rows;
      if (type === 'children') {
        rows = await sql`SELECT * FROM children WHERE user_id = ${userId} ORDER BY created_at ASC`;
      } else if (type === 'milestones') {
        rows = await sql`SELECT * FROM milestones WHERE user_id = ${userId} ORDER BY date DESC`;
      } else if (type === 'settings') {
        rows = await sql`SELECT * FROM user_settings WHERE user_id = ${userId}`;
        return new Response(JSON.stringify(rows[0] || {
          selected_week_id: null,
          language: 'none',
          custom_language_name: '',
          onboarding_complete: false,
          goals: []
        }), { status: 200, headers });
      } else {
        rows = await sql`SELECT * FROM activity_logs WHERE user_id = ${userId} ORDER BY timestamp DESC`;
      }
      return new Response(JSON.stringify(rows), { status: 200, headers });
    }

    // POST
    if (request.method === 'POST') {
      const body = await request.json();

      if (type === 'children') {
        const rows = await sql`
          INSERT INTO children (user_id, name, age, birthday, allergies, parent_name, parent_email, parent_phone, notes)
          VALUES (${userId}, ${body.name}, ${body.age || ''}, ${body.birthday || ''}, ${body.allergies || ''}, ${body.parentName || ''}, ${body.parentEmail || ''}, ${body.parentPhone || ''}, ${body.notes || ''})
          RETURNING *`;
        return new Response(JSON.stringify(rows[0]), { status: 201, headers });
      }

      if (type === 'milestones') {
        const rows = await sql`
          INSERT INTO milestones (user_id, child_id, title, notes, date)
          VALUES (${userId}, ${body.childId || null}, ${body.title}, ${body.notes || ''}, ${body.date || new Date().toISOString()})
          RETURNING *`;
        return new Response(JSON.stringify(rows[0]), { status: 201, headers });
      }

      if (type === 'logs') {
        const photos = body.photos ? JSON.stringify(body.photos) : '[]';
        const rows = await sql`
          INSERT INTO activity_logs (user_id, child_id, activity, notes, photos, timestamp)
          VALUES (${userId}, ${body.childId || ''}, ${body.activity}, ${body.notes || ''}, ${photos}::jsonb, ${body.timestamp || new Date().toISOString()})
          RETURNING *`;
        return new Response(JSON.stringify(rows[0]), { status: 201, headers });
      }

      if (type === 'settings') {
        const goalsArray = body.goals || [];
        await sql`
          INSERT INTO user_settings (user_id, selected_week_id, language, custom_language_name, onboarding_complete, goals, updated_at)
          VALUES (${userId}, ${body.selectedWeekId || null}, ${body.language || 'none'}, ${body.customLanguageName || ''}, ${body.onboardingComplete || false}, ${goalsArray}, NOW())
          ON CONFLICT (user_id) DO UPDATE SET
            selected_week_id = COALESCE(${body.selectedWeekId}, user_settings.selected_week_id),
            language = COALESCE(${body.language}, user_settings.language),
            custom_language_name = COALESCE(${body.customLanguageName}, user_settings.custom_language_name),
            onboarding_complete = COALESCE(${body.onboardingComplete}, user_settings.onboarding_complete),
            goals = CASE WHEN ${body.goals !== undefined} THEN ${goalsArray} ELSE user_settings.goals END,
            updated_at = NOW()`;
        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
      }
    }

    // PUT
    if (request.method === 'PUT') {
      const body = await request.json();
      if (!body.id) {
        return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers });
      }

      if (type === 'children') {
        await sql`
          UPDATE children SET name = ${body.name}, age = ${body.age || ''}, birthday = ${body.birthday || ''},
          allergies = ${body.allergies || ''}, parent_name = ${body.parentName || ''}, parent_email = ${body.parentEmail || ''},
          parent_phone = ${body.parentPhone || ''}, notes = ${body.notes || ''}, updated_at = NOW()
          WHERE id = ${body.id} AND user_id = ${userId}`;
      } else if (type === 'milestones') {
        await sql`
          UPDATE milestones SET title = ${body.title}, child_id = ${body.childId || null}, notes = ${body.notes || ''}
          WHERE id = ${body.id} AND user_id = ${userId}`;
      } else if (type === 'logs') {
        const photos = body.photos ? JSON.stringify(body.photos) : '[]';
        await sql`
          UPDATE activity_logs SET activity = ${body.activity}, child_id = ${body.childId || ''},
          notes = ${body.notes || ''}, photos = ${photos}::jsonb
          WHERE id = ${body.id} AND user_id = ${userId}`;
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    // DELETE
    if (request.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers });
      }

      if (type === 'children') {
        await sql`DELETE FROM children WHERE id = ${id} AND user_id = ${userId}`;
      } else if (type === 'milestones') {
        await sql`DELETE FROM milestones WHERE id = ${id} AND user_id = ${userId}`;
      } else if (type === 'logs') {
        await sql`DELETE FROM activity_logs WHERE id = ${id} AND user_id = ${userId}`;
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  } catch (error) {
    console.error(`user-data error (${type}):`, error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
};
