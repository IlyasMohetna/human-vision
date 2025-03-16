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
import POLYGONS from './data';

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

  private polygonData = POLYGONS;

  // Add these constants near the top of the class
  private readonly POLYGON_BORDER_COLOR = 'yellow';
  private readonly POLYGON_BORDER_WIDTH = 3;
  private readonly POLYGON_FILL_COLOR = 'rgba(255, 255, 0, 0.2)'; // semi-transparent yellow
  private readonly VERTEX_COLOR = 'yellow';
  private readonly VERTEX_RADIUS = 4;

  constructor(private renderer: Renderer2) {}

  // Keyboard shortcuts - global scope
  @HostListener('window:keydown', ['$event'])
  handleGlobalKeyboardShortcuts(event: KeyboardEvent) {
    if (event.ctrlKey) {
      // Support multiple key values for '+' or '-'
      if (event.key === '+' || event.key === '=' || event.key === 'Add') {
        event.preventDefault();
        this.zoomIn();
      } else if (
        event.key === '-' ||
        event.key === 'Subtract' ||
        event.key === '_'
      ) {
        event.preventDefault();
        this.zoomOut();
      } else if (event.key === '0') {
        event.preventDefault();
        this.resetZoom();
      }
    } else {
      // Remove direct panning = true
      if (event.key === ' ') {
        event.preventDefault();
        this.spacePressed = true;
      }
      if (event.key.toLowerCase() === 'g') {
        this.toggleCrosshair();
      } else if (event.key.toLowerCase() === 'd') {
        this.toggleDrawMode();
      } else if (event.key.toLowerCase() === 'c') {
        this.clearPolygons();
      }
    }
  }

  // Listen for space release
  @HostListener('window:keyup', ['$event'])
  handleGlobalKeyboardShortcutsUp(event: KeyboardEvent) {
    if (event.key === ' ') {
      event.preventDefault();
      this.spacePressed = false;
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

  @HostListener('document:mousemove', ['$event'])
  onMouseMoveDocument(event: MouseEvent) {
    if (!this.panning) return;
    this.translateX = event.clientX - this.panningStartX;
    this.translateY = event.clientY - this.panningStartY;
    this.applyTransform();
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUpDocument() {
    this.panning = false;
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
        this.loadImportedPolygon();
      }
    }
  }

  private loadImportedPolygon() {
    if (!this.ctx || !this.imageElementRef || !this.canvasRef) return;

    // Wait a bit to ensure everything is rendered
    setTimeout(() => {
      // Get image and canvas dimensions
      const imageElement = this.imageElementRef.nativeElement;
      const canvas = this.canvasRef.nativeElement;

      // Get image position within viewport
      const imageRect = imageElement.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();

      // Calculate offset from canvas to image
      const offsetX = imageRect.left - canvasRect.left;
      const offsetY = imageRect.top - canvasRect.top;

      // Calculate scale factor between natural image size and displayed image
      const scaleX = imageElement.clientWidth / this.imageNaturalWidth;
      const scaleY = imageElement.clientHeight / this.imageNaturalHeight;

      // Map coordinates from data to canvas space
      this.polygon = this.polygonData.map(([x, y]) => ({
        x: offsetX + x * scaleX,
        y: offsetY + y * scaleY,
      }));

      console.log('Drawing polygon:', this.polygon);
      this.redrawPolygons();
    }, 500); // Give it 500ms to render properly
  }

  ngAfterViewChecked() {
    if (this.polygon.length > 0 && this.ctx) {
      // Redraw polygons after view updates to ensure they remain visible
      this.redrawPolygons();
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

  showCoordinates = false;
  displayedCoordinateX = 0;
  displayedCoordinateY = 0;

  updateCrosshairPosition(event: MouseEvent) {
    // Calculate position relative to the parent div
    const parentRect = (
      event.currentTarget as HTMLElement
    ).getBoundingClientRect();
    this.crosshairX = event.clientX - parentRect.left;
    this.crosshairY = event.clientY - parentRect.top;

    // Check if the cursor is inside the scaled image
    if (!this.imageElementRef) return;
    const imageRect =
      this.imageElementRef.nativeElement.getBoundingClientRect();
    const isInsideImage =
      event.clientX >= imageRect.left &&
      event.clientX <= imageRect.right &&
      event.clientY >= imageRect.top &&
      event.clientY <= imageRect.bottom;

    if (isInsideImage) {
      const scale = this.zoomLevel;
      const offsetX = event.clientX - imageRect.left;
      const offsetY = event.clientY - imageRect.top;
      this.displayedCoordinateX = Math.round(offsetX / scale);
      this.displayedCoordinateY = Math.round(offsetY / scale);
      this.showCoordinates = true;
    } else {
      this.showCoordinates = false;
    }
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
      this.ctx.arc(x, y, this.VERTEX_RADIUS, 0, 2 * Math.PI);
      this.ctx.fillStyle = this.VERTEX_COLOR;
      this.ctx.fill();
      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
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
      this.ctx.strokeStyle = this.POLYGON_BORDER_COLOR;
      this.ctx.lineWidth = this.POLYGON_BORDER_WIDTH;
      this.ctx.stroke();
    }
  }

  private redrawPolygons() {
    if (!this.ctx) return;

    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.polygon.length < 2) return;

    // First draw the filled area
    this.ctx.beginPath();
    this.ctx.moveTo(this.polygon[0].x, this.polygon[0].y);

    for (let i = 1; i < this.polygon.length; i++) {
      this.ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
    }

    // Close the polygon path
    this.ctx.closePath();

    // Fill with semi-transparent color
    this.ctx.fillStyle = this.POLYGON_FILL_COLOR;
    this.ctx.fill();

    // Then draw the border with thicker line
    this.ctx.strokeStyle = this.POLYGON_BORDER_COLOR;
    this.ctx.lineWidth = this.POLYGON_BORDER_WIDTH;
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();

    // Draw points at each vertex
    this.polygon.forEach((point) => {
      this.ctx!.beginPath();
      this.ctx!.arc(point.x, point.y, this.VERTEX_RADIUS, 0, 2 * Math.PI);
      this.ctx!.fillStyle = this.VERTEX_COLOR;
      this.ctx!.fill();
      this.ctx!.strokeStyle = 'black';
      this.ctx!.lineWidth = 1;
      this.ctx!.stroke();
    });
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

  public isMouseInContainer = false;

  handleMouseEnterContainer() {
    this.isMouseInContainer = true;
  }

  handleMouseLeaveContainer() {
    this.isMouseInContainer = false;
    this.showCoordinates = false; // Hide coordinates once we leave
  }

  // Add panning state & offsets
  panning = false;
  private panningStartX = 0;
  private panningStartY = 0;
  private translateX = 0;
  private translateY = 0;
  private spacePressed = false;

  // Handle mousedown on our parent container
  onMouseDownContainer(event: MouseEvent) {
    if (this.spacePressed) {
      this.panning = true; // Only start panning if space is pressed & mouse is down
      this.panningStartX = event.clientX - this.translateX;
      this.panningStartY = event.clientY - this.translateY;
    } else {
      this.startDrawing(event);
    }
  }

  onMouseMoveContainer(event: MouseEvent) {
    if (!this.panning) {
      this.drawPolygon(event);
    }
  }

  onMouseUpContainer(event: MouseEvent) {
    this.finishDrawing();
  }

  // Apply both translate + scale
  private applyTransform() {
    if (this.imageElementRef) {
      this.renderer.setStyle(
        this.imageElementRef.nativeElement,
        'transform',
        `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoomLevel})`
      );
    }
  }
}
