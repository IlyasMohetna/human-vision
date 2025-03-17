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
  mapCoordinates = '50.11277826699915,8.681049182681981';
  mapHeading = 180;

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
