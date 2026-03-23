import { Routes } from '@angular/router';
import { RafflePageComponent } from './features/raffle/pages/raffle-page/raffle-page.component';
import { LegalPage } from './features/legal/legal-page/legal-page';

export const routes: Routes = [

  {
    path: '',
    loadComponent: () =>
      import('./features/envelopes/pages/envelopes-page/envelopes-page')
        .then(m => m.EnvelopesPage)
  },

  {
    path: 'sobre/:id',
    component: RafflePageComponent,
  },

  {
    path: 'pago/resultado',
    loadComponent: () =>
      import('./features/payment/pages/payment-result/payment-result')
        .then(m => m.PaymentResultComponent)
  },


  {
    path: 'legal/:slug',
    component: LegalPage
  },

  {
    path: '**',
    redirectTo: '',
  }


];
