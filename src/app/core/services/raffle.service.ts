import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RaffleService {

  private readonly api = environment.apiUrl;

  constructor(
    private readonly http: HttpClient
  ) {}

  getTickets(): Observable<any> {
    return this.http.get(
      `${this.api}/public/raffles/tickets`
    );
  }

  getActiveRaffle(): Observable<any> {
    return this.http.get<any>(
      `${this.api}/public/raffles/active`
    );
  }

  reserveTickets(
    raffleId: number,
    numbers: number[]
  ): Observable<any> {
    return this.http.post(
      `${this.api}/raffles/${raffleId}/tickets/reserve`,
      { numbers }
    );
  }

  createOrder(data: any): Observable<any> {
    return this.http.post(
      `${this.api}/orders`,
      data
    );
  }

  getOrderStatus(orderId: number): Observable<any> {
    return this.http.get(
      `${this.api}/orders/${orderId}/status`
    );
  }

}
