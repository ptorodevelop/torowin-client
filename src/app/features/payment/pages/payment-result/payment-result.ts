import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RaffleService } from '../../../../core/services/raffle.service';

@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  templateUrl: './payment-result.html',
  styleUrls: ['./payment-result.css']
})
export class PaymentResultComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly raffleService = inject(RaffleService);

  status = signal<'approved' | 'failed' | 'pending' | null>(null);
  amount = signal<number>(0);
  refId = signal<number | null>(null);
  today = new Date();

  ngOnInit(): void {
    const orderId = this.route.snapshot.queryParamMap.get('ref');

    if (!orderId) {
      this.router.navigateByUrl('/');
      return;
    }

    this.refId.set(+orderId);
    this.loadStatus(+orderId);
  }

  loadStatus(orderId: number) {
    this.raffleService.getOrderStatus(orderId).subscribe({
      next: (res: any) => {
        this.status.set(res.data.status);
        this.amount.set(res.data.amount);
      },
      error: () => {
        this.status.set('failed');
      }
    });
  }

  statusTitle = computed(() => {
    switch (this.status()) {
      case 'approved': return '¡Pago Exitoso!';
      case 'failed': return 'Pago Rechazado';
      case 'pending': return 'Transacción Pendiente';
      default: return 'Verificando pago...';
    }
  });

  statusDescription = computed(() => {
    switch (this.status()) {
      case 'approved': return 'Tu participación ha sido confirmada. ¡Mucha suerte en el sorteo!';
      case 'failed': return 'Tu banco rechazó la operación. No se realizó ningún cargo.';
      case 'pending': return 'Estamos confirmando tu pago con el banco.';
      default: return 'Estamos consultando el estado de tu pago.';
    }
  });

  statusIcon = computed(() => {
    switch (this.status()) {
      case 'approved': return 'fa-check-circle';
      case 'failed': return 'fa-circle-xmark';
      case 'pending': return 'fa-spinner fa-spin';
      default: return 'fa-clock';
    }
  });

  statusColor = computed(() => {
    switch (this.status()) {
      case 'approved':
        return { text: 'text-green-600', bg: 'bg-green-600', lightBg: 'bg-green-50', border: 'border-green-200' };
      case 'failed':
        return { text: 'text-red-600', bg: 'bg-red-600', lightBg: 'bg-red-50', border: 'border-red-200' };
      case 'pending':
        return { text: 'text-amber-600', bg: 'bg-amber-500', lightBg: 'bg-amber-50', border: 'border-amber-200' };
      default:
        return { text: 'text-slate-600', bg: 'bg-slate-500', lightBg: 'bg-slate-50', border: 'border-slate-200' };
    }
  });

  goHome() {
    this.router.navigateByUrl('/');
  }
}
