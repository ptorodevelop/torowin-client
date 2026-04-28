import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { environment } from '../../../environments/environment';

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

      const { key, wsHost, wsPort, wssPort, forceTLS } = environment.reverb;

      console.log('[Reverb] Inicializando Echo', { key, wsHost, wsPort, forceTLS });

      this.echo = new Echo<'reverb'>({
        broadcaster: 'reverb',
        key,
        wsHost,
        wsPort,
        wssPort,
        forceTLS,
        enabledTransports: forceTLS ? ['wss'] : ['ws'],
      });

      console.log('[Reverb] Echo creado', this.echo);

    }
  }

    listenToRaffle(raffleId: number, onReserved: (data: any) => void, onReleased: (data: any) => void) {

    if (!this.echo) return;

    this.echo.channel(`raffle.${raffleId}`)
      .listen('.ticket.reserved', onReserved)
      .listen('.ticket.released', onReleased);
  }

}
