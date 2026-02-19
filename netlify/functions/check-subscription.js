import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL);

export async function handler(event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const userId = event.queryStringParameters?.userId;
  if (!userId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing userId' }) };
  }

  try {
    const rows = await sql`
      SELECT tier, status, is_agency, current_period_end
      FROM subscriptions
      WHERE user_id = ${userId}
    `;

    if (rows.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ tier: 'none', status: 'inactive', isAgency: false }),
      };
    }

    const sub = rows[0];
    
    // Check if subscription has expired
    let tier = sub.tier;
    let status = sub.status;
    
    if (sub.current_period_end && new Date(sub.current_period_end) < new Date() && !sub.is_agency) {
      // Subscription period has passed and not agency — treat as inactive
      // (Stripe webhooks should handle this, but this is a safety check)
      if (status === 'active' && tier !== 'agency_gold') {
        tier = 'none';
        status = 'inactive';
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        tier,
        status,
        isAgency: sub.is_agency || false,
        periodEnd: sub.current_period_end,
      }),
    };
  } catch (error) {
    console.error('Check subscription error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
}
