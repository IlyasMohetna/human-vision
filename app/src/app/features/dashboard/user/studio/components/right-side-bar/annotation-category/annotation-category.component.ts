import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  QueryList,
  ViewChildren,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDragDrop,
  DragDropModule,
  CDK_DRAG_CONFIG,
} from '@angular/cdk/drag-drop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-annotation-category',
  standalone: true,
  imports: [CommonModule, DragDropModule, FontAwesomeModule],
  templateUrl: './annotation-category.component.html',
  providers: [
    {
      provide: CDK_DRAG_CONFIG,
      useValue: {
        dragStartThreshold: 0, // Lower threshold
        pointerDirectionChangeThreshold: 1, // Makes movement more responsive
      },
    },
  ],
})
export class AnnotationCategoryComponent
  implements OnInit, OnDestroy, OnChanges, AfterViewInit
{
  @Input() title = '';
  @Input() priority: 'high' | 'medium' | 'low' | 'none' = 'none';
  @Input() badgeText = '';
  @Input() iconPath = 'assets/icons/rectangle.svg';
  @Input() dropListId = '';
  @Input() connectedDropLists: string[] = [];
  @Input() annotations: any[] = [];
  @Input() isExpanded = true;
  @Input() activeItems: { [key: string]: boolean } = {};
  @Input() hoveredPolygonId: string | null = null;

  @Output() itemDrop = new EventEmitter<CdkDragDrop<any[]>>();
  @Output() itemHover = new EventEmitter<string>();
  @Output() itemHoverEnd = new EventEmitter<void>();
  @Output() itemToggle = new EventEmitter<string>();
  @Output() toggleExpand = new EventEmitter<boolean>();

  @ViewChild('scrollableContainer') scrollableContainer!: ElementRef;
  @ViewChildren('annotationItem') annotationItems!: QueryList<ElementRef>;

  isDragging = false;

  containerHasDrag = false;

  enterPredicate = () => true;

  ngOnInit() {
    // Initialization logic
  }

  ngOnDestroy() {
    // Cleanup logic
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['hoveredPolygonId']) {
      if (this.hoveredPolygonId && !this.isDragging) {
        const matchingItem = this.annotations.find(
          (item) => item.objectId === this.hoveredPolygonId
        );

        if (matchingItem) {
          setTimeout(() => this.scrollToHighlightedItem(), 50);
        }
      }
    }
  }

  ngAfterViewInit() {
    // Initialize after view has been created
  }

  get categoryColorClasses() {
    const baseClasses = {
      high: {
        border: 'border-l-red-500',
        badge: 'bg-red-500 text-white',
        marker: 'bg-red-500',
      },
      medium: {
        border: 'border-l-yellow-500',
        badge: 'bg-yellow-500 text-black',
        marker: 'bg-yellow-500',
      },
      low: {
        border: 'border-l-green-500',
        badge: 'bg-green-500 text-white',
        marker: 'bg-green-500',
      },
      none: {
        border: 'border-l-gray-500',
        badge: 'bg-gray-600 text-white',
        marker: 'bg-gray-500',
      },
    };

    return baseClasses[this.priority] || baseClasses.none;
  }

  toggleExpandState() {
    this.isExpanded = !this.isExpanded;
    this.toggleExpand.emit(this.isExpanded);
  }

  onItemDrop(event: CdkDragDrop<any[]>) {
    this.isDragging = false;
    this.itemDrop.emit(event);
  }

  onDragStart() {
    this.isDragging = true;
  }

  onDragEnd() {
    this.isDragging = false;
  }

  onItemHover(id: string) {
    this.itemHover.emit(id);
  }

  onItemHoverEnd() {
    this.itemHoverEnd.emit();
  }

  onItemToggle(id: string) {
    this.itemToggle.emit(id);
  }

  isItemActive(id: string): boolean {
    return this.activeItems[id] === true;
  }

  isItemHoveredFromCanvas(id: string): boolean {
    return this.hoveredPolygonId === id;
  }

  onContainerEnter() {
    this.containerHasDrag = true;
  }

  onContainerExit() {
    this.containerHasDrag = false;
  }

  scrollToHighlightedItem() {
    if (!this.scrollableContainer || !this.isDragging) {
      const container = this.scrollableContainer.nativeElement;

      const highlightedItem = container.querySelector(
        `[data-object-id="${this.hoveredPolygonId}"]`
      );

      if (highlightedItem) {
        const containerRect = container.getBoundingClientRect();
        const itemRect = highlightedItem.getBoundingClientRect();

        const isFullyVisible =
          itemRect.top >= containerRect.top &&
          itemRect.bottom <= containerRect.bottom;

        if (!isFullyVisible) {
          highlightedItem.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
        }
      }
    }
  }

  // Methods to reorder an item up or down in the list
  moveItemUp(index: number) {
    if (index > 0) {
      const item = this.annotations[index];
      this.annotations.splice(index, 1);
      this.annotations.splice(index - 1, 0, item);
    }
  }

  moveItemDown(index: number) {
    if (index < this.annotations.length - 1) {
      const item = this.annotations[index];
      this.annotations.splice(index, 1);
      this.annotations.splice(index + 1, 0, item);
    }
  }
}
