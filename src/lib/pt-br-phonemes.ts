// Lightweight Brazilian Portuguese grapheme-to-phoneme adapter for Kokoro's Portuguese voice packs.
// Neural synthesis/prosody stays in Kokoro; this only maps common PT-BR spelling patterns to IPA.
const vowels = /[aeiouáàâãéêíóôõú]/i;
function isMarkedVowel(char:string){return /[áàâãéêíóôõú]/i.test(char)}
function wordToIpa(input:string){
  let w=input.toLocaleLowerCase('pt-BR').replace(/qu(?=[eéií])/g,'k').replace(/gu(?=[eéií])/g,'g');
  w=w.replace(/ões?$/g,m=>m==='ões'?'õj̃s':'õj̃').replace(/ães?$/g,m=>m==='ães'?'ɐ̃j̃s':'ɐ̃j̃').replace(/ão/g,'ɐ̃w̃').replace(/ãe/g,'ɐ̃j̃').replace(/õe/g,'õj̃').replace(/am$/g,'ɐ̃w̃').replace(/em$/g,'ẽj̃').replace(/ens$/g,'ẽj̃s');
  const digraphs:Record<string,string>={nh:'ɲ',lh:'ʎ',ch:'ʃ',rr:'ʁ',ss:'s',sc:'s',xc:'s'};
  let chunks:string[]=[];
  for(let i=0;i<w.length;){
    const pair=w.slice(i,i+2);
    if(digraphs[pair]){chunks.push(digraphs[pair]);i+=2;continue}
    const c=w[i];const next=w[i+1]||'';const prev=w[i-1]||'';
    if(c==='m'||c==='n'){
      if(i===w.length-1||(!vowels.test(next)&&next!=='h')){for(let k=chunks.length-1;k>=0;k--){if(/[aeiouɛɔɐ]/.test(chunks[k])){if(!chunks[k].includes('̃'))chunks[k]+='̃';break}}i++;continue}
    }
    let out=c;
    if(c==='á'||c==='à')out='a';else if(c==='â')out='ɐ';else if(c==='ã')out='ɐ̃';else if(c==='é')out='ɛ';else if(c==='ê')out='e';else if(c==='í')out='i';else if(c==='ó')out='ɔ';else if(c==='ô')out='o';else if(c==='õ')out='õ';else if(c==='ú')out='u';
    else if(c==='ç')out='s';else if(c==='c')out=/[eiéêí]/.test(next)?'s':'k';else if(c==='g')out=/[eiéêí]/.test(next)?'ʒ':'g';else if(c==='j')out='ʒ';else if(c==='x')out='ʃ';else if(c==='h')out='';else if(c==='r')out=(i===0||prev==='n'||prev==='l'||prev==='s')?'ʁ':'ɾ';else if(c==='s')out=(vowels.test(prev)&&vowels.test(next))?'z':'s';else if(c==='z'&&i===w.length-1)out='s';else if((c==='d'||c==='t')&&next==='i')out=c==='d'?'dʒ':'tʃ';
    else if(c==='e'&&i===w.length-1)out='i';else if(c==='o'&&i===w.length-1)out='u';
    chunks.push(out);i++;
  }
  let ipa=chunks.join('');
  // Keep common punctuation in the phoneme stream; Kokoro's tokenizer handles its prosody tokens.
  const stressIndex=Array.from(input).findIndex(isMarkedVowel);
  if(stressIndex>=0){const marked=input.slice(stressIndex).toLocaleLowerCase('pt-BR').match(/[áàâãéêíóôõú]/);if(marked){const target=({á:'a',à:'a',â:'ɐ',ã:'ɐ̃',é:'ɛ',ê:'e',í:'i',ó:'ɔ',ô:'o',õ:'õ',ú:'u'} as Record<string,string>)[marked[0]];const idx=ipa.indexOf(target);if(idx>=0)ipa=ipa.slice(0,idx)+'ˈ'+ipa.slice(idx)}}
  return ipa||input;
}
export function phonemizePtBr(text:string){
  return text.replace(/[A-Za-zÀ-ÖØ-öø-ÿ]+(?:-[A-Za-zÀ-ÖØ-öø-ÿ]+)*/g,wordToIpa);
}
