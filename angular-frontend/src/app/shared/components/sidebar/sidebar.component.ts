import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule, MatDividerModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  authService = inject(AuthService);

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  adminNavItems = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/tasks', icon: 'task_alt', label: 'Active Tasks' },
    { path: '/done-tasks', icon: 'check_circle', label: 'Done Tasks' },
    { path: '/skipped-tasks', icon: 'skip_next', label: 'Skipped Tasks' },
    { path: '/members', icon: 'group', label: 'Members & Roles' },
  ];

  memberNavItems = [
    { path: '/team-updates', icon: 'feed', label: 'Team Updates' },
    { path: '/team-priorities', icon: 'priority_high', label: 'Team Priorities' },
    { path: '/weekend-availability', icon: 'event', label: 'Weekend Availability' },
    { path: '/approvals', icon: 'approval', label: 'Approval Requests' },
  ];
}
