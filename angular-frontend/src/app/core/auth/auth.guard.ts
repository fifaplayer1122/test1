import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    authService.login();
    return false;
  }
  if (!authService.isAllowed()) {
    router.navigate(['/unauthorized']);
    return false;
  }
  return true;
};

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    authService.login();
    return false;
  }
  if (!authService.isAllowed()) {
    router.navigate(['/unauthorized']);
    return false;
  }
  if (!authService.isAdmin()) {
    router.navigate(['/team-updates']);
    return false;
  }
  return true;
};
