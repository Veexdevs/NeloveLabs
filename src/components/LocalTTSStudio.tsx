'use client';

import { useEffect, useMemo, useState } from 'react';
import { AudioLines, Cpu, Download, Languages, LoaderCircle, Play, Sparkles, Volume2 } from 'lucide-react';
import { Mp3Encoder } from '@breezystack/lamejs';
import { phonemizePtBr } from '@/lib/pt-br-phonemes';

const KOKORO_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';
type VoiceChoice = { id:string; name:string; kind:'kokoro'; hint:string };
const voices: Record<string,VoiceChoice[]> = {
  'pt-BR': [
    { id:'pf_dora',name:'Dora',kind:'kokoro',hint:'Feminina · Português brasileiro · Kokoro local' },
    { id:'pm_alex',name:'Alex',kind:'kokoro',hint:'Masculina · Português brasileiro · Kokoro local' },
    { id:'pm_santa',name:'Santa',kind:'kokoro',hint:'Masculina · Português brasileiro · Kokoro local' },
  ],
  'en-US': [
    { id:'af_heart',name:'Heart',kind:'kokoro',hint:'Feminina · American English' },
    { id:'af_bella',name:'Bella',kind:'kokoro',hint:'Feminina · American English' },
    { id:'am_michael',name:'Michael',kind:'kokoro',hint:'Masculina · American English' },
    { id:'am_fenrir',name:'Fenrir',kind:'kokoro',hint:'Masculina · American English' },
  ],
  'en-GB': [
    { id:'bf_emma',name:'Emma',kind:'kokoro',hint:'Feminina · British English' },
    { id:'bf_isabella',name:'Isabella',kind:'kokoro',hint:'Feminina · British English' },
    { id:'bm_george',name:'George',kind:'kokoro',hint:'Masculina · British English' },
    { id:'bm_fable',name:'Fable',kind:'kokoro',hint:'Masculina · British English' },
  ],
};
let kokoroPromise: Promise<any> | null = null;
let kokoroEngine: any = null;
function modelName(){ return 'Kokoro · 82M'; }
function formatProgress(p:any){
  const name=String(p?.file||p?.name||p?.status||'Baixando modelo');
  const percent=typeof p?.progress==='number'?Math.max(0,Math.min(100,Math.round(p.progress))):null;
  return {name,percent};
}
async function loadModel(onProgress:(message:string,pct:number|null)=>void){
  if(kokoroEngine)return kokoroEngine;
  if(kokoroPromise)return kokoroPromise;
  const loader=(async()=>{
    onProgress('Carregando runtime de IA no navegador…',null);
    const hf=await import('@huggingface/transformers');
    hf.env.allowLocalModels=false;
    hf.env.useBrowserCache=true;
    const progress=(p:any)=>{const x=formatProgress(p);onProgress(x.name,x.percent)};
    const pkg=await import('kokoro-js');
    const engine=await pkg.KokoroTTS.from_pretrained(KOKORO_ID,{dtype:'q8',device:'wasm',progress_callback:progress});
    kokoroEngine=engine;return engine;
  })();
  kokoroPromise=loader;
  try{return await loader}catch(error){kokoroPromise=null;throw error}
}
function asInt16(samples:Float32Array){const result=new Int16Array(samples.length);for(let i=0;i<samples.length;i++){const x=Math.max(-1,Math.min(1,samples[i]));result[i]=x<0?x*32768:x*32767}return result}
function makeMp3(samples:Float32Array,sampleRate:number){const encoder=new Mp3Encoder(1,sampleRate,128);const input=asInt16(samples);const chunks:Uint8Array[]=[];for(let i=0;i<input.length;i+=1152){const part=encoder.encodeBuffer(input.subarray(i,Math.min(i+1152,input.length)));if(part.length)chunks.push(part)}const final=encoder.flush();if(final.length)chunks.push(final);return new Blob(chunks.map(chunk=>chunk.slice().buffer as ArrayBuffer),{type:'audio/mpeg'})}
function makeWav(samples:Float32Array,sampleRate:number){const buffer=new ArrayBuffer(44+samples.length*2),view=new DataView(buffer);const write=(offset:number,value:string)=>{for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i))};write(0,'RIFF');view.setUint32(4,36+samples.length*2,true);write(8,'WAVE');write(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);write(36,'data');view.setUint32(40,samples.length*2,true);for(let i=0;i<samples.length;i++){const x=Math.max(-1,Math.min(1,samples[i]));view.setInt16(44+i*2,x<0?x*32768:x*32767,true)}return new Blob([buffer],{type:'audio/wav'})}
function saveBlob(blob:Blob,filename:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1500)}

export default function LocalTTSStudio(){
  const [language,setLanguage]=useState('pt-BR');
  const choices=voices[language];
  const [voice,setVoice]=useState(choices[0].id);
  const [text,setText]=useState('Olá! Que bom ter você por aqui. Hoje, uma ideia simples pode se transformar em algo extraordinário.');
  const [speed,setSpeed]=useState(1);
  const [busy,setBusy]=useState(false);
  const [progress,setProgress]=useState(0);
  const [stage,setStage]=useState('');
  const [error,setError]=useState('');
  const [audioUrl,setAudioUrl]=useState('');
  const [audioBlob,setAudioBlob]=useState<Blob|null>(null);
  const [audioInfo,setAudioInfo]=useState<{name:string;engine:string;sampleRate:number}|null>(null);
  const [wasmSupported,setWasmSupported]=useState(true);
  useEffect(()=>{setWasmSupported(typeof WebAssembly!=='undefined');const params=new URLSearchParams(window.location.search);const requestedLanguage=params.get('language');const requestedVoice=params.get('voice');if(requestedLanguage&&voices[requestedLanguage]){setLanguage(requestedLanguage);const match=voices[requestedLanguage].find(item=>item.id===requestedVoice);setVoice(match?.id||voices[requestedLanguage][0].id)}},[]);
  const selected=useMemo(()=>choices.find(v=>v.id===voice)||choices[0],[choices,voice]);
  function setLanguageAndVoice(lang:string){setLanguage(lang);setVoice(voices[lang][0].id);setError('');setAudioUrl('');setAudioBlob(null);setAudioInfo(null)}
  async function generate(){
    setError('');
    if(!text.trim()){setError('Digite um texto antes de gerar.');return}
    if(text.length>1500){setError('Limite deste modelo: 1.500 caracteres por geração.');return}
    if(!wasmSupported){setError('Este navegador não suporta WebAssembly, necessário para a síntese local.');return}
    setBusy(true);setProgress(0);setStage('Preparando modelo local…');
    try{
      const engine=await loadModel((message,pct)=>{setStage(message);if(pct!==null)setProgress(pct)});
      setStage('Gerando fala no seu dispositivo…');setProgress(100);
      let result:any;
      if(language==='pt-BR'){
        const phonemes=phonemizePtBr(text);
        const {input_ids}=engine.tokenizer(phonemes,{truncation:true});
        result=await engine.generate_from_ids(input_ids,{voice:selected.id as any,speed});
      }else result=await engine.generate(text,{voice:selected.id as any,speed});
      const wav:Blob=result.toBlob();
      const sampleRate:number=result.sampling_rate||24000;
      const samples:Float32Array=result.audio;
      if(!samples?.length||!wav.size)throw new Error('O modelo não retornou áudio. Tente novamente com um texto mais curto.');
      const mp3=makeMp3(samples,sampleRate);
      const chosenBlob=wav;
      setAudioBlob(chosenBlob);
      const nextUrl=URL.createObjectURL(chosenBlob);
      setAudioUrl(nextUrl);
      const record={id:crypto.randomUUID(),text,voice_id:selected.name,voice_name:selected.name,emotion:'Neural local',language,engine:modelName(),character_count:text.length,created_at:new Date().toISOString()};
      try{const old=JSON.parse(localStorage.getItem('nelove-local-history')||'[]');localStorage.setItem('nelove-local-history',JSON.stringify([record,...old].slice(0,50)))}catch{}
      setAudioInfo({name:selected.name,engine:modelName(),sampleRate});
      // MP3 is encoded on-device, no audio leaves the browser.
      (window as any).__neloveMp3=mp3;
    }catch(err:any){
      const message=String(err?.message||err||'Falha no modelo local.');
      setError(message.includes('fetch')||message.includes('network')?'Não consegui baixar o modelo aberto. Verifique sua conexão e tente novamente. Nenhuma API de voz foi chamada.':message);
    }finally{setBusy(false);setStage('')}
  }
  function downloadMp3(){const mp3=(window as any).__neloveMp3 as Blob|undefined;if(mp3)saveBlob(mp3,'nelovelabs-voice.mp3')}
  return <>
    <div className="page-header"><div><div className="eyebrow">VOICE STUDIO · SEM API</div><h1 className="page-title">Sua voz, gerada no dispositivo.</h1><p className="page-subtitle">Síntese neural aberta executada no seu navegador. O texto e o áudio não são enviados a um provedor de voz.</p></div><div className="tag" style={{display:'flex',alignItems:'center',gap:7,padding:'8px 10px'}}><span className="live-dot" style={{width:5,height:5}}/> MODELO LOCAL</div></div>
    {!wasmSupported&&<div className="notice">Este navegador não tem suporte a WebAssembly. Abra a plataforma em uma versão recente do Chrome, Edge, Firefox ou Safari.</div>}
    <div className="notice" style={{borderColor:'#243e63',background:'#101a2b',color:'#b9cbe7'}}><b>Como funciona:</b> no primeiro uso, o navegador baixa os pesos do modelo aberto e guarda-os em cache. A inferência é local, sem chave nem chamada a API de síntese. Kokoro oferece vozes em inglês e português; o adaptador PT-BR ainda precisa de validação nativa para avaliar pronúncia e sotaque. Esses modelos não são equivalentes à qualidade proprietária da ElevenLabs.</div>
    <div className="studio-layout"><div>
      <section className="panel studio-editor"><div className="editor-top"><span>Texto para falar</span><span>{text.length.toLocaleString()} / 1.500 caracteres</span></div><textarea className="text-area" maxLength={1500} value={text} onChange={e=>setText(e.target.value)} placeholder="Escreva algo que mereça ser ouvido…"/><div className="editor-bottom"><div className="toolbar"><Languages size={13}/><span>Use pontuação e parágrafos para orientar a prosódia do modelo</span></div><span>~{Math.max(1,Math.ceil(text.trim().split(/\s+/).filter(Boolean).length/140))} min</span></div></section>
      <section className="panel result-panel"><div className="result-header"><div className="section-title" style={{margin:0,display:'flex',alignItems:'center',gap:8}}><AudioLines size={15}/> Áudio gerado{audioInfo&&<span className="success-note">· pronto</span>}</div>{audioBlob&&<div style={{display:'flex',gap:6}}><button className="btn" onClick={downloadMp3}><Download/>MP3</button><button className="btn" onClick={()=>saveBlob(audioBlob,'nelovelabs-voice.wav')}><Download/>WAV</button></div>}</div>{audioUrl?<><audio className="audio-player" src={audioUrl} controls/><div style={{fontSize:10,color:'#747a87',marginTop:9}}>{audioInfo?.name} · {audioInfo?.engine} · {audioInfo?.sampleRate.toLocaleString()} Hz · gerado localmente</div></>:<div style={{fontSize:11,color:'#777d89',padding:'9px 0'}}>Gere uma fala para ouvir e baixar o áudio de verdade — sem amostras pré-gravadas.</div>}{error&&<div className="error-box">{error}</div>}</section>
    </div><section className="panel control-panel"><div className="section-title" style={{display:'flex',alignItems:'center',gap:8}}><Cpu size={15}/> Motor neural local</div><div className="select-wrap"><div className="field-label"><span>Idioma</span></div><select className="select-input" value={language} onChange={e=>setLanguageAndVoice(e.target.value)}><option value="pt-BR">🇧🇷 Português</option><option value="en-US">🇺🇸 English (US)</option><option value="en-GB">🇬🇧 English (UK)</option></select></div><div className="select-wrap"><div className="field-label"><span>Voz</span></div><select className="select-input" value={voice} onChange={e=>setVoice(e.target.value)}>{choices.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select><div style={{fontSize:9,color:'#78808e',marginTop:6,lineHeight:1.5}}>{selected.hint}</div></div><div className="range-row"><div className="range-head"><span>Velocidade</span><strong>{speed.toFixed(2)}×</strong></div><input aria-label="Velocidade" className="range" type="range" min="0.75" max="1.2" step="0.01" value={speed} onChange={e=>setSpeed(Number(e.target.value))}/></div><div className="notice" style={{padding:11,fontSize:10,marginBottom:14}}><b>Sem simulação de emoção:</b> este modelo não aceita controles de emoção. As inflexões vêm do texto, da pontuação e da prosódia aprendida.</div><button className="btn btn-primary studio-generate" onClick={generate} disabled={busy||!text.trim()}>{busy?<><LoaderCircle size={15} className="spin-icon"/> {stage||'Gerando no dispositivo…'}</>:<><Sparkles size={15}/>Gerar voz localmente</>}</button>{busy&&<div style={{marginTop:11}}><div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'#858b98',marginBottom:6}}><span>{stage||'Carregando modelo'}</span>{progress>0&&<span>{progress}%</span>}</div><div className="credit-bar" style={{margin:'0',height:4}}><i style={{width:`${progress||8}%`,transition:'width .3s'}}/></div></div>}<p className="provider-note">Na primeira execução, baixe o modelo aberto (pode levar um momento). Depois, ele fica em cache no navegador.</p></section></div>
    <style jsx>{`.spin-icon{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </>;
}
