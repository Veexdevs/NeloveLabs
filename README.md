# NeloveLabs

NeloveLabs is a neural voice studio with a **browser-local synthesis path that does not call a voice-generation API**. It uses open ONNX model weights through Kokoro.js / Transformers.js and WebAssembly in the browser. On first use, the browser downloads model files from Hugging Face and caches them; after that, inference runs on the user's device. Text and generated audio are not sent to our server by the local studio.

## Local synthesis models

- **English (US/UK):** Kokoro-82M ONNX, quantized Q8, WASM. Eight curated presets are exposed.
- **Português brasileiro:** Kokoro-82M Portuguese voice embeddings (`pf_dora`, `pm_alex`, `pm_santa`) run locally. A small grapheme-to-phoneme adapter maps common PT-BR spelling patterns to IPA. Validate regional pronunciation with native listeners; this adapter isn't a substitute for a thoroughly tested, dedicated Brazilian phonemizer.
- The browser downloads model weights on first use (internet required). Audio is generated in-browser and can be exported as WAV or MP3. Generation history for this path is kept in browser localStorage.
- Model capability is presented honestly: open neural models run without provider credentials, but are not claimed to match the proprietary naturalness, accent fidelity, voice cloning, or emotional controls of ElevenLabs. Emotion isn't presented as a control if the selected model doesn't support it.
- Local generation currently accepts up to 1,500 characters at a time. An 82M quantized model can use substantial browser memory; devices without WebAssembly support are rejected with an explicit error.

## Run locally

```bash
npm install
cp .env.example .env.local # optional, only for account/cloud/clone features
npm run dev
```

The studio does not require `ELEVENLABS_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, or any API credentials for local speech generation. Supabase and the optional provider routes remain for cloud login, clone workflows, provider voice catalogue and server-side history. Never expose server-side keys with `NEXT_PUBLIC_`.

## Dependencies and Vercel

`kokoro-js` and Transformers.js are used only from a client component. `onnxruntime-node` is a transitive package; browser inference uses WASM. `.npmrc` sets `ignore-scripts=true` so npm does not run the native/GPU ONNX Runtime downloader during installation. No inference server is deployed.

## Cloud/Supabase (optional)

For optional login, cloud history and clone management, configure `.env.example` values and apply `supabase/migrations/202611200001_initial.sql`. Voice cloning remains a provider-dependent feature because the local browser model does not implement safe voice-clone training. Billing is disabled until a real checkout service exists.

## Checks

```bash
npm run typecheck
npm run build
```

Builds and typechecks do not download or run model weights. To validate perceived quality, open `/studio` on a device, choose the language model, wait for the first weight download and listen to generated text. Human naturalness is subjective, so no benchmark claim is made without evaluation against real listeners.
