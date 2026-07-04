import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PrioritiesService } from '../../core/services/priorities.service';
import { AuthService } from '../../core/auth/auth.service';
import { TeamPriority, PriorityLevel } from '../../core/models/priority.model';
import { PriorityBadgeComponent } from '../../shared/components/priority-badge/priority-badge.component';

interface MemberGroup {
  name: string;
  email: string;
  items: TeamPriority[];
}

@Component({
  selector: 'app-priorities',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    PriorityBadgeComponent,
  ],
  templateUrl: './priorities.component.html',
})
export class PrioritiesComponent implements OnInit {
  private prioritiesService = inject(PrioritiesService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  loading = true;
  groups: MemberGroup[] = [];
  editingId: number | null = null;

  priorityLevels: { value: PriorityLevel; label: string }[] = [
    { value: 'very_high', label: 'Very High' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  addForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    priority_level: new FormControl<PriorityLevel>('medium', [Validators.required]),
  });

  editForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    priority_level: new FormControl<PriorityLevel>('medium', [Validators.required]),
  });

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get myEmail(): string {
    return this.authService.getUser()?.email ?? '';
  }

  get myName(): string {
    return this.authService.getUser()?.name ?? '';
  }

  get myGroup(): MemberGroup | undefined {
    return this.groups.find((g) => g.email.toLowerCase() === this.myEmail.toLowerCase());
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    const obs = this.isAdmin
      ? this.prioritiesService.getAll()
      : this.prioritiesService.getMine();

    obs.subscribe({
      next: (items) => {
        this.buildGroups(items);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  private buildGroups(items: TeamPriority[]): void {
    const map = new Map<string, MemberGroup>();
    for (const item of items) {
      const email = item.member_email ?? '';
      if (!map.has(email)) {
        map.set(email, { name: item.member_name ?? email, email, items: [] });
      }
      map.get(email)!.items.push(item);
    }
    this.groups = Array.from(map.values());

    // Ensure my group exists even if empty
    if (!this.isAdmin && !map.has(this.myEmail)) {
      this.groups = [{ name: this.myName, email: this.myEmail, items: [] }];
    }
  }

  canEdit(item: TeamPriority): boolean {
    if (this.isAdmin) return true;
    return item.member_email?.toLowerCase() === this.myEmail.toLowerCase();
  }

  addItem(): void {
    if (this.addForm.invalid) return;
    const v = this.addForm.value;
    this.prioritiesService.create({ title: v.title!, priority_level: v.priority_level! }).subscribe({
      next: () => {
        this.snackBar.open('Priority added', 'OK', { duration: 3000 });
        this.addForm.reset({ title: '', priority_level: 'medium' });
        this.load();
      },
    });
  }

  startEdit(item: TeamPriority): void {
    this.editingId = item.id;
    this.editForm.setValue({ title: item.title, priority_level: item.priority_level });
  }

  saveEdit(item: TeamPriority): void {
    if (this.editForm.invalid) return;
    const v = this.editForm.value;
    this.prioritiesService.update(item.id, { title: v.title!, priority_level: v.priority_level! }).subscribe({
      next: () => {
        this.snackBar.open('Priority updated', 'OK', { duration: 3000 });
        this.editingId = null;
        this.load();
      },
    });
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  deleteItem(item: TeamPriority): void {
    if (!confirm(`Delete "${item.title}"?`)) return;
    this.prioritiesService.delete(item.id).subscribe({
      next: () => {
        this.snackBar.open('Priority deleted', 'OK', { duration: 3000 });
        this.load();
      },
    });
  }
}
