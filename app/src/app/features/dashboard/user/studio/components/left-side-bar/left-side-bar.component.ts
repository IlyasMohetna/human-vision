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
    { label: 'IA' },
  ];

  selectSidebarItem(index: number) {
    this.selectedSidebarItem = index;
  }
}
