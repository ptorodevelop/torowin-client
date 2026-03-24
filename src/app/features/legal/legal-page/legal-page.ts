import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { LegalService } from '../../../core/services/legal.service';
import { marked } from 'marked';
import { CommonModule } from '@angular/common';
import { switchMap } from 'rxjs/operators';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './legal-page.html'
})
export class LegalPage implements OnInit {

  page: any = null;
  loading = true;
  htmlContent!: SafeHtml;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly legalService: LegalService,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap(params => {
          const slug = params.get('slug');
          this.loading = true;
          return this.legalService.getPage(slug!);
        })
      )
      .subscribe({
        next: (res: any) => {
          this.page = res.data;

          const rawHtml = marked.parse(this.page.content) as string;
          this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(rawHtml);

          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.page = null;
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  goHome() {
    window.location.href = '/';
  }
}
