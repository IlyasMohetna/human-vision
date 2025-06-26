import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  ViewChildren,
  QueryList,
  AfterViewInit,
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
export class RightSideBarComponent implements OnChanges, AfterViewInit {
  @Input() highPriorityAnnotations: any[] = [];
  @Input() mediumPriorityAnnotations: any[] = [];
  @Input() lowPriorityAnnotations: any[] = [];
  @Input() unassignedAnnotations: any[] = [];
  @Input() activePolygons: { [key: string]: boolean } = {};
  @Input() hoveredPolygonId: string | null = null;

  @Output() annotationDrop = new EventEmitter<CdkDragDrop<any[]>>();
  @Output() hoveredPolygonChange = new EventEmitter<string | null>();
  @Output() togglePolygonChange = new EventEmitter<string>();
  @Output() commentAdded = new EventEmitter<{ id: string; comment: string }>();

  @ViewChild('unassignedContainer') unassignedContainer!: ElementRef;
  @ViewChildren('unassignedItem') unassignedItems!: QueryList<ElementRef>;
  @ViewChildren(AnnotationCategoryComponent)
  annotationCategories!: QueryList<AnnotationCategoryComponent>;

  private isDragging = false;

  ngAfterViewInit() {
    // Initialize after view is ready
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['hoveredPolygonId']) {
      if (this.hoveredPolygonId && !this.isDragging) {
        // Check if we need to scroll to an item in the unassigned container
        const matchingItem = this.unassignedAnnotations.find(
          (item) => item.objectId === this.hoveredPolygonId
        );

        if (matchingItem) {
          // Use timeout to ensure DOM has updated
          setTimeout(() => this.scrollToHighlightedUnassignedItem(), 50);
        }
      }
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

  onCommentAdded(commentData: { id: string; comment: string }): void {
    this.commentAdded.emit(commentData);
  }

  // Track drag state
  onDragStart() {
    this.isDragging = true;
  }

  onDragEnd() {
    this.isDragging = false;
  }

  // Simplify scrolling method
  scrollToHighlightedUnassignedItem() {
    if (!this.unassignedContainer || this.isDragging) return;

    const container = this.unassignedContainer.nativeElement;

    // Find element by attribute directly through DOM
    const highlightedItem = container.querySelector(
      `[data-object-id="${this.hoveredPolygonId}"]`
    );

    if (highlightedItem) {
      console.log('Found unassigned item to scroll to:', this.hoveredPolygonId);

      // Check if visible in viewport
      const containerRect = container.getBoundingClientRect();
      const itemRect = highlightedItem.getBoundingClientRect();

      const isFullyVisible =
        itemRect.top >= containerRect.top &&
        itemRect.bottom <= containerRect.bottom;

      if (!isFullyVisible) {
        console.log('Scrolling to unassigned item:', this.hoveredPolygonId);
        highlightedItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }
}
