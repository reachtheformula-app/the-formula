import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const sql = neon(process.env.NEON_DATABASE_URL);

// Maps plan selection to Stripe price IDs (set in Netlify env vars)
const PRICE_MAP = {
  gold_monthly: process.env.STRIPE_GOLD_MONTHLY_PRICE,
  gold_yearly: process.env.STRIPE_GOLD_YEARLY_PRICE,
  platinum_monthly: process.env.STRIPE_PLATINUM_MONTHLY_PRICE,
  platinum_yearly: process.env.STRIPE_PLATINUM_YEARLY_PRICE,
  agency_platinum: process.env.STRIPE_AGENCY_PLATINUM_PRICE,
};

export async function handler(event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { plan, userId, userEmail } = JSON.parse(event.body);

    if (!plan || !userId || !userEmail) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing plan, userId, or userEmail' }) };
    }

    const priceId = PRICE_MAP[plan];
    if (!priceId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid plan: ' + plan }) };
    }

    // Check if user already has a Stripe customer ID
    const existing = await sql`SELECT stripe_customer_id FROM subscriptions WHERE user_id = ${userId}`;
    let customerId = existing[0]?.stripe_customer_id;

    // Create or retrieve Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { formula_user_id: userId },
      });
      customerId = customer.id;

      // Upsert subscription record
      await sql`
        INSERT INTO subscriptions (user_id, user_email, stripe_customer_id)
        VALUES (${userId}, ${userEmail}, ${customerId})
        ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = ${customerId}, user_email = ${userEmail}, updated_at = NOW()
      `;
    }

    // Determine tier from plan name
    const tier = plan.startsWith('platinum') || plan === 'agency_platinum' ? 'platinum' : 'gold';

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.URL || 'https://theformula-app.netlify.app'}?checkout=success&tier=${tier}`,
      cancel_url: `${process.env.URL || 'https://theformula-app.netlify.app'}?checkout=canceled`,
      subscription_data: {
        metadata: {
          formula_user_id: userId,
          tier: tier,
        },
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    console.error('Checkout error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
}
