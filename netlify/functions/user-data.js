export default async (request, context) => {
  return new Response(JSON.stringify({ status: 'ok', method: request.method }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
