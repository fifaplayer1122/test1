import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { WeekendService } from '../../core/services/weekend.service';
import { AuthService } from '../../core/auth/auth.service';
import { WeekendAvailability } from '../../core/models/weekend.model';
import { WeekendEditDialogComponent } from './weekend-edit-dialog/weekend-edit-dialog.component';

@Component({
  selector: 'app-weekend',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTableModule,
  ],
  templateUrl: './weekend.component.html',
})
export class WeekendComponent implements OnInit {
  private weekendService = inject(WeekendService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = true;
  rows: WeekendAvailability[] = [];
  myRow: WeekendAvailability | null = null;

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get displayedColumns(): string[] {
    return ['member', 'saturday', 'sat_time', 'sunday', 'sun_time', 'actions'];
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    if (this.isAdmin) {
      this.weekendService.getAll().subscribe({
        next: (rows) => {
          this.rows = rows;
          this.loading = false;
        },
        error: () => { this.loading = false; },
      });
    } else {
      this.weekendService.getMine().subscribe({
        next: (row) => {
          this.myRow = row;
          this.rows = row ? [row] : [];
          this.loading = false;
        },
        error: () => { this.loading = false; },
      });
    }
  }

  openEditDialog(row: WeekendAvailability | null): void {
    const ref = this.dialog.open(WeekendEditDialogComponent, {
      width: '520px',
      data: row,
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.weekendService.upsert(result).subscribe({
        next: () => {
          this.snackBar.open('Availability saved', 'OK', { duration: 3000 });
          this.load();
        },
      });
    });
  }

  statusColor(status: string): string {
    if (status === 'available') return 'text-green-600 font-semibold';
    if (status === 'partial') return 'text-yellow-600 font-semibold';
    return 'text-gray-400';
  }

  statusIcon(status: string): string {
    if (status === 'available') return 'check_circle';
    if (status === 'partial') return 'schedule';
    return 'cancel';
  }
}
