import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RaffleService } from '../../../../core/services/raffle.service';
import { RaffleHeroComponent } from '../../components/raffle-hero/raffle-hero';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RealtimeService } from '../../../../core/services/realtime.service';

@Component({
  selector: 'app-raffle-page',
   standalone: true,
  imports: [CommonModule, RaffleHeroComponent, ReactiveFormsModule],
  templateUrl: './raffle-page.html',
  styleUrls: ['./raffle-page.css']
})
export class RafflePageComponent implements OnInit {

  private readonly realtime = inject(RealtimeService);
  tickets = signal<any[]>([]);
  searchTerm = signal('');
  allTickets = signal<any[]>([]);
  filterStatus = signal<'all' | 'available' | 'occupied'>('all');
  notification = signal<string | null>(null);

  raffleId!: number;
  isModalOpen = false;
  isSuccessOpen = false;
  ticketPrice!: number;
  isProcessing = false;

  private fb = inject(FormBuilder);

 form = this.fb.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(80),
        Validators.pattern(/^[a-zA-ZÁÉÍÓÚáéíóúñÑ ]+$/)
      ]
    ],

    phone: [
      '',
      [
        Validators.required,
        Validators.pattern(/^3\d{9}$/)
      ]
    ],

    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(120)
      ]
    ],

    document: [
      '',
      [
        Validators.required,
        Validators.pattern(/^\d+$/),   // solo números
        Validators.minLength(6),
        Validators.maxLength(12)
      ]
    ]
  });

  constructor(
  private readonly raffleService: RaffleService,
  private readonly route: ActivatedRoute
) {}

  ngOnInit(): void {
  this.route.paramMap.subscribe(params => {
    const id = params.get('id');
    if (id) {
      this.raffleId = +id;
      this.loadTickets();
    }
    this.realtime.listenToRaffle(
      this.raffleId,

      // 🔴 Cuando reservan
      (event: any) => {
        this.handleReserved(event);
      },

      // 🟢 Cuando liberan
      (event: any) => {
        this.handleReleased(event);
      }

    );
  });
}

  selectedTickets = new Map<number, any>();

toggleTicket(ticket: any) {
  if (ticket.status !== 'available') return;

  const num = Number(ticket.number);

  if (this.selectedTickets.has(num)) {
    this.selectedTickets.delete(num);
  } else {
    this.selectedTickets.set(num, ticket);
  }
}

  loadTickets(): void {
  this.raffleService.getTickets().subscribe({
    next: (res: any) => {
      this.tickets.set(res.data.tickets);
      this.raffleId = res.data.raffleId;
      this.allTickets.set(res.data.tickets);
      this.ticketPrice = res.data.ticket_price
    },
    error: (err: any) => {
      console.error('Error cargando tickets', err);
    }
  });
}

  get totalPrice(): number {
    return this.selectedTickets.size * this.ticketPrice;
  }

  openModal() {
  this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  handleCheckout(event: Event) {
  event.preventDefault();

  if (this.form.invalid || this.isProcessing) {
    this.form.markAllAsTouched();
    return;
  }

  this.isProcessing = true;

  const numbers = Array.from(this.selectedTickets.keys());

  this.raffleService.reserveTickets(this.raffleId, numbers).subscribe({

    next: (reserveRes: any) => {
      const reservationToken = reserveRes.data.reservation_token;
      this.raffleService.createOrder({
        reservation_token: reservationToken,
        buyer: this.form.value
      }).subscribe({

        next: (orderRes: any) => {

  console.log('ORDER RESPONSE →', orderRes);

  const sessionId = orderRes.data.sessionId;

  this.isModalOpen = false;

  const checkout = (window as any).ePayco.checkout.configure({
    sessionId: sessionId,
    type: "onpage",
    test: true
  });

  checkout.onCreated(() => {
    console.log("🟢 Checkout abierto");
  });

  checkout.onErrors((e: any) => {
    console.error("🔴 Error en checkout", e);
    alert("No se pudo iniciar el pago.");
    this.isProcessing = false;
  });

  checkout.onClosed(() => {
    console.log("🟡 Checkout cerrado");

    // ⚠️ AÚN NO sabemos si pagó
    // El webhook lo confirmará

    this.selectedTickets.clear();
    this.form.reset();
    this.loadTickets();
    this.isProcessing = false;
  });

  checkout.open();
},

        error: (err) => {
          console.error('Error creando orden', err);
          alert('No se pudo crear la orden.');
          this.isProcessing = false;
        }

      });

    },

    error: (err) => {
      console.error('Error reservando tickets', err);
      if (err?.error?.data?.numbers) {
        alert('Algunos números ya no están disponibles: ' + err.error.data.numbers);
      } else {
        alert('No se pudieron reservar los números.');
      }

      this.loadTickets();
      this.isProcessing = false;
    }

  });
}


  hasError(control: string, error: string): boolean {
    const c = this.form.get(control);
    return !!(c && c.touched && c.hasError(error));
  }

  isInvalid(control: string): boolean {
    const c = this.form.get(control);
    return !!(c && c.touched && c.invalid);
  }

  onSearch(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  this.searchTerm.set(value);
}

filteredTickets = computed(() => {

  const term = this.searchTerm().trim();
  const status = this.filterStatus();
  const tickets = this.allTickets(); // 👈 IMPORTANTE

  return tickets.filter(ticket => {

    const matchesSearch =
      !term || String(ticket.number).includes(term);

    const matchesStatus =
      status === 'all' ||
      (status === 'available' && ticket.status === 'available') ||
      (status === 'occupied' && ticket.status !== 'available');

    return matchesSearch && matchesStatus;
  });

});

setFilter(status: 'all' | 'available' | 'occupied') {
  this.filterStatus.set(status);
   this.searchTerm.set('');
}

private handleReserved(event: any) {

  const updated = this.allTickets().map(ticket => {

    if (event.numbers.includes(Number(ticket.number))) {
      return { ...ticket, status: 'reserved' };
    }

    return ticket;
  });

  this.allTickets.set(updated);

  const removedNumbers: number[] = [];

  event.numbers.forEach((num: number) => {
    if (this.selectedTickets.has(num)) {
      this.selectedTickets.delete(num);
      removedNumbers.push(num);
    }
  });

  if (removedNumbers.length > 0) {

    if (removedNumbers.length === 1) {
      this.notification.set(
        `El número ${removedNumbers[0]} fue reservado por otro participante.`
      );
    } else {
      this.notification.set(
        `Los números ${removedNumbers.join(', ')} fueron reservados por otros participantes.`
      );
    }

    setTimeout(() => {
      this.notification.set(null);
    }, 10000);
  }

}

private handleReleased(event: any) {

  console.log('Liberado →', event);

  const updated = this.allTickets().map(ticket => {

    if (event.numbers.includes(Number(ticket.number))) {
      return { ...ticket, status: 'available' };
    }

    return ticket;
  });

  this.allTickets.set(updated);

}


}
