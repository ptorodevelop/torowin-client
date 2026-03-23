import { Component, inject, Output, signal, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RaffleService } from '../../../../core/services/raffle.service';

@Component({
  selector: 'app-random-generator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './random-generator.html',
  styleUrl: './random-generator.css',
})
export class RandomGeneratorComponent {

  private readonly raffleService = inject(RaffleService);

  @Output() numbersGenerated = new EventEmitter<number[]>();

  slots = signal<any[]>([
    this.createSlot(0),
    this.createSlot(1),
    this.createSlot(2),
  ]);

  slotCount = signal(3);

  // 🧠 crear slot SIEMPRE en 000
  createSlot(id: number) {
    return {
      id,
      locked: false,
      sequence: ['000'],
      transform: 'translateY(0)',
      transition: 'none'
    };
  }

  // 🎰 GIRAR
  spin() {

    const unlocked = this.slots().filter(s => !s.locked);
    if (unlocked.length === 0) return;

    const fake = this.slots().map(slot => {

      if (slot.locked) return slot;

     const sequence = ['000', ...Array.from({ length: 30 }).map(() =>
          Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        )];

      return {
        ...slot,
        sequence,
        transform: 'translateY(0)',
        transition: 'none'
      };
    });

    this.slots.set(fake);

this.raffleService.generateRandomTickets(unlocked.length)
  .subscribe(res => {

    if (!res.status) return;

    const tickets = res.data.tickets;

    let index = 0;

    const updated = this.slots().map(slot => {

      if (slot.locked) return slot;

      const finalNumber = String(tickets[index].number);

      const sequence = [...slot.sequence, finalNumber];

      const finalY = (sequence.length - 1) * 120;

      index++;

      return {
        ...slot,
        sequence,
        transform: 'translateY(0)',
        transition: 'none',
        finalY,
        finalNumber
      };
    });

    this.slots.set(updated);

    // 🔥 PASO CRÍTICO → FORZAR REPAINT REAL
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {

        this.slots.set(
          this.slots().map((slot, i) => {

            if (slot.locked) return slot;

            return {
              ...slot,
              transition: `transform ${2.5 + (i * 0.2)}s cubic-bezier(0.15,0,0.15,1)`,
              transform: `translateY(-${slot.finalY}px)`
            };
          })
        );

      });
    });

  });
  }

  // 🔒 bloquear
  toggleLock(id: number) {
    const updated = this.slots().map(s =>
      s.id === id ? { ...s, locked: !s.locked } : s
    );

    this.slots.set(updated);

    this.emitSelected();
  }

  // 📤 emitir SOLO bloqueados
  emitSelected() {
    const selected = this.slots()
      .filter(s => s.locked)
      .map(s => Number(s.sequence[s.sequence.length - 1]));

    this.numbersGenerated.emit(selected);
  }

  // 🔁 cantidad
  changeCount(delta: number) {
    let count = this.slotCount() + delta;
    count = Math.max(1, Math.min(8, count));

    this.slotCount.set(count);

    const current = this.slots();

    if (count > current.length) {
      const newSlots = [...current];
      for (let i = current.length; i < count; i++) {
        newSlots.push(this.createSlot(i)); // 🔥 SIEMPRE 000
      }
      this.slots.set(newSlots);
    } else {
      this.slots.set(current.slice(0, count));
    }
  }

  resetLocks() {
    this.slots.set(
      this.slots().map(s => ({ ...s, locked: false }))
    );

    this.emitSelected();
  }


  handleExternalReserved(numbers: number[]) {

  const updated = this.slots().map(slot => {

    const currentNumber = Number(
      slot.sequence[slot.sequence.length - 1]
    );

    if (numbers.includes(currentNumber)) {
      return this.createSlot(slot.id);
    }

    return slot;
  });

  this.slots.set(updated);

  this.emitSelected();
}
}
