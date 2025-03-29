import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapModalComponent } from '../map-modal/map-modal.component';

@Component({
  selector: 'app-left-side-bar',
  standalone: true,
  imports: [CommonModule, MapModalComponent],
  templateUrl: './left-side-bar.component.html',
  styleUrls: ['./left-side-bar.component.css'],
})
export class LeftSideBarComponent {
  @Input() mapCoordinates = '';
  @Input() mapHeading = 0;

  selectedSidebarItem = 1;
  showMapModal = false;

  // Adjust default nav items if desired
  sidebarNavItems = [
    { label: 'Images' },
    { label: 'Traffic sign' },
    { label: 'Maps' },
    { label: 'IA' },
  ];

  selectSidebarItem(item: any): void {
    if (item === 2) {
      this.showMapModal = true;
    } else {
      this.selectedSidebarItem = item;
    }
  }

  closeMapModal() {
    this.showMapModal = false;
  }
}
