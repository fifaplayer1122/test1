import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { authGuard, adminGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    canActivate: [MsalGuard, adminGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'tasks',
    canActivate: [MsalGuard, adminGuard],
    loadComponent: () =>
      import('./features/tasks/task-list.component').then((m) => m.TaskListComponent),
    data: { status: 'todo', title: 'Active Tasks' },
  },
  {
    path: 'done-tasks',
    canActivate: [MsalGuard, adminGuard],
    loadComponent: () =>
      import('./features/tasks/task-list.component').then((m) => m.TaskListComponent),
    data: { status: 'done', title: 'Done Tasks' },
  },
  {
    path: 'skipped-tasks',
    canActivate: [MsalGuard, adminGuard],
    loadComponent: () =>
      import('./features/tasks/task-list.component').then((m) => m.TaskListComponent),
    data: { status: 'skipped', title: 'Skipped Tasks' },
  },
  {
    path: 'members',
    canActivate: [MsalGuard, adminGuard],
    loadComponent: () =>
      import('./features/members/members.component').then((m) => m.MembersComponent),
  },
  {
    path: 'team-updates',
    canActivate: [MsalGuard, authGuard],
    loadComponent: () =>
      import('./features/updates/updates.component').then((m) => m.UpdatesComponent),
  },
  {
    path: 'team-priorities',
    canActivate: [MsalGuard, authGuard],
    loadComponent: () =>
      import('./features/priorities/priorities.component').then((m) => m.PrioritiesComponent),
  },
  {
    path: 'weekend-availability',
    canActivate: [MsalGuard, authGuard],
    loadComponent: () =>
      import('./features/weekend/weekend.component').then((m) => m.WeekendComponent),
  },
  {
    path: 'approvals',
    canActivate: [MsalGuard, authGuard],
    loadComponent: () =>
      import('./features/approvals/approvals.component').then((m) => m.ApprovalsComponent),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
