import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Run this ONCE to create your Stripe products and prices
// Visit: https://theformula-app.netlify.app/.netlify/functions/setup-stripe
// Then copy the price IDs into your Netlify environment variables

export async function handler(event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // Create Gold product
    const goldProduct = await stripe.products.create({
      name: 'The Formula - Gold',
      description: 'Gold standard curriculum weeks, parent letter generator, activity log, and milestone tracking for children ages 0-5.',
    });

    const goldMonthly = await stripe.prices.create({
      product: goldProduct.id,
      unit_amount: 2499, // $24.99
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'gold' },
    });

    const goldYearly = await stripe.prices.create({
      product: goldProduct.id,
      unit_amount: 24990, // $249.90 (2 months free)
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { tier: 'gold' },
    });

    // Create Platinum product
    const platinumProduct = await stripe.products.create({
      name: 'The Formula - Platinum',
      description: 'Everything in Gold plus AI curriculum generator, custom week creation, and inline editing.',
    });

    const platinumMonthly = await stripe.prices.create({
      product: platinumProduct.id,
      unit_amount: 4499, // $44.99
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'platinum' },
    });

    const platinumYearly = await stripe.prices.create({
      product: platinumProduct.id,
      unit_amount: 44990, // $449.90 (2 months free)
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { tier: 'platinum' },
    });

    // Create Agency Platinum (30% off)
    const agencyPlatinumMonthly = await stripe.prices.create({
      product: platinumProduct.id,
      unit_amount: 3149, // $31.49 (30% off $44.99)
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'agency_platinum' },
    });

    const result = {
      message: 'SUCCESS! Products and prices created. Add these as Netlify environment variables:',
      env_vars: {
        STRIPE_GOLD_MONTHLY_PRICE: goldMonthly.id,
        STRIPE_GOLD_YEARLY_PRICE: goldYearly.id,
        STRIPE_PLATINUM_MONTHLY_PRICE: platinumMonthly.id,
        STRIPE_PLATINUM_YEARLY_PRICE: platinumYearly.id,
        STRIPE_AGENCY_PLATINUM_PRICE: agencyPlatinumMonthly.id,
      },
      products: {
        gold: goldProduct.id,
        platinum: platinumProduct.id,
      }
    };

    return { statusCode: 200, headers, body: JSON.stringify(result, null, 2) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
}
