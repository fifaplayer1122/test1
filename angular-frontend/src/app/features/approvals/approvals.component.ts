import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApprovalsService } from '../../core/services/approvals.service';
import { AuthService } from '../../core/auth/auth.service';
import { ApprovalRequest, ApprovalStatus } from '../../core/models/approval.model';
import { ApprovalFormDialogComponent } from './approval-form-dialog/approval-form-dialog.component';
import { ApprovalDecideDialogComponent } from './approval-decide-dialog/approval-decide-dialog.component';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './approvals.component.html',
})
export class ApprovalsComponent implements OnInit {
  private approvalsService = inject(ApprovalsService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = true;
  allApprovals: ApprovalRequest[] = [];
  activeFilter: ApprovalStatus | 'all' = 'pending';

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get myEmail(): string {
    return this.authService.getUser()?.email ?? '';
  }

  get displayedColumns(): string[] {
    const base = ['requester', 'title', 'category', 'cost', 'priority', 'status'];
    if (this.isAdmin) return [...base, 'actions'];
    return base;
  }

  get filteredApprovals(): ApprovalRequest[] {
    if (!this.isAdmin) return this.allApprovals;
    if (this.activeFilter === 'all') return this.allApprovals;
    return this.allApprovals.filter((a) => a.status === this.activeFilter);
  }

  get pendingCount(): number {
    return this.allApprovals.filter((a) => a.status === 'pending').length;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    const obs = this.isAdmin
      ? this.approvalsService.getAll()
      : this.approvalsService.getMine();

    obs.subscribe({
      next: (approvals) => {
        this.allApprovals = approvals.sort(
          (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
        );
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  openSubmitDialog(): void {
    const ref = this.dialog.open(ApprovalFormDialogComponent, { width: '520px' });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.approvalsService.create(result).subscribe({
        next: () => {
          this.snackBar.open('Request submitted', 'OK', { duration: 3000 });
          this.load();
        },
      });
    });
  }

  openDecideDialog(approval: ApprovalRequest, action: 'approved' | 'rejected'): void {
    const ref = this.dialog.open(ApprovalDecideDialogComponent, {
      width: '480px',
      data: { approval, action },
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.approvalsService.decide(approval.id, result).subscribe({
        next: () => {
          this.snackBar.open(`Request ${action}`, 'OK', { duration: 3000 });
          this.load();
        },
      });
    });
  }

  statusClass(status: ApprovalStatus): string {
    if (status === 'approved') return 'text-green-600 font-semibold';
    if (status === 'rejected') return 'text-red-600 font-semibold';
    return 'text-yellow-600 font-semibold';
  }

  setFilter(filter: ApprovalStatus | 'all'): void {
    this.activeFilter = filter;
  }
}
