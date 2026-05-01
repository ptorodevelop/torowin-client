import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { EnvelopesService } from '../../services/envelopes-service';
import { Envelope } from '../../models/envelope';
import { Landing } from '../../models/landing';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-envelopes-page',
   imports: [CommonModule],
  templateUrl: './envelopes-page.html',
  styleUrl: './envelopes-page.css',
})
export class EnvelopesPage implements OnInit {

  envelopes: Envelope[] = []
  landing!: Landing
  showCollections = false;
  background: string = '';
  color: string = '';

  constructor(
    private readonly router: Router,
    private readonly envelopesService: EnvelopesService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.showCollections = this.envelopesService.hasSeenCollections;

    this.loadLanding()

    this.loadEnvelopes()

  }

  loadLanding(): void {

    this.envelopesService.getLanding().subscribe({
      next: (data: Landing) => {
        this.landing = data;
        this.cdr.detectChanges();
      },
      error: (err: Error) => console.error(err)
    })

  }

  loadEnvelopes(): void {

    this.envelopesService.getEnvelopes().subscribe({
      next: (data: Envelope[]) => {
        this.envelopes = data;
        this.cdr.detectChanges();
      },
      error: (err: Error) => console.error(err)
    })

  }


  selectEnvelope(pack: Envelope) {
    this.router.navigate(['/sobre', pack.id]);
  }

  getTotalPrice(pack: Envelope): number {
    return Number(pack.price) * pack.min_tickets;
  }



getGradientClass(color: string): string {

  switch (color) {

    case 'amber':
      return 'bg-gradient-gold';

    case 'indigo':
      return 'bg-gradient-indigo';

    case 'emerald':
      return 'bg-gradient-emerald';

    default:
      return 'bg-gradient-indigo';

  }

}

showEnvelopes(): void {

  this.showCollections = true;
  this.envelopesService.hasSeenCollections = true;

  setTimeout(() => {
    document.getElementById('colecciones')?.scrollIntoView({
      behavior: 'smooth'
    });
  }, 50);

}

}
