import { Routes } from '@angular/router';
import { RafflePageComponent } from './features/raffle/pages/raffle-page/raffle-page.component';

export const routes: Routes = [
  {
    path: 'rifa/:id',
    component: RafflePageComponent,
  },
   {
  path: 'pago/resultado',
  loadComponent: () =>
    import('./features/payment/pages/payment-result/payment-result')
      .then(m => m.PaymentResultComponent)
  },
  {
    path: '**',
    redirectTo: 'rifa/1',
  },

];
