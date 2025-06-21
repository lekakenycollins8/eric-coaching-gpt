# Environment Variables Setup Guide for Eric GPT Coaching Platform

This guide outlines the required environment variables for both the web app and server deployments.

## Web App Environment Variables (Vercel)

### Authentication (NextAuth)
```
# NextAuth Configuration
NEXTAUTH_URL=https://your-web-app-url.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-key

# Email Provider (for Magic Links)
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email-username
EMAIL_SERVER_PASSWORD=your-email-password
EMAIL_FROM=noreply@example.com

# MongoDB Connection (for NextAuth adapter)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# API URL (Server)
NEXT_PUBLIC_API_URL=https://your-server-app-url.vercel.app
NEXT_PUBLIC_APP_URL=https://your-web-app-url.vercel.app
```

## Server Environment Variables (Vercel)

```
# CORS Configuration
NEXT_PUBLIC_APP_URL=https://your-web-app-url.vercel.app

# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Other API Keys and Configuration
OPENAI_API_KEY=your-openai-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

## Troubleshooting Authentication Issues

1. **Verify NEXTAUTH_URL**: Make sure `NEXTAUTH_URL` in the web app deployment exactly matches your web app's URL.

2. **Check Email Provider**: Ensure your email provider credentials are correct and the service is working.

3. **MongoDB Connection**: Verify that both web app and server can connect to the same MongoDB instance.

4. **CORS Configuration**: Make sure the server's CORS settings allow requests from your web app.

5. **Proxy Configuration**: The web app's Vercel configuration should exclude auth routes from being proxied to the server.

## Debugging Tips

1. **Enable NextAuth Debug Mode**: Set `NEXTAUTH_DEBUG=true` in your web app environment variables to get more detailed logs.

2. **Check Browser Console**: Look for CORS errors or other issues in the browser's developer tools.

3. **Check Vercel Logs**: Review both web app and server deployment logs for errors.
