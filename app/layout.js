import { ClerkProvider } from '@clerk/nextjs';
import Script from 'next/script';
import './globals.css';

export const metadata = {
  title: 'Riceshare',
  description: 'Linux rice gallery & one-click installer',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          {children}
        </ClerkProvider>
        <Script
          src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js"
          data-name="bmc-button"
          data-slug="riceshare"
          data-color="#FFDD00"
          data-emoji=""
          data-font="Poppins"
          data-text="Fuel our code with a coffee"
          data-outline-color="#000000"
          data-font-color="#000000"
          data-coffee-color="#ffffff"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}