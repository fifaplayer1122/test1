import { Injectable, inject } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';

const ADMIN_PREFIXES = ['ravi', 'pranesh'];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private msalService = inject(MsalService);

  getAccount(): AccountInfo | null {
    const accounts = this.msalService.instance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  }

  getUser(): { name: string; email: string; azureId: string } | null {
    const account = this.getAccount();
    if (!account) return null;
    return {
      name: account.name ?? account.username,
      email: account.username,
      azureId: account.localAccountId,
    };
  }

  isAdmin(): boolean {
    const user = this.getUser();
    if (!user) return false;
    const firstName = user.email.split('@')[0].toLowerCase();
    return ADMIN_PREFIXES.some((prefix) => firstName.startsWith(prefix));
  }

  isAllowed(): boolean {
    const user = this.getUser();
    if (!user) return false;
    return user.email.toLowerCase().endsWith('@smartdocs.ai');
  }

  login(): void {
    this.msalService.loginRedirect({
      scopes: [],
    });
  }

  logout(): void {
    this.msalService.logoutRedirect({
      postLogoutRedirectUri: window.location.origin,
    });
  }

  isLoggedIn(): boolean {
    return this.msalService.instance.getAllAccounts().length > 0;
  }
}
