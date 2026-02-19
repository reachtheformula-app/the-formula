import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const sql = neon(process.env.NEON_DATABASE_URL);

export async function handler(event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method not allowed' };
  }

  let stripeEvent;

  // Verify webhook signature if signing secret is set
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    const sig = event.headers['stripe-signature'];
    try {
      stripeEvent = stripe.webhooks.constructEvent(event.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid signature' }) };
    }
  } else {
    // In test mode without webhook secret, parse directly
    stripeEvent = JSON.parse(event.body);
  }

  console.log('Stripe webhook event:', stripeEvent.type);

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (subscriptionId) {
          // Fetch the full subscription to get tier info
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const tier = subscription.metadata.tier || 'gold';
          const periodEnd = new Date(subscription.current_period_end * 1000);

          await sql`
            UPDATE subscriptions
            SET stripe_subscription_id = ${subscriptionId},
                tier = ${tier},
                status = 'active',
                current_period_end = ${periodEnd.toISOString()},
                updated_at = NOW()
            WHERE stripe_customer_id = ${customerId}
          `;
          console.log(`Subscription activated: customer=${customerId}, tier=${tier}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object;
        const customerId = subscription.customer;
        const tier = subscription.metadata.tier || 'gold';
        const status = subscription.status === 'active' ? 'active' :
                       subscription.status === 'past_due' ? 'past_due' :
                       subscription.status === 'canceled' ? 'canceled' :
                       subscription.status === 'trialing' ? 'trialing' : 'inactive';
        const periodEnd = new Date(subscription.current_period_end * 1000);

        await sql`
          UPDATE subscriptions
          SET tier = ${tier},
              status = ${status},
              current_period_end = ${periodEnd.toISOString()},
              updated_at = NOW()
          WHERE stripe_customer_id = ${customerId}
        `;
        console.log(`Subscription updated: customer=${customerId}, tier=${tier}, status=${status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object;
        const customerId = subscription.customer;

        // Check if this is an agency user — they keep agency_gold
        const user = await sql`SELECT is_agency FROM subscriptions WHERE stripe_customer_id = ${customerId}`;
        const newTier = user[0]?.is_agency ? 'agency_gold' : 'none';
        const newStatus = user[0]?.is_agency ? 'active' : 'inactive';

        await sql`
          UPDATE subscriptions
          SET tier = ${newTier},
              status = ${newStatus},
              stripe_subscription_id = NULL,
              current_period_end = NULL,
              updated_at = NOW()
          WHERE stripe_customer_id = ${customerId}
        `;
        console.log(`Subscription deleted: customer=${customerId}, reverted to ${newTier}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object;
        const customerId = invoice.customer;

        await sql`
          UPDATE subscriptions
          SET status = 'past_due',
              updated_at = NOW()
          WHERE stripe_customer_id = ${customerId}
        `;
        console.log(`Payment failed: customer=${customerId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
  } catch (error) {
    console.error('Webhook processing error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
}
