# NeloveLabs

NeloveLabs is a neural human-voice platform foundation. Text-to-speech, genuine provider previews and voice cloning call the configured provider from server routes. If credentials are missing or a provider call fails, the product surfaces an error instead of returning placeholder speech or claiming an untested quality level.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configure the server-side variables in `.env.local` (or your deployment environment):

```dotenv
ELEVENLABS_API_KEY=...                 # server only; never use NEXT_PUBLIC_
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
NEXT_PUBLIC_SUPABASE_URL=https://....supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...          # server only
```

`ELEVENLABS_MODEL_ID=eleven_v3` enables provider emotion tags. With other models, the API rejects non-neutral emotion selections rather than pretending the model interpreted them. Provider model and voice capabilities vary; use a licensed voice from your account, and validate pronunciation and performance on real samples before production. The language selector passes the corresponding ISO language code; Portuguese accent quality still depends on the voice supplied by the provider. The seed catalogue is a short list of real provider voice IDs, not custom recordings. Previews are fetched from the provider on demand; no bundled sample audio is used.

## Supabase

Create a Supabase project and apply `supabase/migrations/202611200001_initial.sql` (Supabase CLI: `supabase db push`). Enable email/password authentication. The migration creates profiles, personal voices, generation history and an atomic credit balance with row-level security. Server-side credit reservations require the service-role key and are refunded on failed provider requests. Never put the service-role key in a browser environment. Production billing / checkout is intentionally disabled until a real billing integration is added; no paid plan is represented as purchasable.

## Smoke test

`npm run typecheck` and `npm run build` validate the application without making a provider request. A real network synthesis test is opt-in and requires a provider key and voice ID:

```bash
ELEVENLABS_API_KEY=... ELEVENLABS_TEST_VOICE_ID=... npm run test:provider
```

It synthesizes a short Brazilian Portuguese phrase in memory, verifies that real audio bytes came back, then discards the audio. A pass does not replace human review of naturalness, accent, consent, accessibility, or latency. No live provider test is possible without configured credentials.

## Routes

- `/` landing and live provider-sample player
- `/login`, `/signup` Supabase email authentication
- `/studio` neural text-to-speech workspace, controls, actual generated playback, MP3 and browser-generated PCM WAV downloads
- `/voices` connected voice library and actual provider previews
- `/cloning`, `/my-voices` consent-gated provider cloning and owner-only deletion
- `/history`, `/settings`, `/billing` account workspace

Audio generation uses a provider adapter-style server endpoint (`/api/generate`), keeps provider keys on the server, reserves credits, records generation metadata, and streams actual provider audio to the signed-in user. Provider-specific behavior is isolated in `src/app/api` and can be replaced while retaining the studio UI and data model.
