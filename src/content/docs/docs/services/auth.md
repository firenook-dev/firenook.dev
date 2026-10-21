---
title: Authentication
description: Sign-up and sign-in, test providers, codes and links, custom claims, MFA, passkeys, tenants and blocking functions in Firenook's Auth emulator.
---

Firenook's Auth emulator implements every operation the official Auth
emulator does. Read this page to set it up, sign users in with test
credentials, read the codes and links Auth would have sent, and see what it
leaves out.

## Set it up

Auth has no top-level section in `firebase.json`, so it starts when
`emulators.auth` is there:

```json title="firebase.json"
{
  "emulators": {
    "auth": { "port": 9099 }
  }
}
```

Point your app at it. In a web app the address includes `http://`:

```js
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099');
```

The Admin SDK reads `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`, which your
Functions and `firenook emulators:exec` get set for them.

## What it emulates

All 61 operations of the official Auth emulator, checked against a recorded
run of it:

- **Sign-in methods:** email and password, anonymous, custom tokens, email
  links, phone numbers, and test sign-in with Google, Apple and other
  providers.
- **Accounts:** update and delete, session cookies, and the Admin SDK's batch
  create, get, delete and query.
- **Multi-factor and passkeys:** SMS second factors, and passkeys.
- **Tenants** and project and tenant configuration.
- **Blocking functions** (`beforeUserCreated` and `beforeUserSignedIn`) and
  the `user.create` and `user.delete` triggers.
- **Export and import** in the official format.
- **The emulator's own routes:** the codes and links it issued, its
  configuration, and the popup and redirect helper pages.

It does not do what the official emulator answers with `501` either: identity
provider, SAML and OIDC configuration, `initializeAuth`, IAM on tenants, Game
Center, reCAPTCHA enforcement and TOTP second factors. It sends no real email
or SMS, and its ID tokens are unsigned, as the official emulator's are, so
production token verification does not apply.

## Sign a user up

The SDK calls are the ones you use in production. A sign-up, an email
verification read back from the emulator, and a custom claim set through the
Admin SDK:

```js title="signup.mjs"
const { user } = await createUserWithEmailAndPassword(auth, 'ada@example.com', 'secret-password');
console.log('signed up', user.uid, user.email);
await sendEmailVerification(user);

const res = await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-shop/oobCodes');
const { oobCodes } = await res.json();
console.log('oobCodes', oobCodes.map((c) => `${c.requestType} ${c.email}`));

await getAdminAuth().setCustomUserClaims(user.uid, { role: 'admin' });
const token = await user.getIdTokenResult(true);
console.log('claims', token.claims.role);
```

```console
$ node signup.mjs
signed up Zy9R83B4S4AMfCNTfnAt5JwmeB3Z ada@example.com
oobCodes [ 'VERIFY_EMAIL ada@example.com' ]
claims admin
```

Custom claims are held to the 1,000-character limit, counted as the official
emulator counts them: the compact JSON's length in UTF-16 code units, so `é`
counts one and an emoji two.

## Test sign-in with providers

Sign in with Google, Apple or another provider by handing the SDK a
credential made of plain JSON claims. Nothing reaches the provider:

```js
const credential = GoogleAuthProvider.credential(
  JSON.stringify({ sub: 'g-123', email: 'grace@example.com', email_verified: true }),
);
const { user } = await signInWithCredential(auth, credential);
console.log('google', user.email, user.providerData.map((p) => p.providerId));
```

```console
google grace@example.com [ 'google.com' ]
```

`signInWithPopup` and `signInWithRedirect` open the emulator's own helper
page, where you pick an account or add a new one.

## Codes and links

Every email link and SMS code Auth would have sent is printed in the log:

```text
firenook auth: To verify the email address ada@example.com, follow this link: http://127.0.0.1:9099/emulator/action?mode=verifyEmail&lang=en&oobCode=SuGQzETq…&apiKey=fake-api-key
firenook auth: To verify the phone number +15555550100, use the code 511430.
```

The console's Authentication page keeps them in an inbox, and the emulator's
REST routes return them to your tests. These routes exist only on the
emulator:

| Route | What it does |
| --- | --- |
| `GET /emulator/v1/projects/{project}/oobCodes` | Email links: verification, password reset, email sign-in, email change |
| `GET /emulator/v1/projects/{project}/verificationCodes` | SMS codes for phone sign-in and SMS second factors |
| `GET` and `PATCH /emulator/v1/projects/{project}/config` | The emulator's settings, such as `signIn.allowDuplicateEmails` |
| `DELETE /emulator/v1/projects/{project}/accounts` | Delete every account |

The codes and the account deletion also take a
`/tenants/{tenant}/` form for a tenant. For example:

```console
$ curl http://127.0.0.1:9099/emulator/v1/projects/demo-shop/verificationCodes
{"verificationCodes":[{"code":"511430","phoneNumber":"+15555550100","sessionInfo":"4UQ4ly4D…"}]}
```

The action links always carry the Auth emulator's own address, including a
code asked for from the console.

## Blocking functions

A blocking function in your Functions codebase runs on every matching
sign-up or sign-in, and what it throws reaches the client:

```js
const { beforeUserCreated, HttpsError } = require('firebase-functions/identity');

exports.checkDomain = beforeUserCreated((event) => {
  if (event.data.email?.endsWith('@blocked.test')) {
    throw new HttpsError('permission-denied', 'Sign-ups from blocked.test are closed.');
  }
  return { customClaims: { plan: 'free' } };
});
```

A sign-up from `blocked.test` then fails with the function's message, and any
other sign-up gets the claim:

```console
$ node blocking.mjs
blocked: auth/internal-error Firebase: ((HTTP request to http://127.0.0.1:5001/demo-shop/us-central1/checkDomain returned HTTP error 403: {"error":{"message":"Sign-ups from blocked.test are closed.","status":"PERMISSION_DENIED"}})) (auth/internal-error).
allowed, claims: free
```

## Your users between runs

With `--keep-data`, accounts, codes and configuration are kept in
`.firenook/state/auth-state.json` and come back at the next start. The file is
written within 250 ms of a change, not before the response, and at once on a
clean stop; a tool that reads it while the suite runs can see a state that
much older. [Keep data between runs](/docs/data/keep-data) has the details.
Like the official emulator's, exported password hashes use a reversible
development format: keep real passwords and real user exports out of it.

## Next

- [Run one service on its own](/docs/get-started/one-service): Auth without
  the rest of the suite.
- [The console](/docs/tools/console): users, their activity and the inbox.
- [Security Rules](/docs/services/rules): use these users in your rules tests.
