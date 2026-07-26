'use client';

import React, { useEffect, useState } from 'react';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from '../lib/msalInstance';

export function MsalProviderWrapper({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);

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
      });
  }, []);

  if (!initialized) {
    return null;
  }

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}
