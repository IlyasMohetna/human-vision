import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-comment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './comment-modal.component.html',
  styles: [
    `
      /* Custom animation for modal entry */
      @keyframes modalEntry {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      /* Disable browser's default focus ring */
      textarea:focus {
        outline: none !important;
        box-shadow: none !important;
      }

      .animate-modalEntry {
        animation: modalEntry 0.2s ease-out;
      }
    `,
  ],
})
export class CommentModalComponent implements OnInit, OnChanges {
  @Input() item: any = null;
  @Input() isVisible = false;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ id: string; comment: string }>();

  commentText = '';

  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas);
  }

  ngOnInit(): void {
    this.initializeComment();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['item'] && this.item) {
      this.initializeComment();
    }
  }

  private initializeComment(): void {
    this.commentText = this.item?.comment || '';
  }

  onClose(): void {
    this.close.emit();
  }

  onSave(): void {
    if (this.item) {
      this.save.emit({
        id: this.item.objectId,
        comment: this.commentText.trim(),
      });
    }
  }

  onEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onClose();
    }
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}
