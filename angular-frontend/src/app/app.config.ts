import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { BrowserModule } from '@angular/platform-browser';
import {
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
  MsalBroadcastService,
  MsalGuard,
  MsalService,
} from '@azure/msal-angular';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import {
  msalInstance,
  msalGuardConfig,
  msalInterceptorConfig,
} from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(BrowserModule),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    {
      provide: MSAL_INSTANCE,
      useValue: msalInstance,
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useValue: msalGuardConfig,
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useValue: msalInterceptorConfig,
    },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
  ],
};
