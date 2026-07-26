import { AccountInfo, AuthenticationResult, EventType, PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './msalConfig';

export const msalInstance = new PublicClientApplication(msalConfig);

msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
    const account = (event.payload as AuthenticationResult).account as AccountInfo | null;
    if (account) {
      msalInstance.setActiveAccount(account);
    }
  }
});
