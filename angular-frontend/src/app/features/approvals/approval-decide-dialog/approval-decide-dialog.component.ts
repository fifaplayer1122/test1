import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ApprovalRequest } from '../../../core/models/approval.model';

@Component({
  selector: 'app-approval-decide-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './approval-decide-dialog.component.html',
})
export class ApprovalDecideDialogComponent {
  private dialogRef = inject(MatDialogRef<ApprovalDecideDialogComponent>);

  form = new FormGroup({
    decision_notes: new FormControl(''),
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: { approval: ApprovalRequest; action: 'approved' | 'rejected' }) {}

  get isApprove(): boolean {
    return this.data.action === 'approved';
  }

  submit(): void {
    this.dialogRef.close({
      status: this.data.action,
      decision_notes: this.form.value.decision_notes ?? '',
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
