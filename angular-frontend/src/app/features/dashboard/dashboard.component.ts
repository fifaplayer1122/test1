import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TasksService } from '../../core/services/tasks.service';
import { ApprovalsService } from '../../core/services/approvals.service';
import { Task } from '../../core/models/task.model';
import { ApprovalRequest } from '../../core/models/approval.model';
import { AuthService } from '../../core/auth/auth.service';
import { PriorityBadgeComponent } from '../../shared/components/priority-badge/priority-badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatChipsModule,
    RouterModule,
    PriorityBadgeComponent,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private tasksService = inject(TasksService);
  private approvalsService = inject(ApprovalsService);
  authService = inject(AuthService);

  loading = true;
  allTasks: Task[] = [];
  approvals: ApprovalRequest[] = [];

  get activeTasks(): Task[] {
    return this.allTasks.filter((t) => t.status === 'todo');
  }

  get doneTasks(): Task[] {
    return this.allTasks.filter((t) => t.status === 'done');
  }

  get skippedTasks(): Task[] {
    return this.allTasks.filter((t) => t.status === 'skipped');
  }

  get pendingApprovals(): ApprovalRequest[] {
    return this.approvals.filter((a) => a.status === 'pending');
  }

  get urgentTasks(): Task[] {
    return this.activeTasks.filter((t) => t.priority === 'very_high');
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    if (!this.isAdmin) return;

    forkJoin({
      tasks: this.tasksService.getAll(),
      approvals: this.approvalsService.getAll(),
    }).subscribe({
      next: ({ tasks, approvals }) => {
        this.allTasks = tasks;
        this.approvals = approvals;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
