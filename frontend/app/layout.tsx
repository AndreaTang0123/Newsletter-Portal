import React from 'react';
import './globals.css';

export const metadata = {
  title: 'PortalAI - Email Newsletter Portal',
  description: 'AI-powered email newsletter administration dashboard.',
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
        {children}
      </body>
    </html>
  );
}
