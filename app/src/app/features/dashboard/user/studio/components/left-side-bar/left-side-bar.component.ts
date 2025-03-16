import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-left-side-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './left-side-bar.component.html',
  styleUrls: ['./left-side-bar.component.css'],
})
export class LeftSideBarComponent {
  selectedSidebarItem = 1;

  sidebarNavItems = [
    { label: 'Images' },
    { label: 'Traffic sign' },
    { label: 'Maps', href: 'https://maps.google.com' },
    { label: 'IA' },
  ];

  selectSidebarItem(item: any): void {
    const selectedItem = this.sidebarNavItems[item];
    if (selectedItem.href) {
      window.open(selectedItem.href, '_blank');
    } else {
      this.selectedSidebarItem = item;
    }
  }
}
