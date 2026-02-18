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

  try {
    // GET — Load weeks for a user, or all weeks for admin
    if (request.method === 'GET') {
      const userId = url.searchParams.get('userId');
      const admin = url.searchParams.get('admin');

      if (admin === 'true') {
        // Admin view — return ALL user-created weeks
        const rows = await sql`
          SELECT * FROM user_weeks ORDER BY created_at DESC
        `;
        return new Response(JSON.stringify(rows), { status: 200, headers });
      }

      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId required' }), { status: 400, headers });
      }

      const rows = await sql`
        SELECT * FROM user_weeks WHERE user_id = ${userId} ORDER BY created_at DESC
      `;
      return new Response(JSON.stringify(rows), { status: 200, headers });
    }

    // POST — Save a new custom week
    if (request.method === 'POST') {
      const body = await request.json();
      const { userId, userEmail, userName, theme, season, focus, ageGroup, teachingPhilosophy, days } = body;

      if (!userId || !theme || !days) {
        return new Response(JSON.stringify({ error: 'userId, theme, and days required' }), { status: 400, headers });
      }

      const row = await sql`
        INSERT INTO user_weeks (user_id, user_email, user_name, theme, season, focus, age_group, teaching_philosophy, days)
        VALUES (${userId}, ${userEmail || null}, ${userName || null}, ${theme}, ${season || 'Any'}, ${focus || 'General'}, ${ageGroup || null}, ${teachingPhilosophy || null}, ${JSON.stringify(days)})
        RETURNING *
      `;
      return new Response(JSON.stringify(row[0]), { status: 201, headers });
    }

    // PUT — Update an existing custom week
    if (request.method === 'PUT') {
      const body = await request.json();
      const { id, userId, theme, season, focus, teachingPhilosophy, days } = body;

      if (!id || !userId) {
        return new Response(JSON.stringify({ error: 'id and userId required' }), { status: 400, headers });
      }

      const row = await sql`
        UPDATE user_weeks 
        SET theme = ${theme}, season = ${season || 'Any'}, focus = ${focus || 'General'}, 
            teaching_philosophy = ${teachingPhilosophy || null}, days = ${JSON.stringify(days)},
            updated_at = NOW()
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING *
      `;
      return new Response(JSON.stringify(row[0] || { success: true }), { status: 200, headers });
    }

    // DELETE — Remove a custom week
    if (request.method === 'DELETE') {
      const weekId = url.searchParams.get('id');
      const userId = url.searchParams.get('userId');

      if (!weekId) {
        return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers });
      }

      // Users can only delete their own weeks
      if (userId) {
        await sql`DELETE FROM user_weeks WHERE id = ${weekId} AND user_id = ${userId}`;
      } else {
        // Admin delete (no userId filter)
        await sql`DELETE FROM user_weeks WHERE id = ${weekId}`;
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  } catch (error) {
    console.error('User weeks error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
};
