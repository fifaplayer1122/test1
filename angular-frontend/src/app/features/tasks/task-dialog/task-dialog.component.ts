import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Task, TaskPriority } from '../../../core/models/task.model';

export interface TaskDialogData {
  task?: Task;
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-task-dialog',
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
  templateUrl: './task-dialog.component.html',
})
export class TaskDialogComponent {
  private dialogRef = inject(MatDialogRef<TaskDialogComponent>);

  priorities: { value: TaskPriority; label: string }[] = [
    { value: 'very_high', label: 'Very High' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  form = new FormGroup({
    title: new FormControl(this.data.task?.title ?? '', [Validators.required, Validators.minLength(1)]),
    priority: new FormControl<TaskPriority>(this.data.task?.priority ?? 'medium', [Validators.required]),
    notes: new FormControl(this.data.task?.notes ?? ''),
    eta: new FormControl(this.data.task?.eta ?? ''),
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: TaskDialogData) {}

  get isEdit(): boolean {
    return this.data.mode === 'edit';
  }

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
