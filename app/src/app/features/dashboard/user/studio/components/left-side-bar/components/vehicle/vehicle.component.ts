import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vehicle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehicle.component.html',
})
export class VehicleComponent implements OnChanges {
  @Input() vehicle: any = {};

  speedKmh: number = 0;
  yawRateDegrees: number = 0;
  speedometerPercentage: number = 0;
  directionText: string = 'Straight';

  readonly MAX_SPEED_DISPLAY = 100;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vehicle']) {
      this.updateCalculatedValues();
    }
  }

  private updateCalculatedValues(): void {
    if (this.vehicle && typeof this.vehicle === 'object') {
      this.speedKmh = this.vehicle.speed
        ? parseFloat((this.vehicle.speed * 3.6).toFixed(1))
        : 0;

      this.speedometerPercentage = Math.min(
        100,
        (this.speedKmh / this.MAX_SPEED_DISPLAY) * 100
      );

      this.yawRateDegrees = this.vehicle.yawRate
        ? parseFloat(((this.vehicle.yawRate * 180) / Math.PI).toFixed(1))
        : 0;

      if (this.yawRateDegrees > 1) {
        this.directionText = 'Turning Right';
      } else if (this.yawRateDegrees < -1) {
        this.directionText = 'Turning Left';
      } else {
        this.directionText = 'Straight';
      }
    }
  }
}
