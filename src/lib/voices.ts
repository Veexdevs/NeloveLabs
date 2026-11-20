export type Voice = { id: string; name: string; language: string; accent: string; gender: string; age: string; description: string; labels: string[]; category: string; emotions: string[]; color: string; provider: 'elevenlabs'; };

// These are provider voice IDs, not synthetic demos. Actual previews are fetched from the provider.
// Replace/extend this seed catalogue with voice IDs from your licensed ElevenLabs account.
export const voices: Voice[] = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Matilda', language: 'English', accent: 'American', gender: 'Feminine', age: 'Young adult', description: 'Warm, articulate and naturally expressive.', labels: ['Warm', 'Narration'], category: 'Narrators', emotions: ['Natural','Happy','Calm','Confident','Dramatic'], color: '#c7a7ff', provider: 'elevenlabs' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', language: 'English', accent: 'American', gender: 'Masculine', age: 'Adult', description: 'Deep, grounded and conversational.', labels: ['Deep', 'Conversational'], category: 'Conversational', emotions: ['Natural','Serious','Confident','Mysterious'], color: '#80aaff', provider: 'elevenlabs' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', language: 'English', accent: 'American', gender: 'Feminine', age: 'Young adult', description: 'Clear, calm and effortlessly human.', labels: ['Clear', 'Calm'], category: 'Professional', emotions: ['Natural','Happy','Sad','Calm','Whispering'], color: '#ffb6a3', provider: 'elevenlabs' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', language: 'English', accent: 'American', gender: 'Masculine', age: 'Young adult', description: 'Easygoing, bright and contemporary.', labels: ['Bright', 'Youthful'], category: 'Young', emotions: ['Natural','Happy','Excited','Nervous'], color: '#90ddc2', provider: 'elevenlabs' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', language: 'English', accent: 'British', gender: 'Masculine', age: 'Mature', description: 'Measured, rich and unmistakably British.', labels: ['British', 'Mature'], category: 'Mature', emotions: ['Natural','Serious','Calm','Dramatic'], color: '#ffc979', provider: 'elevenlabs' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', language: 'English', accent: 'British', gender: 'Feminine', age: 'Adult', description: 'Elegant, intimate and softly confident.', labels: ['Elegant', 'British'], category: 'Cinematic', emotions: ['Natural','Sad','Calm','Mysterious'], color: '#f2a6cd', provider: 'elevenlabs' },
  { id: 'AZnzlk1XvdvUeBnXml', name: 'Domi', language: 'English', accent: 'American', gender: 'Feminine', age: 'Young adult', description: 'Strong, vivid and full of character.', labels: ['Expressive', 'Bold'], category: 'Cinematic', emotions: ['Natural','Happy','Excited','Dramatic'], color: '#a8c2ff', provider: 'elevenlabs' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', language: 'English', accent: 'American', gender: 'Masculine', age: 'Adult', description: 'Smooth, versatile and engaging.', labels: ['Smooth', 'Professional'], category: 'Professional', emotions: ['Natural','Confident','Serious','Calm'], color: '#ffc4a7', provider: 'elevenlabs' },
];

export const languages = [
  { label: 'Português (Brasil)', flag: '🇧🇷', model: 'Multilingual v2' }, { label: 'Português (Portugal)', flag: '🇵🇹', model: 'Multilingual v2' },
  { label: 'English (US)', flag: '🇺🇸', model: 'Multilingual v2' }, { label: 'English (UK)', flag: '🇬🇧', model: 'Multilingual v2' },
  { label: 'Español', flag: '🇪🇸', model: 'Multilingual v2' }, { label: 'Français', flag: '🇫🇷', model: 'Multilingual v2' },
  { label: 'Deutsch', flag: '🇩🇪', model: 'Multilingual v2' }, { label: 'Italiano', flag: '🇮🇹', model: 'Multilingual v2' },
  { label: '日本語', flag: '🇯🇵', model: 'Multilingual v2' }, { label: '한국어', flag: '🇰🇷', model: 'Multilingual v2' },
  { label: '中文', flag: '🇨🇳', model: 'Multilingual v2' },
];
export const emotions = ['Natural','Happy','Sad','Serious','Excited','Calm','Scared','Nervous','Confident','Mysterious','Dramatic','Whispering'];
