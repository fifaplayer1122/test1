import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AuthService } from './core/auth/auth.service';
import { MembersService } from './core/services/members.service';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    SidebarComponent,
  ],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  private msalService = inject(MsalService);
  private msalBroadcastService = inject(MsalBroadcastService);
  private membersService = inject(MembersService);
  authService = inject(AuthService);
  private router = inject(Router);

  isIframe = false;
  loginDisplay = false;
  pageTitle = 'SmartDocs Command Center';
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.isIframe = window !== window.parent && !window.opener;

    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status) => status === InteractionStatus.None),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.loginDisplay = this.authService.isLoggedIn();
        if (this.loginDisplay && !this.authService.isAdmin()) {
          this.autoRegisterIfNeeded();
        }
      });

    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.updateTitle();
      });
  }

  private updateTitle(): void {
    const url = this.router.url;
    const map: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/tasks': 'Active Tasks',
      '/done-tasks': 'Done Tasks',
      '/skipped-tasks': 'Skipped Tasks',
      '/members': 'Members & Roles',
      '/team-updates': 'Team Updates',
      '/team-priorities': 'Team Priorities',
      '/weekend-availability': 'Weekend Availability',
      '/approvals': 'Approval Requests',
    };
    this.pageTitle = map[url] ?? 'SmartDocs Command Center';
  }

  private autoRegisterIfNeeded(): void {
    const user = this.authService.getUser();
    if (!user) return;

    this.membersService.getAll().subscribe({
      next: (members) => {
        const found = members.find(
          (m) => m.email.toLowerCase() === user.email.toLowerCase()
        );
        if (!found) {
          this.membersService
            .autoRegister(user.name, user.email, user.azureId)
            .subscribe({ error: (e) => console.error('Auto-register failed', e) });
        }
      },
      error: (e) => console.error('Members fetch failed', e),
    });
  }

  get userName(): string {
    return this.authService.getUser()?.name ?? 'User';
  }

  get userEmail(): string {
    return this.authService.getUser()?.email ?? '';
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
