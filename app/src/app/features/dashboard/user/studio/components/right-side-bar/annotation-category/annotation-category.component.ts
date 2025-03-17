import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { PolygonData } from '../../../data';

@Component({
  selector: 'app-annotation-category',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './annotation-category.component.html',
})
export class AnnotationCategoryComponent implements OnInit, OnDestroy {
  @Input() title = '';
  @Input() priority: 'high' | 'medium' | 'low' | 'none' = 'none';
  @Input() badgeText = '';
  @Input() iconPath = 'assets/icons/rectangle.svg';
  @Input() dropListId = '';
  @Input() connectedDropLists: string[] = [];
  @Input() annotations: PolygonData[] = [];
  @Input() isExpanded = true;
  @Input() activeItems: { [key: string]: boolean } = {};

  @Output() itemDrop = new EventEmitter<CdkDragDrop<PolygonData[]>>();
  @Output() itemHover = new EventEmitter<string>();
  @Output() itemHoverEnd = new EventEmitter<void>();
  @Output() itemToggle = new EventEmitter<string>();
  @Output() toggleExpand = new EventEmitter<boolean>();

  // Flag to track if dragging is in progress
  isDragging = false;

  // Global drag state tracker using document events
  private globalDragListener: any;
  isAnyDragging = false;

  // Track if a drag is currently hovering over the container
  containerHasDrag = false;

  // Always allow dragging into this drop list
  enterPredicate = () => true;

  ngOnInit() {
    // Listen for global drag events
    this.globalDragListener = this.setupDragListeners();
  }

  ngOnDestroy() {
    // Clean up event listeners
    if (this.globalDragListener) {
      this.globalDragListener.forEach((cleanup: Function) => cleanup());
    }
  }

  // Setup listeners for global drag events
  private setupDragListeners() {
    const startListener = (event: Event) => {
      this.isAnyDragging = true;
    };

    const endListener = (event: Event) => {
      setTimeout(() => {
        this.isAnyDragging = false;
      }, 50); // Small delay to ensure drop is processed first
    };

    document.addEventListener('cdkDragStarted', startListener);
    document.addEventListener('cdkDragEnded', endListener);

    return [
      () => document.removeEventListener('cdkDragStarted', startListener),
      () => document.removeEventListener('cdkDragEnded', endListener),
    ];
  }

  // Modify the categoryColorClasses getter to include height adjustments
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
        border: 'border-l-blue-500',
        badge: 'bg-blue-500 text-white',
        marker: 'bg-blue-500',
      },
    };

    return baseClasses[this.priority] || baseClasses.none;
  }

  toggleExpandState() {
    this.isExpanded = !this.isExpanded;
    this.toggleExpand.emit(this.isExpanded);
  }

  onItemDrop(event: CdkDragDrop<PolygonData[]>) {
    // Ensure this item is only moved after dropping.
    // By default, we also reset the flags so "No annotations" won't show mid-drag.
    this.isDragging = false;
    this.isAnyDragging = false;
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
    return !!this.activeItems[id];
  }

  onContainerEnter() {
    this.containerHasDrag = true;
  }

  onContainerExit() {
    this.containerHasDrag = false;
  }
}
