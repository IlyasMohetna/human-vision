import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';

import { AnnotationCategoryComponent } from './annotation-category/annotation-category.component';

@Component({
  selector: 'app-right-side-bar',
  templateUrl: './right-side-bar.component.html',
  standalone: true,
  imports: [CommonModule, DragDropModule, AnnotationCategoryComponent],
})
export class RightSideBarComponent {
  @Input() highPriorityAnnotations: any[] = [];
  @Input() mediumPriorityAnnotations: any[] = [];
  @Input() lowPriorityAnnotations: any[] = [];
  @Input() unassignedAnnotations: any[] = [];
  @Input() activePolygons: { [key: string]: boolean } = {};

  @Output() annotationDrop = new EventEmitter<CdkDragDrop<any[]>>();
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

  onAnnotationDrop(event: CdkDragDrop<any[]>): void {
    this.annotationDrop.emit(event);
  }
}
