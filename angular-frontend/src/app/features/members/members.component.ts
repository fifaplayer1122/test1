import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MembersService } from '../../core/services/members.service';
import { Member } from '../../core/models/member.model';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './members.component.html',
})
export class MembersComponent implements OnInit {
  private membersService = inject(MembersService);
  private snackBar = inject(MatSnackBar);

  loading = true;
  members: Member[] = [];
  displayedColumns = ['name', 'email', 'role', 'actions'];

  addForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    role: new FormControl<'admin' | 'member'>('member', [Validators.required]),
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.membersService.getAll().subscribe({
      next: (members) => {
        this.members = members;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  addMember(): void {
    if (this.addForm.invalid) return;
    const v = this.addForm.value;
    this.membersService.create({ name: v.name!, email: v.email!, role: v.role! }).subscribe({
      next: () => {
        this.snackBar.open('Member added', 'OK', { duration: 3000 });
        this.addForm.reset({ name: '', email: '', role: 'member' });
        this.load();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Failed to add member', 'OK', { duration: 4000 });
      },
    });
  }

  removeMember(member: Member): void {
    if (!confirm(`Remove ${member.name} from the team?`)) return;
    this.membersService.delete(member.id).subscribe({
      next: () => {
        this.snackBar.open('Member removed', 'OK', { duration: 3000 });
        this.load();
      },
    });
  }

  roleClass(role: string): string {
    return role === 'admin' ? 'text-blue-700 font-semibold' : 'text-gray-600';
  }
}
