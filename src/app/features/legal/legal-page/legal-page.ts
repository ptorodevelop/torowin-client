import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink  } from '@angular/router';
import { LegalService } from '../../../core/services/legal.service';
import { marked } from 'marked';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './legal-page.html'
})
export class LegalPage implements OnInit {

  page: any;

  constructor(
    private readonly route: ActivatedRoute,
    private  readonly legalService: LegalService
  ) {}

  ngOnInit(): void {

  this.route.paramMap.subscribe(params => {

    const slug = params.get('slug');

    if (slug) {
      this.legalService.getPage(slug).subscribe((res:any)=>{
        this.page = res.data;
      });
    }

  });

}

  get htmlContent() {
    return this.page ? marked.parse(this.page.content) : '';
  }
}
