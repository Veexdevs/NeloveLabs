import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'NeloveLabs — Human Voice Platform', description: 'Create natural, expressive and lifelike voices with NeloveLabs.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
