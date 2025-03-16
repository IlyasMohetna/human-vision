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

  // Simple navigation items - just labels
  sidebarNavItems = [
    { label: 'Project' },
    { label: 'Tools' },
    { label: 'Zoom' },
    { label: 'Annotations' },
    { label: 'Images' },
  ];

  // Navigation selection without re-rendering
  selectSidebarItem(index: number) {
    this.selectedSidebarItem = index;
  }
}
