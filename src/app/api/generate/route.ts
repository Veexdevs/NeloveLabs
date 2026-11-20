import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { emotions } from '@/lib/voices';
export const runtime = 'nodejs';
export const maxDuration = 120;
const moodTag: Record<string, string> = { Happy:'[happy] ', Sad:'[sad] ', Serious:'[serious] ', Excited:'[excited] ', Calm:'[calm] ', Scared:'[scared] ', Nervous:'[nervous] ', Confident:'[confident] ', Mysterious:'[whispering] ', Dramatic:'[dramatic] ', Whispering:'[whispering] ' };
export async function POST(request: Request) {
  const apiKey=process.env.ELEVENLABS_API_KEY;
  if(!apiKey)return NextResponse.json({error:'Voice generation is not configured yet. Add ELEVENLABS_API_KEY to the server environment to enable neural synthesis.'},{status:503});
  const supabase=await getSupabaseServer();
  if(!supabase)return NextResponse.json({error:'Authentication is not configured. Set up Supabase before enabling generation.'},{status:503});
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:'Sign in to generate audio.'},{status:401});
  const admin=getSupabaseAdmin();
  if(!admin)return NextResponse.json({error:'Credit management is not configured securely. Add SUPABASE_SERVICE_ROLE_KEY on the server.'},{status:503});
  let body:any;try{body=await request.json()}catch{return NextResponse.json({error:'Request body must be valid JSON.'},{status:400})}
  const text=typeof body.text==='string'?body.text.trim():'';const voiceId=typeof body.voiceId==='string'?body.voiceId:'';
  const emotion=emotions.includes(body.emotion)?body.emotion:'Natural';const stability=Number(body.stability??.5);const similarity=Number(body.similarity??.75);const style=Number(body.expressiveness??.25);const speed=Number(body.speed??1);
  if(!text||text.length>5000)return NextResponse.json({error:'Enter between 1 and 5,000 characters.'},{status:400});
  if(!/^[a-zA-Z0-9_-]{5,100}$/.test(voiceId))return NextResponse.json({error:'Choose a valid voice from your connected provider.'},{status:400});
  if(![stability,similarity,style,speed].every(Number.isFinite)||stability<0||stability>1||similarity<0||similarity>1||style<0||style>1||speed<.7||speed>1.2)return NextResponse.json({error:'One or more voice settings are outside the allowed range.'},{status:400});
  const modelId=process.env.ELEVENLABS_MODEL_ID||'eleven_multilingual_v2';
  if(emotion!=='Natural'&&modelId!=='eleven_v3')return NextResponse.json({error:'This model does not accept emotional direction. Set ELEVENLABS_MODEL_ID=eleven_v3 to use emotion tags; no emotion was simulated.'},{status:422});
  const languageCodes:Record<string,string>={'Português (Brasil)':'pt','Português (Portugal)':'pt','English (US)':'en','English (UK)':'en','Español':'es','Français':'fr','Deutsch':'de','Italiano':'it','日本語':'ja','한국어':'ko','中文':'zh'};
  const languageCode=typeof body.language==='string'?languageCodes[body.language]:undefined;
  if(body.language&&!languageCode)return NextResponse.json({error:'Choose a supported language.'},{status:400});
  try {
    const voiceResponse=await fetch(`https://api.elevenlabs.io/v1/voices/${encodeURIComponent(voiceId)}`,{headers:{'xi-api-key':apiKey},cache:'no-store'});
    if(!voiceResponse.ok)return NextResponse.json({error:'This voice is unavailable in your connected provider account.'},{status:400});
    const providerVoice=await voiceResponse.json();
    if(providerVoice.category==='cloned'){
      const {data:owned}=await supabase.from('personal_voices').select('voice_id').eq('user_id',user.id).eq('voice_id',voiceId).maybeSingle();
      if(!owned)return NextResponse.json({error:'You can only generate with a cloned voice owned by your workspace.'},{status:403});
    }
  } catch { return NextResponse.json({error:'Could not verify voice access with the provider.'},{status:502}); }
  const credits=Math.ceil(text.length/1000);const {error:reserveError}=await admin.rpc('consume_credits',{p_user_id:user.id,p_amount:credits});
  if(reserveError)return NextResponse.json({error:reserveError.message.includes('insufficient credits')?'You are out of credits. Upgrade your plan or wait for your balance to refresh.':'Could not reserve generation credits. Apply the Supabase database migration.'},{status:reserveError.message.includes('insufficient credits')?402:503});
  const refund=async()=>{try{await admin.rpc('refund_credits',{p_user_id:user.id,p_amount:credits})}catch{ /* best effort compensation; the server logs provider failures */ }};
  const taggedText=emotion!=='Natural'?`${moodTag[emotion]??''}${text}`:text;const started=Date.now();
  try{
    const upstream=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,{method:'POST',headers:{'xi-api-key':apiKey,'Content-Type':'application/json',Accept:'audio/mpeg'},body:JSON.stringify({text:taggedText,model_id:modelId,...(languageCode?{language_code:languageCode}:{}),voice_settings:{stability,similarity_boost:similarity,style,use_speaker_boost:true,speed}}),cache:'no-store'});
    if(!upstream.ok){await refund();const details=await upstream.json().catch(()=>({}));const message=upstream.status===401||upstream.status===403?'The voice provider rejected its API key or permissions.':upstream.status===429?'Provider rate limit reached. Please wait a moment and try again.':details.detail?.message||'The voice provider could not generate this audio.';return NextResponse.json({error:message},{status:upstream.status===429?429:502})}
    if(!upstream.body){await refund();return NextResponse.json({error:'The provider returned no audio stream.'},{status:502})}
    await supabase.from('generations').insert({user_id:user.id,voice_id:voiceId,text,emotion,model_id:modelId,character_count:text.length,duration_ms:Date.now()-started,format:'mp3'});
    // Pass the provider's audio stream through directly; do not buffer the full clip in server memory.
    return new Response(upstream.body,{headers:{'Content-Type':'audio/mpeg','Content-Disposition':`inline; filename="nelovelabs-${Date.now()}.mp3"`,'Cache-Control':'no-store','X-Characters-Charged':String(credits)}});
  }catch{await refund();return NextResponse.json({error:'Generation failed due to a network or provider error. No audio was created.'},{status:502})}
}
