import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL);

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const { type, userId, id } = event.queryStringParameters || {};

  if (!userId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing userId' }) };
  }

  if (!type || !['children', 'milestones', 'logs', 'settings'].includes(type)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing or invalid type (children, milestones, logs, settings)' }) };
  }

  try {
    // GET — fetch all records for user
    if (event.httpMethod === 'GET') {
      let rows;
      if (type === 'children') {
        rows = await sql`SELECT * FROM children WHERE user_id = ${userId} ORDER BY created_at ASC`;
      } else if (type === 'milestones') {
        rows = await sql`SELECT * FROM milestones WHERE user_id = ${userId} ORDER BY date DESC`;
      } else if (type === 'settings') {
        rows = await sql`SELECT * FROM user_settings WHERE user_id = ${userId}`;
        return { statusCode: 200, headers, body: JSON.stringify(rows[0] || { selected_week_id: null, language: 'none', custom_language_name: '' }) };
      } else {
        rows = await sql`SELECT * FROM activity_logs WHERE user_id = ${userId} ORDER BY timestamp DESC`;
      }
      return { statusCode: 200, headers, body: JSON.stringify(rows) };
    }

    // POST — create new record
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);

      if (type === 'children') {
        const rows = await sql`
          INSERT INTO children (user_id, name, age, birthday, allergies, parent_name, parent_email, parent_phone, notes)
          VALUES (${userId}, ${body.name}, ${body.age || ''}, ${body.birthday || ''}, ${body.allergies || ''}, ${body.parentName || ''}, ${body.parentEmail || ''}, ${body.parentPhone || ''}, ${body.notes || ''})
          RETURNING *`;
        return { statusCode: 201, headers, body: JSON.stringify(rows[0]) };
      }

      if (type === 'milestones') {
        const rows = await sql`
          INSERT INTO milestones (user_id, child_id, title, notes, date)
          VALUES (${userId}, ${body.childId || null}, ${body.title}, ${body.notes || ''}, ${body.date || new Date().toISOString()})
          RETURNING *`;
        return { statusCode: 201, headers, body: JSON.stringify(rows[0]) };
      }

      if (type === 'logs') {
        const photos = body.photos ? JSON.stringify(body.photos) : '[]';
        const rows = await sql`
          INSERT INTO activity_logs (user_id, child_id, activity, notes, photos, timestamp)
          VALUES (${userId}, ${body.childId || ''}, ${body.activity}, ${body.notes || ''}, ${photos}::jsonb, ${body.timestamp || new Date().toISOString()})
          RETURNING *`;
        return { statusCode: 201, headers, body: JSON.stringify(rows[0]) };
      }

      if (type === 'settings') {
        await sql`
          INSERT INTO user_settings (user_id, selected_week_id, language, custom_language_name, updated_at)
          VALUES (${userId}, ${body.selectedWeekId || null}, ${body.language || 'none'}, ${body.customLanguageName || ''}, NOW())
          ON CONFLICT (user_id) DO UPDATE SET
            selected_week_id = ${body.selectedWeekId || null},
            language = ${body.language || 'none'},
            custom_language_name = ${body.customLanguageName || ''},
            updated_at = NOW()`;
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }
    }

    // PUT — update record
    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body);
      if (!body.id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id' }) };
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
      } else {
        const photos = body.photos ? JSON.stringify(body.photos) : '[]';
        await sql`
          UPDATE activity_logs SET activity = ${body.activity}, child_id = ${body.childId || ''}, 
          notes = ${body.notes || ''}, photos = ${photos}::jsonb
          WHERE id = ${body.id} AND user_id = ${userId}`;
      }
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // DELETE — remove record
    if (event.httpMethod === 'DELETE') {
      if (!id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id' }) };
      }

      if (type === 'children') {
        await sql`DELETE FROM children WHERE id = ${id} AND user_id = ${userId}`;
      } else if (type === 'milestones') {
        await sql`DELETE FROM milestones WHERE id = ${id} AND user_id = ${userId}`;
      } else {
        await sql`DELETE FROM activity_logs WHERE id = ${id} AND user_id = ${userId}`;
      }
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (error) {
    console.error(`user-data error (${type}):`, error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
}
