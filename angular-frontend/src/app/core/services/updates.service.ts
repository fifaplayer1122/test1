import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TeamUpdate, CreateUpdateDto } from '../models/update.model';

@Injectable({ providedIn: 'root' })
export class UpdatesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/updates`;

  getAll(): Observable<TeamUpdate[]> {
    return this.http.get<TeamUpdate[]>(this.base);
  }

  getMine(): Observable<TeamUpdate[]> {
    return this.http.get<TeamUpdate[]>(`${this.base}/me`);
  }

  create(dto: CreateUpdateDto): Observable<TeamUpdate> {
    return this.http.post<TeamUpdate>(this.base, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
