import React from 'react';
import './globals.css';
import { MsalProviderWrapper } from '../components/MsalProviderWrapper';

export const metadata = {
  title: 'Subscriber Management Portal',
  description: 'Centralized subscriber & list management platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </head>
      <body>
        <MsalProviderWrapper>{children}</MsalProviderWrapper>
      </body>
    </html>
  );
}
