import { NextResponse } from 'next/server';
import { voices } from '@/lib/voices';
import { getSupabaseServer } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return NextResponse.json({ voices, connected: false, message: 'Connect an ElevenLabs API key to load your licensed voice catalogue.' });
  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ voices, connected: false, message: 'Authentication is required to load private provider voices.' });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ voices, connected: false, message: 'Sign in to load your provider voice catalogue.' });
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': key }, cache: 'no-store' });
    if (!response.ok) return NextResponse.json({ error: 'Voice provider could not load your catalogue.' }, { status: response.status });
    const payload = await response.json();
    const { data: ownedRows } = await supabase.from('personal_voices').select('voice_id').eq('user_id', user.id);
    const owned = new Set((ownedRows || []).map((row: any) => row.voice_id));
    const permitted = (payload.voices || []).filter((voice: any) => voice.category !== 'cloned' || owned.has(voice.voice_id));
    return NextResponse.json({ connected: true, voices: permitted.map((voice: any) => ({ id: voice.voice_id, name: voice.name, accent: voice.labels?.accent ?? '', language: voice.labels?.language ?? 'Multilingual', gender: voice.labels?.gender ?? '', age: voice.labels?.age ?? '', description: voice.description ?? '', labels: voice.labels ? Object.values(voice.labels) : [], category: voice.category, previewUrl: voice.preview_url, provider: 'elevenlabs' })) });
  } catch { return NextResponse.json({ error: 'Unable to reach the voice provider right now.' }, { status: 502 }); }
}
