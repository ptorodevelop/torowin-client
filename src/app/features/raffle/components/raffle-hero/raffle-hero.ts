import { Component, OnInit, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RaffleService } from '../../../../core/services/raffle.service';

@Component({
  selector: 'app-raffle-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './raffle-hero.html',
  styleUrls: ['./raffle-hero.css']
})
export class RaffleHeroComponent implements OnInit {

  private raffleService = inject(RaffleService);

  raffle = signal<any | null>(null);

  ngOnInit(): void {
    this.loadActiveRaffle();
  }

  private loadActiveRaffle() {
     this.raffleService.getActiveRaffle().subscribe({
      next: (res: any) => this.raffle.set(res.data),
      error: (err) => console.error('Error cargando rifa activa', err)
    });
  }

  @Output() search = new EventEmitter<string>();

onSearch(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  this.search.emit(value);
}
}

