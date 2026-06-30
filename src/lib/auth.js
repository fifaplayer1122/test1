import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';

// ── Replace CLIENT_ID after creating your Azure App Registration ──
export const CLIENT_ID = import.meta.env.VITE_AZURE_CLIENT_ID || 'c19c1c40-a27a-43f5-83c7-5c49e376da10';
export const TENANT_ID = import.meta.env.VITE_AZURE_TENANT_ID || '7c8ac43a-970e-4d46-ba45-c5894dd3fe09';

const ALLOWED_DOMAIN = 'smartdocs.ai';

const msalConfig = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: window.location.origin,
  },
  cache: { cacheLocation: 'localStorage', storeAuthStateInCookie: false },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export async function initMsal() {
  await msalInstance.initialize();
  const result = await msalInstance.handleRedirectPromise();
  if (result) return result.account;
  const accounts = msalInstance.getAllAccounts();
  return accounts[0] || null;
}

export async function login() {
  await msalInstance.loginRedirect({
    scopes: ['openid', 'profile', 'email', 'User.Read'],
    prompt: 'select_account',
  });
}

export function logout() {
  const account = msalInstance.getAllAccounts()[0];
  msalInstance.logoutRedirect({ account });
}

export function isAllowed(account) {
  if (!account) return false;
  const email = (account.username || '').toLowerCase();
  return email.endsWith('@' + ALLOWED_DOMAIN);
}

export function getAccount() {
  return msalInstance.getAllAccounts()[0] || null;
}
