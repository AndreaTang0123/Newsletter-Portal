'use client';

import React, { useEffect, useState } from 'react';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from '../lib/msalInstance';

export function MsalProviderWrapper({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    msalInstance
      .initialize()
      .then(() => msalInstance.handleRedirectPromise())
      .then((response) => {
        if (response?.account) {
          msalInstance.setActiveAccount(response.account);
        } else if (!msalInstance.getActiveAccount()) {
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) {
            msalInstance.setActiveAccount(accounts[0]);
          }
        }
        setInitialized(true);
      })
      .catch((error) => {
        console.error('MSAL initialization failed:', error);
        setInitError(error?.message || 'Failed to initialize sign-in.');
        setInitialized(true);
      });
  }, []);

  if (!initialized) {
    return null;
  }

  if (initError) {
    return (
      <div style={{ padding: '48px', fontFamily: 'sans-serif', color: '#ef4444' }}>
        <h2>Sign-in failed to initialize</h2>
        <p>{initError}</p>
      </div>
    );
  }

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}
