# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your Next.js application.

## Prerequisites

- Google Cloud Console account
- Next.js application with NextAuth.js configured

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (if not already enabled)

## Step 2: Configure OAuth Consent Screen

1. Navigate to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type (unless you have a Google Workspace account)
3. Fill in the required information:
   - **App name**: Your application name
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
4. Add scopes (optional for basic authentication):
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
5. Save and continue

## Step 3: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Choose **Web application** as the application type
4. Configure the OAuth client:
   - **Name**: Give it a descriptive name
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (for development)
     - Your production domain (e.g., `https://yourdomain.com`)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)

## Step 4: Configure Environment Variables

Add the following to your `.env.local` file:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Step 5: Verify Configuration

Run the configuration check script:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-oauth-config.ps1
```

## Common Issues and Solutions

### Error 400: redirect_uri_mismatch

This error occurs when the redirect URI in your Google Cloud Console doesn't match what your application is using.

**Solution:**
1. Check your current configuration with the script above
2. Ensure the redirect URI in Google Cloud Console exactly matches: `http://localhost:3000/api/auth/callback/google`
3. Make sure there are no trailing slashes
4. Verify the protocol (http vs https) matches your environment

### Error 403: access_denied

This can happen if:
- The OAuth consent screen is not properly configured
- The user's email is not added to test users (for apps in testing mode)
- The app is not published (for external users)

**Solution:**
1. Publish your OAuth consent screen for external users
2. Or add test users in the OAuth consent screen configuration

### Error 401: invalid_client

This indicates:
- Incorrect client ID or client secret
- The OAuth client is disabled

**Solution:**
1. Verify your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`
2. Check that the OAuth client is enabled in Google Cloud Console

## Production Deployment

When deploying to production:

1. Update your `.env.local` or deployment environment variables:
   ```env
   NEXTAUTH_URL=https://yourdomain.com
   ```

2. Add your production domain to Google Cloud Console:
   - **Authorized JavaScript origins**: `https://yourdomain.com`
   - **Authorized redirect URIs**: `https://yourdomain.com/api/auth/callback/google`

3. Publish your OAuth consent screen if using external user type

## Testing

1. Start your development server: `npm run dev`
2. Navigate to your sign-in page
3. Click "Sign in with Google"
4. Complete the OAuth flow
5. Verify successful authentication

## Security Best Practices

1. Keep your client secret secure and never commit it to version control
2. Use environment variables for all sensitive configuration
3. Regularly rotate your client secret
4. Monitor OAuth usage in Google Cloud Console
5. Set up proper CORS policies for production

## Troubleshooting

If you encounter issues:

1. Run the configuration check script
2. Check the browser developer console for errors
3. Verify all environment variables are set correctly
4. Ensure Google Cloud Console configuration matches your application settings
5. Check that all required APIs are enabled

For additional help, refer to:
- [NextAuth.js Google Provider Documentation](https://next-auth.js.org/providers/google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
