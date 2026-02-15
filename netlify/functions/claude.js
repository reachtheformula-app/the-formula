// Netlify Function to proxy Anthropic API calls
// Now with system prompt injection for curriculum generation

import { neon } from '@neondatabase/serverless';

export default async (request, context) => {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const apiKey = Netlify.env.get('ANTHROPIC_API_KEY');
  
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    const body = await request.json();
    
    // If this is a curriculum generation request, inject the system prompt
    if (body.useSystemPrompt) {
      const dbUrl = Netlify.env.get('NEON_DATABASE_URL');
      if (dbUrl) {
        const sql = neon(dbUrl);
        const rows = await sql`SELECT prompt FROM system_prompts WHERE name = 'curriculum_generator' LIMIT 1`;
        if (rows.length > 0) {
          body.system = rows[0].prompt;
        }
      }
      // Remove custom flag before forwarding to Anthropic
      delete body.useSystemPrompt;
    }
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};
