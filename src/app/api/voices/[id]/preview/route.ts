import { NextResponse } from 'next/server';
import { voices } from '@/lib/voices';
import { getSupabaseServer } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return NextResponse.json({ error: 'Connect your ElevenLabs API key to play real voice previews.' }, { status: 503 });
  const { id } = await params;
  if (!/^[a-zA-Z0-9_-]{5,100}$/.test(id)) return NextResponse.json({ error: 'Invalid voice ID.' }, { status: 400 });
  const isPublicSeed = voices.some(voice => voice.id === id);
  const supabase = await getSupabaseServer();
  const auth = supabase ? await supabase.auth.getUser() : null;
  const user = auth?.data.user ?? null;
  if (!isPublicSeed && !user) return NextResponse.json({ error: 'Sign in to preview workspace voices.' }, { status: 401 });
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/voices/${encodeURIComponent(id)}`, { headers: { 'xi-api-key': key }, cache: 'no-store' });
    if (!response.ok) return NextResponse.json({ error: 'This voice has no accessible preview.' }, { status: response.status });
    const voice = await response.json();
    if (voice.category === 'cloned') {
      if (!user || !supabase) return NextResponse.json({ error: 'Sign in to preview this private voice.' }, { status: 401 });
      const { data: owned } = await supabase.from('personal_voices').select('voice_id').eq('user_id', user.id).eq('voice_id', id).maybeSingle();
      if (!owned) return NextResponse.json({ error: 'You do not own this private voice.' }, { status: 403 });
    }
    if (!voice.preview_url) return NextResponse.json({ error: 'No provider preview is available for this voice.' }, { status: 404 });
    return NextResponse.json({ url: voice.preview_url });
  } catch { return NextResponse.json({ error: 'Unable to retrieve the voice preview.' }, { status: 502 }); }
}
