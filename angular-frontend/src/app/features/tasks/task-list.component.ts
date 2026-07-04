import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Task, TaskStatus } from '../../core/models/task.model';
import { TasksService } from '../../core/services/tasks.service';
import { TaskDialogComponent } from './task-dialog/task-dialog.component';
import { PriorityBadgeComponent } from '../../shared/components/priority-badge/priority-badge.component';

const PRIORITY_ORDER: Record<string, number> = {
  very_high: 0,
  high: 1,
  medium: 2,
  low: 3,
};

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule,
    PriorityBadgeComponent,
  ],
  templateUrl: './task-list.component.html',
})
export class TaskListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private tasksService = inject(TasksService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  status: TaskStatus = 'todo';
  title = 'Active Tasks';
  loading = true;
  tasks: Task[] = [];

  get displayedColumns(): string[] {
    const base = ['title', 'priority', 'notes', 'eta'];
    if (this.status === 'todo') return [...base, 'actions'];
    return [...base, 'actions'];
  }

  get sortedTasks(): Task[] {
    return [...this.tasks].sort(
      (a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
    );
  }

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.status = (data['status'] as TaskStatus) ?? 'todo';
      this.title = data['title'] ?? 'Tasks';
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.tasksService.getByStatus(this.status).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  openAddDialog(): void {
    const ref = this.dialog.open(TaskDialogComponent, {
      width: '480px',
      data: { mode: 'create' },
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.tasksService.create({ ...result, status: 'todo' }).subscribe({
        next: () => {
          this.snackBar.open('Task created', 'OK', { duration: 3000 });
          this.load();
        },
      });
    });
  }

  openEditDialog(task: Task): void {
    const ref = this.dialog.open(TaskDialogComponent, {
      width: '480px',
      data: { mode: 'edit', task },
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.tasksService.update(task.id, result).subscribe({
        next: () => {
          this.snackBar.open('Task updated', 'OK', { duration: 3000 });
          this.load();
        },
      });
    });
  }

  complete(task: Task): void {
    this.tasksService.updateStatus(task.id, 'done').subscribe({
      next: () => {
        this.snackBar.open('Task marked done', 'OK', { duration: 3000 });
        this.load();
      },
    });
  }

  skip(task: Task): void {
    this.tasksService.updateStatus(task.id, 'skipped').subscribe({
      next: () => {
        this.snackBar.open('Task skipped', 'OK', { duration: 3000 });
        this.load();
      },
    });
  }

  restore(task: Task): void {
    this.tasksService.updateStatus(task.id, 'todo').subscribe({
      next: () => {
        this.snackBar.open('Task restored to active', 'OK', { duration: 3000 });
        this.load();
      },
    });
  }

  delete(task: Task): void {
    if (!confirm(`Delete "${task.title}"?`)) return;
    this.tasksService.delete(task.id).subscribe({
      next: () => {
        this.snackBar.open('Task deleted', 'OK', { duration: 3000 });
        this.load();
      },
    });
  }
}
