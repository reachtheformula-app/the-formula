import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const sql = neon(process.env.NEON_DATABASE_URL);

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
    const { userId, newPlan } = JSON.parse(event.body);

    if (!userId || !newPlan) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing userId or newPlan' }) };
    }

    const newPriceId = PRICE_MAP[newPlan];
    if (!newPriceId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid plan: ' + newPlan }) };
    }

    // Get user's current subscription from database
    const rows = await sql`
      SELECT stripe_subscription_id, stripe_customer_id, tier
      FROM subscriptions
      WHERE user_id = ${userId} AND status = 'active'
    `;

    if (!rows[0]?.stripe_subscription_id) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'No active subscription found' }) };
    }

    const subscriptionId = rows[0].stripe_subscription_id;

    // Retrieve the current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const currentItemId = subscription.items.data[0].id;

    // Determine new tier from plan name
    const newTier = newPlan.startsWith('platinum') || newPlan === 'agency_platinum' ? 'platinum' : 'gold';

    // Update the subscription with proration
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: currentItemId,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
      metadata: {
        formula_user_id: userId,
        tier: newTier,
      },
    });

    // Immediately invoice the prorated amount so it charges now
    try {
      const invoice = await stripe.invoices.create({
        customer: rows[0].stripe_customer_id,
        auto_advance: true,
      });
      await stripe.invoices.pay(invoice.id);
    } catch (invoiceErr) {
      // If there's nothing to invoice (e.g., $0 proration), that's fine
      console.log('Invoice note:', invoiceErr.message);
    }

    // Update our database immediately
    const periodEnd = new Date(updatedSubscription.current_period_end * 1000);
    await sql`
      UPDATE subscriptions
      SET tier = ${newTier},
          status = 'active',
          current_period_end = ${periodEnd.toISOString()},
          updated_at = NOW()
      WHERE user_id = ${userId}
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        tier: newTier,
        message: `Upgraded to ${newTier}! Prorated charges applied.`,
      }),
    };
  } catch (error) {
    console.error('Upgrade error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
}
