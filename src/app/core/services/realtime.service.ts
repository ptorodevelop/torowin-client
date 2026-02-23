import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {

  echo?: Echo<'reverb'>;
  private  readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private readonly platformId: Object) {

    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {

      (window as any).Pusher = Pusher;

      this.echo = new Echo<'reverb'>({
        broadcaster: 'reverb',
        key: 'h9hnobtiaemj9hwdbh4v',
        wsHost: 'localhost',
        wsPort: 8080,
        forceTLS: false,
        enabledTransports: ['ws'],
      });

    }
  }

    listenToRaffle(raffleId: number, onReserved: (data: any) => void, onReleased: (data: any) => void) {

    if (!this.echo) return;

    this.echo.channel(`raffle.${raffleId}`)
      .listen('.ticket.reserved', onReserved)
      .listen('.ticket.released', onReleased);
  }

}
