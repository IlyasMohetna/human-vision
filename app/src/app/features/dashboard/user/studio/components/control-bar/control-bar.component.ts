import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { ControlBarItemComponent } from './components/control-bar-item/control-bar-item.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-control-bar',
  standalone: true,
  imports: [
    FontAwesomeModule,
    CommonModule,
    ControlBarItemComponent,
    FormsModule,
  ],
  templateUrl: './control-bar.component.html',
  styles: ``,
})
export class ControlBarComponent {
  @Input() zoomLevel = 1;
  @Input() isPanning = false;
  @Output() zoomIn = new EventEmitter<void>();
  @Output() zoomOut = new EventEmitter<void>();
  @Output() resetZoom = new EventEmitter<void>();
  @Output() toggleCrosshair = new EventEmitter<void>();
  @Input() isCrosshair = false;
  @Output() maxZoom = new EventEmitter<void>();
  @Output() togglePanning = new EventEmitter<void>();
  @Output() allPolygonsVisibilityToggled = new EventEmitter<boolean>();
  @Output() compareModeToggled = new EventEmitter<void>();
  @Input() compareMode = false;
  public allPolygonsVisible: boolean = true;

  @Input() variants: any[] = [];
  @Input() selectedVariantA = '';
  @Input() selectedVariantB = '';
  @Output() selectedVariantAChange = new EventEmitter<string>();
  @Output() selectedVariantBChange = new EventEmitter<string>();

  showCopyTooltip = false;
  copyTooltipText = '';

  toggleAllPolygonsVisibility() {
    this.allPolygonsVisible = !this.allPolygonsVisible;
    this.allPolygonsVisibilityToggled.emit(this.allPolygonsVisible);
  }

  onCompareModeClick() {
    this.compareModeToggled.emit();
  }

  onVariantAChanged(variantPath: string) {
    this.selectedVariantA = variantPath;
    this.selectedVariantAChange.emit(variantPath);
  }

  onVariantBChanged(variantPath: string) {
    this.selectedVariantB = variantPath;
    this.selectedVariantBChange.emit(variantPath);
  }

  copyOriginalImageUrl() {
    const originalImage = this.variants.find(
      (variant) => variant.type === 'Original Image'
    );

    if (originalImage) {
      const canvas = document.createElement('canvas');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) {
              try {
                const clipboardItem = new ClipboardItem({ 'image/png': blob });
                navigator.clipboard
                  .write([clipboardItem])
                  .then(() => {
                    this.copyTooltipText = 'Image copied!';
                    this.showCopyTooltip = true;
                  })
                  .catch((err) => {
                    console.error('Image copy failed: ', err);
                    this.fallbackImageCopy(canvas);
                  });
              } catch (e) {
                this.fallbackImageCopy(canvas);
              }
            }

            setTimeout(() => {
              this.showCopyTooltip = false;
            }, 2000);
          });
        }
      };

      img.src = originalImage.path;
      img.crossOrigin = 'Anonymous';
    }
  }

  private fallbackImageCopy(canvas: HTMLCanvasElement) {
    try {
      const dataUrl = canvas.toDataURL('image/png');
      navigator.clipboard
        .writeText(dataUrl)
        .then(() => {
          this.copyTooltipText = 'Image copied as data URL!';
          this.showCopyTooltip = true;
        })
        .catch((err) => {
          console.error('Data URL copy failed: ', err);
          this.copyTooltipText = 'Copy failed - check console';
          this.showCopyTooltip = true;
        });
    } catch (e) {
      console.error('Fallback copy failed: ', e);
      this.copyTooltipText = 'Copy failed - check console';
      this.showCopyTooltip = true;
    }
  }
}
