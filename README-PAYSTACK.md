# Paystack Integration for TexosDrinks

This guide explains how to set up and use the Paystack payment integration for TexosDrinks e-commerce site.

## Production Setup

### 1. Environment Variables

Ensure the following variables are set in your `.env` file with LIVE keys:

```
PAYSTACK_SECRET_KEY=sk_live_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key
PAYSTACK_CALLBACK_URL=https://your-production-domain.com/payment/verify
```

Replace with your actual Paystack LIVE API keys and production domain.

### 2. Webhook Configuration

In your Paystack dashboard:

1. Go to Settings > API Keys & Webhooks
2. Add your production webhook URL: `https://your-production-domain.com/api/paystack/webhook`
3. Test the webhook to ensure it's working correctly

### 3. SSL Certificate

Ensure your production server has a valid SSL certificate as Paystack requires HTTPS for callbacks.

## How It Works

1. **Checkout Process**:
   - User adds items to cart
   - User proceeds to checkout
   - User selects shipping address
   - User clicks "Pay with Paystack" button

2. **Payment Flow**:
   - Order is created in the database with "pending" status
   - Paystack payment is initialized
   - User enters payment details in Paystack popup
   - On successful payment, user is redirected to verification page
   - Order status is updated to "paid"
   - Cart is cleared

3. **Webhook Integration**:
   - Paystack sends events to `/api/paystack/webhook`
   - Server verifies the signature using the secret key
   - Transaction status is updated based on the event

## Security Measures

1. **API Key Protection**: Never expose your secret key in client-side code
2. **Webhook Signature Verification**: Always verify webhook signatures
3. **HTTPS**: Use HTTPS for all payment-related communications
4. **Transaction Logging**: Log all transaction details for audit purposes

## Monitoring and Maintenance

1. **Transaction Monitoring**: Regularly check the Paystack dashboard for transaction status
2. **Error Logging**: Monitor server logs for payment-related errors
3. **Regular Testing**: Periodically test the payment flow to ensure it works correctly
4. **API Updates**: Keep the Paystack SDK updated to the latest version

## Support

For Paystack-related issues:
- Paystack Support: https://paystack.com/support
- Paystack API Documentation: https://paystack.com/docs/api

For application-specific issues:
- Contact the development team at support@texosdrinks.com