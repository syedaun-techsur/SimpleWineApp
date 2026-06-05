import type { Metadata } from 'next';
import { Montserrat, Open_Sans } from 'next/font/google';
import './globals.css';
import { NavBar } from './components/NavBar';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['900'],
  variable: '--font-montserrat',
  display: 'swap',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-opensans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SimpleWineApp',
  description: 'Your personal wine cellar',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${openSans.variable}`}>
      <body>
        <NavBar />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
