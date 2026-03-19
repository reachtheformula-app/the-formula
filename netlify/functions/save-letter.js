import { neon } from '@neondatabase/serverless';

export default async (request, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  try {
    const body = await request.json();
    const { userId, content, theme, dayName, childNames } = body;

    if (!userId || !content) {
      return new Response(JSON.stringify({ error: 'Missing userId or content' }), { status: 400, headers });
    }

    // Generate a short random ID for the share link
    const id = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

    await sql`
      INSERT INTO letters (id, user_id, content, theme, day_name, child_names)
      VALUES (${id}, ${userId}, ${content}, ${theme || ''}, ${dayName || ''}, ${childNames || ''})
    `;

    const shareUrl = `${new URL(request.url).origin}/.netlify/functions/view-letter?id=${id}`;

    return new Response(JSON.stringify({ id, shareUrl }), { status: 201, headers });
  } catch (error) {
    console.error('save-letter error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
};
