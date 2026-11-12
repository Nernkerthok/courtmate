# CourtMate private cloud saves

Cloud mode is optional. The browser-only guest flow still works without Supabase environment variables. Each signed-in organizer owns their saved groups. Read-only invitations are opt-in; there is no shared editing or deletion endpoint. Saves are explicit, not automatic.

## 1. Database

In the intended Supabase project, open **SQL Editor → New query**, paste [the migration](migrations/202611120001_private_groups.sql), and run it once. It creates only `public.courtmate_groups`, its index, owner policies and revision trigger. It does not change existing tables. Do not rerun a partially edited migration; the original script runs in a transaction.

The table uses RLS with `auth.uid() = owner_id`. Anonymous clients have no table grants. Signed-in clients may select, insert and update only their own rows. Column grants prevent editing the owner, revision and timestamps. No delete permission is granted. A saved snapshot includes roster/icons, active courts, completed games, costs and extra charges. Payloads are versioned and validated before application state changes.

For read-only LINE invitations, apply [the invite migration](migrations/202611120002_readonly_invites.sql) after the first migration. The organizer explicitly creates a link with a cryptographically random 256-bit token, stores only its SHA-256 hash in Postgres and places the token in the URL fragment. A token-scoped read function returns only group name, update time, names, levels and avatar choices. It never returns owner identity, costs, games or the private snapshot. The link expires after seven days; issuing another token invalidates the old one, and the owner can revoke it. No anonymous table access is granted. Security-definer functions pin an empty search path, use fully-qualified relations and enforce the owner check on publish/revoke. The read function is the only anonymous entry point and validates the token and expiry before projecting data.

## 2. Authentication

Google sign-in is the primary method. Email Magic Links remain an optional fallback for authorized addresses. In **Authentication → URL Configuration**, set the Site URL to the production Netlify origin and add the exact production URL to Redirect URLs. For this deployment:

```text
https://sensational-quokka-95aa17.netlify.app/
```

Add `http://127.0.0.1:5173/` only while testing locally. Do not use an unrestricted production redirect wildcard. Both methods use PKCE. Auth sessions persist on the device until local sign-out. The application never stores a password.

### Google provider

1. Open [Google Auth Platform](https://console.cloud.google.com/auth/overview) in a Google Cloud project dedicated to CourtMate. Set app name **CourtMate**, a support email and developer contact email you control. Choose **External** audience for other organizers.
   In **Branding**, set the Application home page to `https://sensational-quokka-95aa17.netlify.app/` and Application privacy policy link to `https://sensational-quokka-95aa17.netlify.app/privacy.html`. The policy is a public static page; review its actual data practices and contact address when changing the service. The app links to it on the public welcome screen and account panel. Save all Branding fields before trying **Audience → Publish app**. Publishing availability and brand verification are determined by Google.
2. Request only `openid`, `userinfo.email`, and `userinfo.profile`. Do not request Gmail, Drive, offline access or extra Google API permissions.
3. Create an OAuth client, type **Web application**, name **CourtMate Web**. Use this exact authorized JavaScript origin (no trailing slash):

   ```text
   https://sensational-quokka-95aa17.netlify.app
   ```

   Use this exact authorized redirect URI:

   ```text
   https://cqzubclkvscfmuvqlobz.supabase.co/auth/v1/callback
   ```

4. In Supabase → **Authentication → Sign In / Providers → Google**, enter the OAuth client ID and secret and enable Google. Keep nonce validation enabled. The secret belongs only in Supabase; never put it in Vite/Netlify build variables, this repository or chat messages.
5. For initial testing add only the intended test accounts in Google Audience. Before inviting the public, change publishing status appropriately and complete any requirements Google shows. A test audience does not permit every organizer to sign in.
6. The frontend checks the public Supabase Auth settings. It keeps the Google button disabled with an explanation until the provider is enabled, and has a retry button for configuration/network changes. No build variable is needed for the Google client ID or secret.

The app uses `signInWithOAuth` in the same tab, returning to its exact root URL. A deliberate Google sign-in keeps only a validated working snapshot in `sessionStorage` in that tab, with a 30-minute restoration window; the app consumes and removes it on return (also on denial), and closing the tab clears it. It never stores Google credentials or tokens in the draft or puts player data in a redirect URL. The restored group remains **unsaved** until the organizer presses Save. Browser Back from Google releases the pending button lock. OAuth errors are translated to safe persistent messages, and callback parameters are removed after initialization. Open the app in Chrome/Safari rather than the LINE in-app browser for Google sign-in.

[Supabase Google setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-google).

**Email delivery:** Supabase's built-in email service is intended for testing and restricts recipients to project-team addresses. Configure a production SMTP provider before allowing other organizers to sign in. Keep confirmation enabled; do not disable protections as a workaround. Provider credentials belong only in Supabase, never in this repository or Vite variables. [Supabase SMTP docs](https://supabase.com/docs/guides/auth/auth-smtp).

## 3. Netlify

The repository root contains `netlify.toml`: Node 22, build `npm test && npm run build`, publish `dist`. Set the following build variables in the Netlify project and deploy again:

```dotenv
VITE_USE_API=false
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_PUBLIC_KEY
```

The publishable key identifies the application and is intentionally sent to browsers. RLS authorizes each user's requests. Never supply a secret/service-role key through `VITE_*`. The build restricts the CSP connection origin to the configured Supabase project; it does not allow arbitrary remote hosts. `.env.local` is ignored by Git and is used only for local previews.

## 4. Use and verify

1. Tap the cloud/account button in the header and **เข้าสู่ระบบด้วย Google**. Choose your own account and confirm the successful return. Also test declining sign-in, Browser Back, and a guest group with pending courts/costs: it must return intact and still require an explicit cloud save. Email fallback requires opening its link in the browser that requested it.
2. Create a group, add players and choose **บันทึกก๊วนนี้** in the account panel. Confirm the success message.
3. Play a game, edit a player's icon, add costs and choose **บันทึกการแก้ไข**.
4. Reload, sign in on another device and open the saved group. Check players/icons, game counts, pending courts and costs.
5. A different account must not see the group in its own library or modify it. A person holding an explicitly issued invite link can view only the sanitized roster.
6. If two devices open the same revision, the first save succeeds; the second is rejected until it reloads the latest group. The older device's draft stays in memory.
7. Sign-out clears the working draft on that device, retaining saved cloud groups. Unsaved edits require confirmation when opening another group or signing out; closing/reloading the page uses the browser's unsaved-data prompt.
8. Tap **ชวนเพื่อน**, create a link, then choose **ชวนผ่าน LINE** or copy the invitation. Sending is a user action in LINE; the app never selects a recipient or sends a message. LINE's share URL scheme supports mobile iOS/Android; desktop users can copy and paste. Verify an invalid/rotated/revoked/expired token cannot open the roster and the invite page has no editing controls.

`npm test` runs the domain/snapshot/auth-redirect suites and the actual migration against isolated in-memory Postgres (PGlite). Security checks cover two owners, anonymous reads, impersonation, owner/revision tampering, deletes, invalid payloads, duplicate insert IDs and stale revision writes. Auth-draft tests cover one-time restoration, tab isolation, expiry, corrupt snapshots and blocked storage. PGlite is a development dependency and is not shipped to browsers. Final Google sign-in and live email delivery must still be verified against the real project.

Laravel remains an optional legacy calculation API; cloud persistence uses Supabase directly and requires neither a PHP server nor an elevated Supabase key.
