import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';

// ── Replace CLIENT_ID after creating your Azure App Registration ──
export const CLIENT_ID = import.meta.env.VITE_AZURE_CLIENT_ID || 'YOUR_CLIENT_ID';

const ALLOWED_EMAILS = [
  'pranesh.ganesh@smartdocs.ai',
  'ravi.shankar@smartdocs.ai',
];

const msalConfig = {
  auth: {
    clientId: CLIENT_ID,
    authority: 'https://login.microsoftonline.com/common',
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
  return ALLOWED_EMAILS.includes(email);
}

export function getAccount() {
  return msalInstance.getAllAccounts()[0] || null;
}
