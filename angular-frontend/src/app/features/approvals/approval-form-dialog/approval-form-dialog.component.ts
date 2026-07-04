import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ApprovalCategory, ApprovalPriority } from '../../../core/models/approval.model';

@Component({
  selector: 'app-approval-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './approval-form-dialog.component.html',
})
export class ApprovalFormDialogComponent {
  private dialogRef = inject(MatDialogRef<ApprovalFormDialogComponent>);

  categories: { value: ApprovalCategory; label: string }[] = [
    { value: 'software', label: 'Software' },
    { value: 'hardware', label: 'Hardware' },
    { value: 'service', label: 'Service' },
    { value: 'travel', label: 'Travel' },
    { value: 'access', label: 'Access' },
    { value: 'other', label: 'Other' },
  ];

  priorities: { value: ApprovalPriority; label: string }[] = [
    { value: 'Urgent', label: 'Urgent' },
    { value: 'Normal', label: 'Normal' },
    { value: 'Low', label: 'Low' },
  ];

  form = new FormGroup({
    title: new FormControl('', [Validators.required]),
    category: new FormControl<ApprovalCategory>('software', [Validators.required]),
    reason: new FormControl('', [Validators.required]),
    cost: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    priority: new FormControl<ApprovalPriority>('Normal', [Validators.required]),
  });

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
