import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnvelopesPage } from './envelopes-page';

describe('EnvelopesPage', () => {
  let component: EnvelopesPage;
  let fixture: ComponentFixture<EnvelopesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnvelopesPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnvelopesPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
