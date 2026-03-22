import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  private readonly api = 'http://127.0.0.1:8000/api/sobre-fortuna-digital/legal';

  constructor(private readonly http: HttpClient) {}

  getPages(): Observable<any> {
    return this.http.get(this.api);
  }

  getPage(slug: string): Observable<any> {
    return this.http.get(`${this.api}/${slug}`);
  }
}
