# TexosDrinks Production Deployment Guide

This guide outlines the steps to deploy the TexosDrinks application to a production environment.

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- SSL certificate for your domain
- Paystack business account

## Deployment Steps

### 1. Server Setup

1. Set up a server with Node.js installed
2. Configure a reverse proxy (Nginx or Apache) with SSL
3. Set up PostgreSQL database

### 2. Application Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/TexosDrinks.git
   cd TexosDrinks/TexosDrinks-Backend
   ```

2. Install dependencies:
   ```bash
   npm install --production
   ```

3. Create and configure `.env` file:
   ```bash
   cp .env.example .env
   # Edit .env with your production values
   ```

4. Run database migrations:
   ```bash
   node migrations/runAllMigrations.js
   ```

### 3. Paystack Configuration

1. Log in to your Paystack dashboard
2. Get your live API keys from Settings > API Keys & Webhooks
3. Add your webhook URL: `https://your-domain.com/api/paystack/webhook`
4. Update your `.env` file with the live keys

### 4. Process Management

Set up PM2 to manage the Node.js process:

```bash
npm install -g pm2
pm2 start server.js --name texosdrinks
pm2 save
pm2 startup
```

### 5. Nginx Configuration

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6. Security Considerations

1. Ensure all API keys and secrets are properly secured
2. Set up firewall rules to restrict access
3. Configure rate limiting for API endpoints
4. Set up regular database backups
5. Implement monitoring and logging

### 7. Monitoring

1. Set up application monitoring (e.g., PM2, New Relic)
2. Configure error logging (e.g., Winston, Sentry)
3. Set up server monitoring (e.g., Datadog, Prometheus)

### 8. Testing

Before going live:

1. Test the entire payment flow with real cards
2. Verify webhook functionality
3. Test order processing and fulfillment
4. Perform load testing

## Maintenance

- Regularly update dependencies
- Monitor Paystack dashboard for transaction issues
- Check server logs for errors
- Perform regular database backups

## Troubleshooting

- **Payment Issues**: Check Paystack dashboard and transaction logs
- **Server Errors**: Check application logs in PM2 (`pm2 logs`)
- **Database Issues**: Verify PostgreSQL connection and credentials