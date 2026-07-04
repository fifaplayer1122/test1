import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApprovalRequest, CreateApprovalDto, DecideApprovalDto } from '../models/approval.model';

@Injectable({ providedIn: 'root' })
export class ApprovalsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/approvals`;

  getAll(): Observable<ApprovalRequest[]> {
    return this.http.get<ApprovalRequest[]>(this.base);
  }

  getMine(): Observable<ApprovalRequest[]> {
    return this.http.get<ApprovalRequest[]>(`${this.base}/me`);
  }

  create(dto: CreateApprovalDto): Observable<ApprovalRequest> {
    return this.http.post<ApprovalRequest>(this.base, dto);
  }

  decide(id: number, dto: DecideApprovalDto): Observable<ApprovalRequest> {
    return this.http.patch<ApprovalRequest>(`${this.base}/${id}/decide`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
