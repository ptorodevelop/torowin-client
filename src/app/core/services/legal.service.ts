import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LegalPage {
  id: number;
  slug: string;
  title: string;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class LegalService {

  private readonly api = `${environment.apiUrl}/sobre-fortuna-digital/legal`;

  constructor(private readonly http: HttpClient) {}

  getPages(): Observable<any> {
    return this.http.get(this.api);
  }

  getPage(slug: string): Observable<any> {
    return this.http.get(`${this.api}/${slug}`);
  }
}
