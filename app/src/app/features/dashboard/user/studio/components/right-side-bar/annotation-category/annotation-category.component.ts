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
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { KeyboardService } from '../../../services/keyboard.service';

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
  @Output() commentAdded = new EventEmitter<{ id: string; comment: string }>();

  @ViewChild('scrollableContainer') scrollableContainer!: ElementRef;
  @ViewChildren('annotationItem') annotationItems!: QueryList<ElementRef>;

  isDragging = false;

  containerHasDrag = false;

  enterPredicate = () => true;

  constructor(
    library: FaIconLibrary,
    private keyboardService: KeyboardService
  ) {
    library.addIconPacks(fas);
  }

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

  openCommentModal(item: any): void {
    // Disable space key detection when modal opens
    this.keyboardService.disableSpaceKey();

    // Create a modal element with a backdrop
    const modalContainer = document.createElement('div');
    modalContainer.className =
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]';

    // Create the modal content
    const modal = document.createElement('div');
    modal.className = 'bg-gray-800 rounded-lg p-6 w-96 max-w-[90%] shadow-xl';

    // Add title
    const title = document.createElement('h3');
    title.className = 'text-xl font-bold mb-4 text-white';
    title.textContent = `Comment on ${item.label || 'Unnamed'}`;

    // Add textarea
    const textarea = document.createElement('textarea');
    textarea.className = 'w-full h-32 p-2 mb-4 bg-gray-700 text-white rounded';
    textarea.placeholder = 'Add your comment here...';
    textarea.value = item.comment || '';

    // Stop propagation of keyboard events from the textarea
    textarea.addEventListener('keydown', (e) => {
      e.stopPropagation();
    });

    // Add actions div
    const actions = document.createElement('div');
    actions.className = 'flex justify-end space-x-2';

    // Add cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className =
      'px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => {
      document.body.removeChild(modalContainer);
      this.keyboardService.enableSpaceKey(); // Re-enable space key detection
    };

    // Add save button
    const saveBtn = document.createElement('button');
    saveBtn.className =
      'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500';
    saveBtn.textContent = 'Save';
    saveBtn.onclick = () => {
      const comment = textarea.value.trim();
      item.comment = comment; // Update the item directly
      this.commentAdded.emit({ id: item.objectId, comment });
      document.body.removeChild(modalContainer);
      this.keyboardService.enableSpaceKey(); // Re-enable space key detection
    };

    // Assemble modal
    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);
    modal.appendChild(title);
    modal.appendChild(textarea);
    modal.appendChild(actions);
    modalContainer.appendChild(modal);

    // Add modal to body
    document.body.appendChild(modalContainer);

    // Focus the textarea
    setTimeout(() => {
      textarea.focus();
    }, 0);

    // Close on backdrop click
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) {
        document.body.removeChild(modalContainer);
        this.keyboardService.enableSpaceKey(); // Re-enable space key detection
      }
    });

    // Also ensure we re-enable if modal is dismissed via escape key
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.body.removeChild(modalContainer);
        this.keyboardService.enableSpaceKey();
        document.removeEventListener('keydown', handleEscapeKey);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
  }
}
