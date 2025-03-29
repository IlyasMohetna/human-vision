import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-annotation-category',
  standalone: true,
  imports: [CommonModule, DragDropModule, FontAwesomeModule],
  templateUrl: './annotation-category.component.html',
})
export class AnnotationCategoryComponent
  implements OnInit, OnDestroy, OnChanges
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

  isDragging = false;

  private globalDragListener: any;
  isAnyDragging = false;

  containerHasDrag = false;

  enterPredicate = () => true;

  ngOnInit() {
    this.globalDragListener = this.setupDragListeners();
  }

  ngOnDestroy() {
    if (this.globalDragListener) {
      this.globalDragListener.forEach((cleanup: Function) => cleanup());
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['hoveredPolygonId'] &&
      !changes['hoveredPolygonId'].firstChange
    ) {
      console.log(
        'CategoryComponent received hoveredPolygonId:',
        this.hoveredPolygonId
      );

      // Check if we have any matching annotations with this ID
      if (this.hoveredPolygonId) {
        const matchingItem = this.annotations.find(
          (item) => item.objectId === this.hoveredPolygonId
        );
        if (matchingItem) {
          console.log(
            'Found matching item in',
            this.title,
            'category:',
            matchingItem.objectId
          );
        }
      }
    }
  }

  private setupDragListeners() {
    const startListener = (event: Event) => {
      this.isAnyDragging = true;
    };

    const endListener = (event: Event) => {
      setTimeout(() => {
        this.isAnyDragging = false;
      }, 50);
    };

    document.addEventListener('cdkDragStarted', startListener);
    document.addEventListener('cdkDragEnded', endListener);

    return [
      () => document.removeEventListener('cdkDragStarted', startListener),
      () => document.removeEventListener('cdkDragEnded', endListener),
    ];
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
}
