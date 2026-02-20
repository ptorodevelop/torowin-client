import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  get<T>(url: string) {
    return this.http.get<T>(`${this.base}${url}`);
  }

  post<T>(url: string, body: any) {
    return this.http.post<T>(`${this.base}${url}`, body);
  }
}
