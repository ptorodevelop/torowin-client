import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../../environments/environment'
import { Envelope } from '../models/envelope'
import { Landing } from '../models/landing'

@Injectable({
  providedIn: 'root'
})
export class EnvelopesService {

  private readonly api = `${environment.apiUrl}/sobre-fortuna-digital`
  hasSeenCollections = false;

  constructor(private readonly http: HttpClient) {}

  getLanding(): Observable<Landing> {
    return this.http.get<Landing>(`${this.api}/landing`)
  }

  getEnvelopes(): Observable<Envelope[]> {
    return this.http.get<Envelope[]>(`${this.api}/envelopes`)
  }

}
