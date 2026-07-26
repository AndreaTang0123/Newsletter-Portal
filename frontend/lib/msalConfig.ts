import { Configuration } from '@azure/msal-browser';

const CLIENT_ID = process.env.NEXT_PUBLIC_MSAL_CLIENT_ID || '';
const TENANT_ID = process.env.NEXT_PUBLIC_MSAL_TENANT_ID || '';
const API_SCOPE = process.env.NEXT_PUBLIC_API_SCOPE || '';

export const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : undefined,
    postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : undefined,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
};

export const apiScopeRequest = {
  scopes: [API_SCOPE],
};
