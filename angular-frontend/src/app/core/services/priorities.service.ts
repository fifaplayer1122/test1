import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TeamPriority, CreatePriorityDto } from '../models/priority.model';

@Injectable({ providedIn: 'root' })
export class PrioritiesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/priorities`;

  getAll(): Observable<TeamPriority[]> {
    return this.http.get<TeamPriority[]>(this.base);
  }

  getMine(): Observable<TeamPriority[]> {
    return this.http.get<TeamPriority[]>(`${this.base}/me`);
  }

  create(dto: CreatePriorityDto): Observable<TeamPriority> {
    return this.http.post<TeamPriority>(this.base, dto);
  }

  update(id: number, dto: CreatePriorityDto): Observable<TeamPriority> {
    return this.http.put<TeamPriority>(`${this.base}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
