import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata = {
  title: 'Riceshare',
  description: 'Linux rice gallery & one-click installer',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}