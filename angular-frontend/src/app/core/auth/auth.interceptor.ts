import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { from, switchMap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const msalService = inject(MsalService);

  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const accounts = msalService.instance.getAllAccounts();
  if (accounts.length === 0) {
    return next(req);
  }

  const tokenRequest = {
    scopes: [`api://${environment.clientId}/access_as_user`],
    account: accounts[0],
  };

  return from(msalService.instance.acquireTokenSilent(tokenRequest)).pipe(
    switchMap((result) => {
      const cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${result.accessToken}`,
        },
      });
      return next(cloned);
    }),
    catchError(() => {
      return next(req);
    })
  );
};
