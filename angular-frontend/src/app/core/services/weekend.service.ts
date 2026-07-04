import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WeekendAvailability, UpdateWeekendDto } from '../models/weekend.model';

@Injectable({ providedIn: 'root' })
export class WeekendService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/weekend`;

  getAll(): Observable<WeekendAvailability[]> {
    return this.http.get<WeekendAvailability[]>(this.base);
  }

  getMine(): Observable<WeekendAvailability> {
    return this.http.get<WeekendAvailability>(`${this.base}/me`);
  }

  upsert(dto: UpdateWeekendDto): Observable<WeekendAvailability> {
    return this.http.put<WeekendAvailability>(`${this.base}/me`, dto);
  }
}
