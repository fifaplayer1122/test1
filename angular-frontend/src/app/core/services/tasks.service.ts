import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task, CreateTaskDto, TaskStatus } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/tasks`;

  getAll(): Observable<Task[]> {
    return this.http.get<Task[]>(this.base);
  }

  getByStatus(status: TaskStatus): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.base}?status=${status}`);
  }

  create(dto: CreateTaskDto): Observable<Task> {
    return this.http.post<Task>(this.base, dto);
  }

  update(id: number, dto: Partial<CreateTaskDto>): Observable<Task> {
    return this.http.put<Task>(`${this.base}/${id}`, dto);
  }

  updateStatus(id: number, status: TaskStatus): Observable<Task> {
    return this.http.patch<Task>(`${this.base}/${id}/status`, { status });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
