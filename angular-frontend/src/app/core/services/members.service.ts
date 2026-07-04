import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Member, CreateMemberDto } from '../models/member.model';

@Injectable({ providedIn: 'root' })
export class MembersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/members`;

  getAll(): Observable<Member[]> {
    return this.http.get<Member[]>(this.base);
  }

  getMe(): Observable<Member> {
    return this.http.get<Member>(`${this.base}/me`);
  }

  create(dto: CreateMemberDto): Observable<Member> {
    return this.http.post<Member>(this.base, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  autoRegister(name: string, email: string, azureId: string): Observable<Member> {
    return this.http.post<Member>(this.base, { name, email, azure_id: azureId, role: 'member' });
  }
}
