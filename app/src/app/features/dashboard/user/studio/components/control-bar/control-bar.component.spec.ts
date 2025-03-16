import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlBarComponent } from './control-bar.component';

describe('ControlBarComponent', () => {
  let component: ControlBarComponent;
  let fixture: ComponentFixture<ControlBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ControlBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ControlBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
