import { neon } from '@neondatabase/serverless';

export default async (request, context) => {
  const dbUrl = Netlify.env.get('NEON_DATABASE_URL');
  if (!dbUrl) {
    return new Response('Server error', { status: 500 });
  }

  const sql = neon(dbUrl);
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response('Letter not found', { status: 404, headers: { 'Content-Type': 'text/html' } });
  }

  try {
    const rows = await sql`SELECT * FROM letters WHERE id = ${id}`;
    const letter = rows[0];

    if (!letter) {
      return new Response(notFoundPage(), { status: 404, headers: { 'Content-Type': 'text/html' } });
    }

    const html = letterPage(letter);
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('view-letter error:', error);
    return new Response('Server error', { status: 500 });
  }
};

function letterPage(letter) {
  const date = new Date(letter.created_at).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  // Convert markdown-style bold to HTML and newlines to paragraphs
  const formatted = letter.content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Daily Letter — The Formula</title>
  <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Quicksand', sans-serif;
      background-color: #ecddce;
      color: #774722;
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
      padding-top: 20px;
    }
    .logo {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background-color: #be8a68;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }
    .logo span {
      font-size: 28px;
      font-weight: 700;
      color: white;
    }
    .brand {
      font-size: 20px;
      font-weight: 700;
      color: #774722;
    }
    .meta {
      font-size: 13px;
      color: #926f4a;
      margin-top: 4px;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      border: 1px solid #d0bfa3;
    }
    .card p {
      font-size: 15px;
      line-height: 1.7;
      margin-bottom: 16px;
      color: #774722;
    }
    .card p:last-child {
      margin-bottom: 0;
    }
    .card strong {
      color: #926f4a;
    }
    .footer {
      text-align: center;
      margin-top: 24px;
      padding-bottom: 20px;
      font-size: 12px;
      color: #926f4a;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo"><span>F</span></div>
      <div class="brand">The Formula</div>
      <div class="meta">${date}${letter.theme ? ` · ${letter.theme}` : ''}${letter.day_name ? ` · ${letter.day_name}` : ''}</div>
    </div>
    <div class="card">
      ${formatted}
    </div>
    <div class="footer">
      Sent with love from The Formula<br>
      Prepared Nannies. Informed Parents. Better Care.
    </div>
  </div>
</body>
</html>`;
}

function notFoundPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Letter Not Found — The Formula</title>
  <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Quicksand', sans-serif;
      background-color: #ecddce;
      color: #774722;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .msg {
      text-align: center;
      padding: 40px;
    }
    .msg h1 { font-size: 24px; margin-bottom: 8px; }
    .msg p { font-size: 14px; color: #926f4a; }
  </style>
</head>
<body>
  <div class="msg">
    <h1>Letter Not Found</h1>
    <p>This letter may have been removed or the link may be incorrect.</p>
  </div>
</body>
</html>`;
}
