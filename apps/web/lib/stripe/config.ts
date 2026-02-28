// Stripe Sandbox Configuration
// Use this for testing payments without real money

export const stripeConfig = {
  // Mode
  mode: process.env.NEXT_PUBLIC_STRIPE_MODE || 'sandbox',
  
  // API Version
  apiVersion: '2024-12-18.acacia',
  
  // Sandbox Settings
  sandbox: {
    enabled: true,
    // Don't require real cards
    testCards: [
      { number: '4242424242424242', brand: 'Visa', description: 'Success' },
      { number: '4000000000000002', brand: 'Visa', description: 'Declined' },
      { number: '4000002500003155', brand: 'Visa', description: '3D Secure' },
      { number: '4000003560000008', brand: 'Visa', description: 'India' },
      { number: '4000000000003220', brand: 'Visa', description: 'Subscription' },
    ],
  },
  
  // Connect Settings
  connect: {
    // In sandbox, accounts are automatically approved
    // No real verification needed
    autoApprove: true,
    skipOnboarding: false,
  },
  
  // Webhook Settings
  webhooks: {
    // In sandbox, we can use stripe CLI for local testing
    // stripe listen --forward-to localhost:3000/api/webhooks/stripe
    localTesting: process.env.NODE_ENV === 'development',
  },
};

// Helper to check if in sandbox mode
export const isSandbox = () => stripeConfig.mode === 'sandbox';

// Helper to get Stripe instance
export const getStripe = () => {
  const Stripe = require('stripe');
  return Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: stripeConfig.apiVersion,
  });
};
