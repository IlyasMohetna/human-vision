import { Component } from '@angular/core';
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
  selectedSidebarItem = 1;
  showMapModal = false;
  mapCoordinates = '50.108713798330555,8.68032783609474';
  mapHeading = 240;

  sidebarNavItems = [
    { label: 'Images' },
    { label: 'Traffic sign' },
    {
      label: 'Maps',
    },
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
