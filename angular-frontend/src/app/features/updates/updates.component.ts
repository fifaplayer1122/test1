import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UpdatesService } from '../../core/services/updates.service';
import { AuthService } from '../../core/auth/auth.service';
import { TeamUpdate } from '../../core/models/update.model';

@Component({
  selector: 'app-updates',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './updates.component.html',
})
export class UpdatesComponent implements OnInit {
  private updatesService = inject(UpdatesService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  loading = true;
  updates: TeamUpdate[] = [];
  postControl = new FormControl('', [Validators.required, Validators.minLength(1)]);
  posting = false;

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get myEmail(): string {
    return this.authService.getUser()?.email ?? '';
  }

  isOwn(update: TeamUpdate): boolean {
    return update.member_email?.toLowerCase() === this.myEmail.toLowerCase();
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    const obs = this.isAdmin
      ? this.updatesService.getAll()
      : this.updatesService.getMine();

    obs.subscribe({
      next: (updates) => {
        this.updates = updates.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  post(): void {
    if (this.postControl.invalid) return;
    this.posting = true;
    this.updatesService.create({ content: this.postControl.value! }).subscribe({
      next: () => {
        this.snackBar.open('Update posted', 'OK', { duration: 3000 });
        this.postControl.reset();
        this.posting = false;
        this.load();
      },
      error: () => { this.posting = false; },
    });
  }

  delete(update: TeamUpdate): void {
    if (!confirm('Delete this update?')) return;
    this.updatesService.delete(update.id).subscribe({
      next: () => {
        this.snackBar.open('Update deleted', 'OK', { duration: 3000 });
        this.load();
      },
    });
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleString();
  }
}
