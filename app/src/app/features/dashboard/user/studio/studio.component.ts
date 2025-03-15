import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  HostListener,
  Renderer2,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-studio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './studio.component.html',
  styleUrls: ['./studio.component.css'],
})
export class StudioComponent implements AfterViewInit, OnDestroy {
  imageUrl = 'assets/test.png'; // Replace with dynamic backend data when ready
  drawMode = false; // To toggle drawing mode
  mouseX = 0;
  mouseY = 0;

  // Zoom control properties
  zoomLevel = 1.0;
  zoomFactor = 0.1; // Amount to zoom in/out by
  minZoomLevel = 1; // Minimum zoom level - don't let image get smaller than original fit

  // Flag to track initial zoom
  private initialZoomSet = false;
  private initialZoomLevel = 1.0;

  // Crosshair properties
  showCrosshair = true; // Set to true by default
  crosshairX = 0;
  crosshairY = 0;

  // Original image dimensions for calculating min zoom
  private imageNaturalWidth = 0;
  private imageNaturalHeight = 0;
  private containerWidth = 0;
  private containerHeight = 0;

  @ViewChild('annotationCanvas', { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('imageContainer', { static: false })
  imageContainerRef!: ElementRef<HTMLDivElement>;

  @ViewChild('imageElement', { static: false })
  imageElementRef!: ElementRef<HTMLImageElement>;

  private ctx!: CanvasRenderingContext2D | null;
  private isDrawing = false;
  private polygon: { x: number; y: number }[] = [];
  private resizeObserver?: ResizeObserver;

  constructor(private renderer: Renderer2) {}

  // Keyboard shortcuts - global scope
  @HostListener('window:keydown', ['$event'])
  handleGlobalKeyboardShortcuts(event: KeyboardEvent) {
    // Only process if Ctrl key is pressed for zoom
    if (event.ctrlKey) {
      if (event.key === '+' || event.key === '=') {
        event.preventDefault(); // Prevent browser zoom
        this.zoomIn();
      } else if (event.key === '-') {
        event.preventDefault(); // Prevent browser zoom
        this.zoomOut();
      } else if (event.key === '0') {
        event.preventDefault();
        this.resetZoom();
      }
    } else {
      // Other shortcuts without Ctrl
      if (event.key.toLowerCase() === 'g') {
        this.toggleCrosshair();
      } else if (event.key.toLowerCase() === 'd') {
        this.toggleDrawMode();
      } else if (event.key.toLowerCase() === 'c') {
        this.clearPolygons();
      }
    }
  }

  // Prevent default browser zoom behavior when using Ctrl+wheel
  @HostListener('window:wheel', ['$event'])
  onWindowWheel(event: WheelEvent) {
    if (event.ctrlKey) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');

    // Set initial size
    this.resizeCanvasToContainer();

    // Create ResizeObserver to handle container size changes
    this.resizeObserver = new ResizeObserver(() => {
      this.resizeCanvasToContainer();
      this.redrawPolygons();
    });

    // Observe the canvas's parent element
    this.resizeObserver.observe(canvas.parentElement as Element);

    // Add wheel event listener to the image container
    this.imageContainerRef.nativeElement.addEventListener(
      'wheel',
      this.handleWheel.bind(this),
      { passive: false }
    );

    // Initial update of minimum zoom level
    setTimeout(() => this.updateMinZoomLevel(), 500);
  }

  ngOnDestroy() {
    // Clean up the observer when component is destroyed
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    // Remove event listeners
    if (this.imageContainerRef) {
      this.imageContainerRef.nativeElement.removeEventListener(
        'wheel',
        this.handleWheel.bind(this)
      );
    }
  }

  onImageLoad() {
    if (this.imageElementRef && this.imageElementRef.nativeElement) {
      const img = this.imageElementRef.nativeElement;
      this.imageNaturalWidth = img.naturalWidth;
      this.imageNaturalHeight = img.naturalHeight;

      // Only set the initial zoom level once when the image first loads
      if (!this.initialZoomSet) {
        this.updateMinZoomLevel();
        this.initialZoomLevel = this.zoomLevel; // Store the initial zoom level
        this.initialZoomSet = true;
        console.log('Initial zoom set to: ', this.initialZoomLevel);
      }
    }
  }

  updateMinZoomLevel() {
    if (
      !this.imageElementRef ||
      !this.imageContainerRef ||
      this.imageNaturalWidth === 0
    )
      return;

    const container = this.imageContainerRef.nativeElement;
    this.containerWidth = container.clientWidth;
    this.containerHeight = container.clientHeight;

    // Calculate the ratio to fit the image in the container (ensuring it's at least 95%)
    const widthRatio = this.containerWidth / this.imageNaturalWidth;
    const heightRatio = this.containerHeight / this.imageNaturalHeight;

    // Use the smaller ratio to ensure image fits within container
    const fitRatio = Math.min(widthRatio, heightRatio);

    // Ensure we never zoom out smaller than 95% of the fit ratio
    this.minZoomLevel = fitRatio * 0.95;

    // If current zoom is less than the new minimum, adjust it
    if (this.zoomLevel < this.minZoomLevel) {
      this.zoomLevel = this.minZoomLevel;
      this.applyZoom();
    }
  }

  // Handle mouse wheel zoom
  handleWheel(event: WheelEvent) {
    // Prevent default scrolling behavior
    event.preventDefault();

    // Only zoom if the target is within the image container
    const target = event.target as HTMLElement;
    if (!this.imageContainerRef.nativeElement.contains(target)) {
      return;
    }

    // Ctrl + wheel for zoom
    if (event.ctrlKey) {
      if (event.deltaY < 0) {
        this.zoomIn();
      } else if (event.deltaY > 0) {
        // Only zoom out if we're not already at the initial zoom level
        if (this.zoomLevel > this.initialZoomLevel) {
          this.zoomOut();
        } else {
          // If we're already at initial zoom, make it obvious we can't zoom out further
          this.flashZoomLimitReached();
        }
      }
    } else {
      // Regular wheel for scrolling if needed
      // You can add panning functionality here in the future
    }
  }

  // Zoom control methods
  zoomIn() {
    this.zoomLevel = Math.min(5.0, this.zoomLevel + this.zoomFactor);
    this.applyZoom();
  }

  zoomOut() {
    // Don't allow zooming out smaller than the initial zoom level
    if (this.zoomLevel > this.initialZoomLevel + this.zoomFactor / 2) {
      // Add a small buffer
      this.zoomLevel = Math.max(
        this.initialZoomLevel,
        this.zoomLevel - this.zoomFactor
      );
      this.applyZoom();
    } else {
      this.flashZoomLimitReached();
    }
  }

  resetZoom() {
    // Reset to initial zoom level
    this.zoomLevel = this.initialZoomLevel;
    this.applyZoom();
  }

  // Add a visual feedback when trying to zoom beyond limits
  flashZoomLimitReached() {
    const image = this.imageElementRef.nativeElement;
    if (!image) return;

    // Add a short CSS animation to show we've reached the limit
    this.renderer.addClass(image, 'zoom-limit');

    // Remove the class after the animation completes
    setTimeout(() => {
      this.renderer.removeClass(image, 'zoom-limit');
    }, 300);
  }

  applyZoom() {
    if (this.imageElementRef) {
      this.renderer.setStyle(
        this.imageElementRef.nativeElement,
        'transform',
        `scale(${this.zoomLevel})`
      );
    }
  }

  toggleCrosshair() {
    this.showCrosshair = !this.showCrosshair;
  }

  updateCrosshairPosition(event: MouseEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.crosshairX = event.clientX - rect.left;
    this.crosshairY = event.clientY - rect.top;
  }

  // Check if the event occurred inside the image container
  isEventInImageArea(event: MouseEvent | WheelEvent): boolean {
    if (!this.imageContainerRef) return false;
    const rect = this.imageContainerRef.nativeElement.getBoundingClientRect();
    return (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
  }

  handleKeyboardShortcuts(event: KeyboardEvent) {
    // Additional component-specific keyboard shortcuts can be added here
  }

  private resizeCanvasToContainer() {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement as HTMLElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
  }

  toggleDrawMode() {
    this.drawMode = !this.drawMode;
  }

  startDrawing(event: MouseEvent) {
    if (!this.drawMode) return;
    this.isDrawing = true;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.polygon.push({ x, y });

    // Draw the first point
    if (this.ctx) {
      this.ctx.beginPath();
      this.ctx.arc(x, y, 3, 0, 2 * Math.PI);
      this.ctx.fillStyle = 'yellow';
      this.ctx.fill();
    }
  }

  drawPolygon(event: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    this.mouseX = Math.round(offsetX);
    this.mouseY = Math.round(offsetY);

    if (!this.drawMode || !this.isDrawing || !this.ctx) return;

    // Redraw the canvas with the polygon
    this.redrawPolygons();

    // Draw current line to mouse position
    if (this.polygon.length > 0) {
      const lastPoint = this.polygon[this.polygon.length - 1];
      this.ctx.beginPath();
      this.ctx.moveTo(lastPoint.x, lastPoint.y);
      this.ctx.lineTo(offsetX, offsetY);
      this.ctx.strokeStyle = 'yellow';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  private redrawPolygons() {
    if (!this.ctx) return;

    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.polygon.length < 2) return;

    // Draw all polygon lines
    this.ctx.beginPath();
    this.ctx.moveTo(this.polygon[0].x, this.polygon[0].y);

    for (let i = 1; i < this.polygon.length; i++) {
      this.ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
    }

    // Draw points at each vertex
    this.polygon.forEach((point) => {
      this.ctx!.beginPath();
      this.ctx!.arc(point.x, point.y, 3, 0, 2 * Math.PI);
      this.ctx!.fillStyle = 'yellow';
      this.ctx!.fill();
    });

    // Connect lines
    this.ctx.strokeStyle = 'yellow';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  finishDrawing() {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.redrawPolygons();
  }

  clearPolygons() {
    this.polygon = [];
    if (this.ctx) {
      this.ctx.clearRect(
        0,
        0,
        this.canvasRef.nativeElement.width,
        this.canvasRef.nativeElement.height
      );
    }
  }
}
