import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';

import { PolygonData } from '../../data';
import { AnnotationCategoryComponent } from './annotation-category/annotation-category.component';

@Component({
  selector: 'app-right-side-bar',
  templateUrl: './right-side-bar.component.html',
  standalone: true,
  imports: [CommonModule, DragDropModule, AnnotationCategoryComponent],
})
export class RightSideBarComponent {
  @Input() highPriorityAnnotations: PolygonData[] = [];
  @Input() mediumPriorityAnnotations: PolygonData[] = [];
  @Input() lowPriorityAnnotations: PolygonData[] = [];
  @Input() unassignedAnnotations: PolygonData[] = [];
  @Input() activePolygons: { [key: string]: boolean } = {};

  @Output() annotationDrop = new EventEmitter<CdkDragDrop<PolygonData[]>>();
  @Output() hoveredPolygonChange = new EventEmitter<string | null>();
  @Output() togglePolygonChange = new EventEmitter<string>();

  setHoveredPolygon(id: string): void {
    this.hoveredPolygonChange.emit(id);
  }

  clearHoveredPolygon(): void {
    this.hoveredPolygonChange.emit(null);
  }

  togglePolygon(id: string): void {
    this.togglePolygonChange.emit(id);
  }

  onAnnotationDrop(event: CdkDragDrop<PolygonData[]>): void {
    this.annotationDrop.emit(event);
  }
}
