#!/usr/bin/env node
// Real, opt-in smoke test. Requires ELEVENLABS_API_KEY and ELEVENLABS_TEST_VOICE_ID.
// The test synthesizes a short sentence in memory and discards it; it never fakes a pass.
const key = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_TEST_VOICE_ID;
if (!key || !voiceId) {
  console.error('Set ELEVENLABS_API_KEY and ELEVENLABS_TEST_VOICE_ID to run a real synthesis test.');
  process.exit(2);
}
const model = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
  method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
  body: JSON.stringify({ text: 'Olá. Este é um teste real da síntese neural da NeloveLabs.', model_id: model }),
});
if (!response.ok) {
  console.error(`Provider synthesis failed (${response.status}). Check the key, voice access, and model.`);
  process.exit(1);
}
const audio = await response.arrayBuffer();
if (audio.byteLength < 1024) {
  console.error('Provider returned an empty or unexpectedly small audio response.');
  process.exit(1);
}
console.log(`PASS: real provider returned ${audio.byteLength} bytes (${response.headers.get('content-type') || 'audio'}) using model ${model}. Audio was discarded; listen to a generation in the studio for a subjective quality review.`);
