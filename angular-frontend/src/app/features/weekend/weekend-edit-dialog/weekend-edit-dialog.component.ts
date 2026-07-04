import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { WeekendAvailability, WeekendStatus } from '../../../core/models/weekend.model';

@Component({
  selector: 'app-weekend-edit-dialog',
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
  templateUrl: './weekend-edit-dialog.component.html',
})
export class WeekendEditDialogComponent {
  private dialogRef = inject(MatDialogRef<WeekendEditDialogComponent>);

  statuses: { value: WeekendStatus; label: string }[] = [
    { value: 'available', label: 'Available' },
    { value: 'partial', label: 'Partial' },
    { value: 'unavailable', label: 'Unavailable' },
  ];

  form = new FormGroup({
    saturday_status: new FormControl<WeekendStatus>(
      this.data?.saturday_status ?? 'unavailable',
      [Validators.required]
    ),
    saturday_time: new FormControl(this.data?.saturday_time ?? ''),
    saturday_details: new FormControl(this.data?.saturday_details ?? ''),
    sunday_status: new FormControl<WeekendStatus>(
      this.data?.sunday_status ?? 'unavailable',
      [Validators.required]
    ),
    sunday_time: new FormControl(this.data?.sunday_time ?? ''),
    sunday_details: new FormControl(this.data?.sunday_details ?? ''),
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: WeekendAvailability | null) {}

  get saturdayNeedsDetails(): boolean {
    const s = this.form.get('saturday_status')?.value;
    return s === 'available' || s === 'partial';
  }

  get sundayNeedsDetails(): boolean {
    const s = this.form.get('sunday_status')?.value;
    return s === 'available' || s === 'partial';
  }

  get saturdayDetailsEmpty(): boolean {
    const time = this.form.get('saturday_time')?.value ?? '';
    const details = this.form.get('saturday_details')?.value ?? '';
    return this.saturdayNeedsDetails && !time.trim() && !details.trim();
  }

  get sundayDetailsEmpty(): boolean {
    const time = this.form.get('sunday_time')?.value ?? '';
    const details = this.form.get('sunday_details')?.value ?? '';
    return this.sundayNeedsDetails && !time.trim() && !details.trim();
  }

  get canSave(): boolean {
    return this.form.valid && !this.saturdayDetailsEmpty && !this.sundayDetailsEmpty;
  }

  submit(): void {
    if (!this.canSave) return;
    this.dialogRef.close(this.form.value);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
