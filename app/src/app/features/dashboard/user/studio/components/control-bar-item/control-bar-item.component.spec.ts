import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlBarItemComponent } from './control-bar-item.component';

describe('ControlBarItemComponent', () => {
  let component: ControlBarItemComponent;
  let fixture: ComponentFixture<ControlBarItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ControlBarItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ControlBarItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
