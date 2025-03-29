import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';

import { AnnotationCategoryComponent } from './annotation-category/annotation-category.component';

@Component({
  selector: 'app-right-side-bar',
  templateUrl: './right-side-bar.component.html',
  standalone: true,
  imports: [CommonModule, DragDropModule, AnnotationCategoryComponent],
})
export class RightSideBarComponent implements OnChanges {
  @Input() highPriorityAnnotations: any[] = [];
  @Input() mediumPriorityAnnotations: any[] = [];
  @Input() lowPriorityAnnotations: any[] = [];
  @Input() unassignedAnnotations: any[] = [];
  @Input() activePolygons: { [key: string]: boolean } = {};
  @Input() hoveredPolygonId: string | null = null;

  @Output() annotationDrop = new EventEmitter<CdkDragDrop<any[]>>();
  @Output() hoveredPolygonChange = new EventEmitter<string | null>();
  @Output() togglePolygonChange = new EventEmitter<string>();

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['hoveredPolygonId'] &&
      !changes['hoveredPolygonId'].firstChange
    ) {
      console.log(
        'RightSideBar received hoveredPolygonId:',
        this.hoveredPolygonId
      );
    }
  }

  setHoveredPolygon(id: string): void {
    console.log('Sidebar item hover:', id);
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
