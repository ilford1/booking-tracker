# Supabase Authentication Configuration

## Important: Configure these URLs in your Supabase Dashboard

### 1. Go to your Supabase Dashboard
- Project: **booking tracker** (ggwkkxmufcjnwgeqllev)
- Navigate to: **Authentication > URL Configuration**

### 2. Site URL
Set this to your main production URL:
```
https://booking-tracker-delta.vercel.app
```

### 3. Redirect URLs (Add ALL of these)
Add these URLs to the "Redirect URLs" list:

#### Production URLs:
```
https://booking-tracker-delta.vercel.app/auth/callback
https://booking-tracker-1s-projects-ef6c6dc5.vercel.app/auth/callback
https://booking-tracker-git-main-1s-projects-ef6c6dc5.vercel.app/auth/callback
https://*.vercel.app/auth/callback
```

#### Development URLs:
```
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
http://127.0.0.1:3000/auth/callback
```

### 4. Email Templates (Optional but recommended)
Navigate to **Authentication > Email Templates** and ensure:
- Confirm signup: Points to `{{ .SiteURL }}/auth/confirm?token={{ .Token }}`
- Reset password: Points to `{{ .SiteURL }}/auth/reset-password?token={{ .Token }}`
- Magic Link: Points to `{{ .SiteURL }}/auth/confirm?token={{ .Token }}`

### 5. OAuth Providers (if using social login)
If you plan to use Google, GitHub, or Apple sign-in:
1. Go to **Authentication > Providers**
2. Configure each provider with:
   - Callback URL: `https://ggwkkxmufcjnwgeqllev.supabase.co/auth/v1/callback`
   - Add your client IDs and secrets

### 6. CORS Configuration
Ensure these domains are allowed:
- `https://booking-tracker-delta.vercel.app`
- `https://*.vercel.app`
- `http://localhost:3000`

## Testing the Configuration

### Test locally:
```bash
npm run dev
# Visit http://localhost:3000/auth/signin
```

### Test on Vercel:
```bash
# Visit https://booking-tracker-delta.vercel.app/auth/signin
```

## Common Issues and Solutions

### Issue: "Failed to fetch" error
**Solution**: This is usually a network issue. Our code updates should fix this.

### Issue: "Redirect URL not allowed"
**Solution**: Make sure ALL the URLs above are added to Supabase's Redirect URLs.

### Issue: Cookies not being set
**Solution**: 
1. Ensure Site URL is correctly set in Supabase
2. Check that cookies are enabled in the browser
3. For Safari, may need to disable "Prevent cross-site tracking"

### Issue: User stays on signin page after successful login
**Solution**: Check middleware.ts is properly handling authentication state

## Environment Variables

Ensure these are set in Vercel:
```
NEXT_PUBLIC_SUPABASE_URL=https://ggwkkxmufcjnwgeqllev.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

Optional (for better redirect handling):
```
NEXT_PUBLIC_APP_URL=https://booking-tracker-delta.vercel.app
```
