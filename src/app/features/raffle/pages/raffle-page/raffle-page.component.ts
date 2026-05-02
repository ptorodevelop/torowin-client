import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RaffleService } from '../../../../core/services/raffle.service';
import { RaffleHeroComponent } from '../../components/raffle-hero/raffle-hero';
import { EnvelopesService } from '../../../envelopes/services/envelopes-service';
import { Envelope } from '../../../envelopes/models/envelope';
import { RandomGeneratorComponent } from '../../components/random-generator/random-generator';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RealtimeService } from '../../../../core/services/realtime.service';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-raffle-page',
   standalone: true,
  imports: [CommonModule, RaffleHeroComponent, ReactiveFormsModule, RandomGeneratorComponent],
  templateUrl: './raffle-page.html',
  styleUrls: ['./raffle-page.css']
})
export class RafflePageComponent implements OnInit {

  selectedEnvelopeId = signal<number | null>(null);
  selectedEnvelope = signal<Envelope | null>(null);
  minTickets = computed(() => this.selectedEnvelope()?.min_tickets ?? 1);
  selectedTicketsCount = signal(0);
  isSelectionValid = computed(() => this.selectedTicketsCount() >= this.minTickets());

  private readonly realtime = inject(RealtimeService);
  tickets = signal<any[]>([]);
  searchTerm = signal('');
  allTickets = signal<any[]>([]);
  filterStatus = signal<'all' | 'available' | 'occupied'>('all');
  notification = signal<string | null>(null);
  mode = signal<'manual' | 'random'>('manual');
  @ViewChild(RandomGeneratorComponent)
  randomComponent?: RandomGeneratorComponent;

  raffleId!: number;
  isModalOpen = false;
  isSuccessOpen = false;
  ticketPrice!: number;
  isProcessing = false;

  private fb = inject(FormBuilder);

  setManualMode() {
  this.mode.set('manual');
  this.selectedTickets.clear();
  this.selectedTicketsCount.set(0);
}

setRandomMode() {
  this.mode.set('random');
  this.selectedTickets.clear();
  this.selectedTicketsCount.set(0);
}

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
  private readonly envelopesService: EnvelopesService,
  private readonly route: ActivatedRoute,
  private readonly router: Router
) {}

  ngOnInit(): void {
  this.route.paramMap.subscribe(params => {
    const id = params.get('id');
    if (id) {
      this.selectedEnvelopeId.set(Number(id));
      this.raffleId = +id;
      this.loadTickets();
      this.loadEnvelope(Number(id));
    }
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
  this.selectedTicketsCount.set(this.selectedTickets.size);
}

  loadTickets(): void {
  this.raffleService.getTickets().subscribe({
    next: (res: any) => {
      this.tickets.set(res.data.tickets);
      this.allTickets.set(res.data.tickets);
      this.ticketPrice = res.data.ticket_price;

      const incomingRaffleId = res.data.raffleId;
      if (incomingRaffleId && incomingRaffleId !== this.raffleId) {
        this.raffleId = incomingRaffleId;
        this.realtime.listenToRaffle(
          this.raffleId,
          (event: any) => this.handleReserved(event),
          (event: any) => this.handleReleased(event),
        );
      }
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
      
      const payload: any = {
        reservation_token: reservationToken,
        envelope_id: this.selectedEnvelopeId(),
        buyer: this.form.value
      };

      const partnerCode = localStorage.getItem('partner_code');
      if (partnerCode) {
        payload.partner_code = partnerCode;
      }

      this.raffleService.createOrder(payload).subscribe({

        next: (orderRes: any) => {

  console.log('ORDER RESPONSE →', orderRes);

  const wompiWidget = orderRes.data.wompi_widget;
  const orderId = orderRes.data.id || orderRes.data.order_id || orderRes.data.wompi_widget?.reference;

  this.isModalOpen = false;

  if (wompiWidget) {
    console.log("Enviando exacto esto a Wompi:", wompiWidget);
    const checkout = new (window as any).WidgetCheckout(wompiWidget);

    checkout.open((result: any) => {
      console.log("🟡 Checkout cerrado", result);

      if (result && result.transaction) {
          console.log('ID Transacción: ', result.transaction.id);
      }

      // ⚠️ AÚN NO sabemos si pagó efectivamente.
      // El webhook lo confirmará

      this.selectedTickets.clear();
      this.selectedTicketsCount.set(0);
      this.form.reset();
      this.loadTickets();

      if (orderId) {
        this.router.navigate(['/pago/resultado'], { queryParams: { ref: orderId } });
      } else {
        console.warn("No se encontró el ID de la orden para redirigir");
      }
    });

    // Desbloqueamos el botón inmediatamente después de abrir el widget.
    // El widget se abre en una capa superior (modal), así que el usuario no puede
    // hacer doble clic, pero si la cierra manualmente sin pagar, el form estará libre.
    this.isProcessing = false;
  } else {
    console.error("Falta la configuración de Wompi Widget en la respuesta");
    alert("No se pudo iniciar el pago, configuración faltante.");
    this.isProcessing = false;
  }
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
  const tickets = this.allTickets();

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

  let wasSelected = false;

  // 🔹 modo manual
  if (this.selectedTickets.has(num)) {
    this.selectedTickets.delete(num);
    this.selectedTicketsCount.set(this.selectedTickets.size);
    wasSelected = true;
  }

  if (this.mode() === 'random' && this.randomComponent) {

    const existsInSlots = this.randomComponent.slots()
          .some(s => {
            const value = s.finalNumber ?? s.sequence[s.sequence.length - 1];
            return Number(value) === num;
          });

    if (existsInSlots) {
      wasSelected = true;
    }
  }

  if (wasSelected) {
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

    if (this.mode() === 'random' && this.randomComponent) {
    this.randomComponent.handleExternalReserved(event.numbers);
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

handleRandomSelection(numbers: number[]) {

  this.selectedTickets.clear();

  numbers.forEach(num => {

    const ticket = this.allTickets()
      .find(t => Number(t.number) === num);

    if (ticket && ticket.status === 'available') {
      this.selectedTickets.set(num, ticket);
    }

  });
  this.selectedTicketsCount.set(this.selectedTickets.size);
}

  loadEnvelope(id: number) {
    this.envelopesService.getEnvelopes().subscribe({
      next: (envelopes) => {
        const env = envelopes.find(e => Number(e.id) === Number(id));
        if (env) {
          this.selectedEnvelope.set(env);
        } else if (envelopes.length > 0) {
          // Si el ID no existe, lo enviamos al primer sobre disponible (por defecto)
          // Usamos replaceUrl para que el ID falso no quede en su historial de navegación
          this.router.navigate(['/sobre', envelopes[0].id], { replaceUrl: true });
        } else {
          // Si no hay ningún sobre en todo el sistema, lo enviamos al inicio
          this.router.navigate(['/']);
        }
      }
    });
  }


}
