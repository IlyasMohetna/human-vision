import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  HostListener,
  Renderer2,
  NgZone,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import POLYGONS, { PolygonData } from './data';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-studio',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
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

  // New: Type colors map
  private readonly TYPE_COLORS = {
    high: {
      border: 'rgba(255, 0, 0, 1)', // Solid red
      fill: 'rgba(255, 0, 0, 0.2)', // Semi-transparent red
    },
    medium: {
      border: 'rgba(255, 255, 0, 1)', // Solid yellow
      fill: 'rgba(255, 255, 0, 0.2)', // Semi-transparent yellow
    },
    low: {
      border: 'rgba(0, 255, 0, 1)', // Solid green
      fill: 'rgba(0, 255, 0, 0.2)', // Semi-transparent green
    },
  };

  // Replace polygonData with this
  public polygonDataList: PolygonData[] = POLYGONS;

  // The currently active/displayed polygons
  activePolygons: { [id: string]: boolean } = {};

  // Modified polygon storage to include type information
  private polygons: {
    [id: string]: {
      points: { x: number; y: number }[];
      type: 'high' | 'medium' | 'low';
      label?: string;
    };
  } = {};

  // Add these constants near the top of the class
  private readonly POLYGON_BORDER_COLOR = 'yellow';
  private readonly POLYGON_BORDER_WIDTH = 3;
  private readonly POLYGON_FILL_COLOR = 'rgba(255, 255, 0, 0.2)'; // semi-transparent yellow
  private readonly VERTEX_COLOR = 'yellow';
  private readonly VERTEX_RADIUS = 4;

  // Add this property to track which polygon is being hovered
  hoveredPolygonId: string | null = null;

  // Add these properties to store original polygon coordinates
  private originalPolygons: {
    [id: string]: {
      points: { x: number; y: number }[];
      type: 'high' | 'medium' | 'low';
      label?: string;
    };
  } = {};

  // Add this property to store image center
  private imageCenter = { x: 0, y: 0 };

  // Add this property to better track and debug the transforms
  private lastTransformApplied = '';

  // Add these properties for smoother animations
  private animationFrameId: number | null = null;
  private zoomUpdatePending = false;
  private lastZoomTime = 0;
  private readonly ZOOM_THROTTLE_MS = 10; // Throttle to improve performance

  constructor(private renderer: Renderer2, private ngZone: NgZone) {
    // Initialize all polygons as active
    this.polygonDataList.forEach((poly) => {
      this.activePolygons[poly.id] = true;
    });
  }

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

    // Cancel any pending animations
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
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
        this.loadImportedPolygons();
      }
    }
  }

  private loadImportedPolygons() {
    if (!this.ctx || !this.imageElementRef || !this.canvasRef) {
      console.warn("Can't load polygons - dependencies not ready");
      return;
    }

    console.log('Loading polygons...');

    // Wait a bit to ensure everything is rendered
    setTimeout(() => {
      // Get image and canvas dimensions
      const imageElement = this.imageElementRef.nativeElement;
      const canvas = this.canvasRef.nativeElement;

      // Get image position within viewport
      const imageRect = imageElement.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();

      // Store image center coordinates - relative to canvas
      this.imageCenter = {
        x: (imageRect.left + imageRect.right) / 2 - canvasRect.left,
        y: (imageRect.top + imageRect.bottom) / 2 - canvasRect.top,
      };

      // Now that we have the image center, calculate offsets from center
      const offsetX = imageRect.left - canvasRect.left;
      const offsetY = imageRect.top - canvasRect.top;

      // Calculate scale factor between natural image size and displayed image
      const scaleX = imageElement.clientWidth / this.imageNaturalWidth;
      const scaleY = imageElement.clientHeight / this.imageNaturalHeight;

      // Process all polygons
      this.originalPolygons = {}; // Store the original coordinates
      this.polygons = {};

      this.polygonDataList.forEach((polyData) => {
        // Map coordinates from data to canvas space
        const points = polyData.points.map(([x, y]) => ({
          x: offsetX + x * scaleX,
          y: offsetY + y * scaleY,
        }));

        // Store both original and transformed coordinates
        this.originalPolygons[polyData.id] = {
          points: [...points], // Clone the points
          type: polyData.type,
          label: polyData.label,
        };

        this.polygons[polyData.id] = {
          points: [...points], // Clone the points
          type: polyData.type,
          label: polyData.label,
        };
      });

      console.log('Image center:', this.imageCenter);
      console.log('Loaded polygons:', this.polygons);
      this.redrawAllPolygons();
    }, 500);
  }

  // Toggle a specific polygon's visibility
  togglePolygon(id: string) {
    this.activePolygons[id] = !this.activePolygons[id];
    this.redrawAllPolygons();
  }

  // New method to draw all polygons
  private redrawAllPolygons() {
    if (!this.ctx || !this.imageElementRef) return;

    const canvas = this.canvasRef.nativeElement;

    // Clear with a single operation for better performance
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Setup clipping once outside the loop
    const imageRect =
      this.imageElementRef.nativeElement.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(
      imageRect.left - canvasRect.left,
      imageRect.top - canvasRect.top,
      imageRect.width,
      imageRect.height
    );
    this.ctx.clip();

    // Batch all non-hovered polygons first to minimize state changes
    Object.entries(this.polygons).forEach(([id, poly]) => {
      if (
        this.activePolygons[id] &&
        id !== this.hoveredPolygonId &&
        poly.points.length >= 2
      ) {
        const colors = this.TYPE_COLORS[poly.type];

        this.ctx!.beginPath();
        this.ctx!.moveTo(poly.points[0].x, poly.points[0].y);

        for (let i = 1; i < poly.points.length; i++) {
          this.ctx!.lineTo(poly.points[i].x, poly.points[i].y);
        }

        this.ctx!.closePath();
        this.ctx!.fillStyle = colors.fill;
        this.ctx!.fill();

        this.ctx!.strokeStyle = colors.border;
        this.ctx!.lineWidth = this.POLYGON_BORDER_WIDTH;
        this.ctx!.lineJoin = 'round';
        this.ctx!.stroke();

        // We removed the code that draws vertex points here
      }
    });

    // Draw the hovered polygon with special effects
    if (this.hoveredPolygonId && this.activePolygons[this.hoveredPolygonId]) {
      const poly = this.polygons[this.hoveredPolygonId];
      if (poly && poly.points.length >= 2) {
        this.drawSinglePolygon(poly.points, poly.type, true);
      }
    }

    this.ctx.restore();
  }

  // New method to draw a single polygon with the correct color
  private drawSinglePolygon(
    points: { x: number; y: number }[],
    type: 'high' | 'medium' | 'low',
    isHovered: boolean = false
  ) {
    if (!this.ctx || points.length < 2) return;

    const colors = this.TYPE_COLORS[type];

    // Draw filled area
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }

    // Close the polygon path
    this.ctx.closePath();

    // For hovered polygons, use more opaque fill and add shadow
    if (isHovered) {
      // Add shadow for highlight effect
      this.ctx.shadowColor = colors.border;
      this.ctx.shadowBlur = 15;

      // Use more opaque fill for hover
      this.ctx.fillStyle = colors.fill.replace('0.2', '0.4'); // Make fill more opaque
    } else {
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = colors.fill;
    }

    this.ctx.fill();

    // Draw the border with thicker line for hovered polygons
    this.ctx.strokeStyle = colors.border;
    this.ctx.lineWidth = isHovered
      ? this.POLYGON_BORDER_WIDTH + 2
      : this.POLYGON_BORDER_WIDTH;
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();

    // Reset shadow
    this.ctx.shadowBlur = 0;

    // Don't draw vertex points for any polygons - remove this section entirely
    // We're removing the code that draws points at each vertex
  }

  // Add these methods to handle hover events
  setHoveredPolygon(id: string) {
    this.hoveredPolygonId = id;
    this.redrawAllPolygons();
  }

  clearHoveredPolygon() {
    this.hoveredPolygonId = null;
    this.redrawAllPolygons();
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

    // Ctrl + wheel for zoom with improved throttling
    if (event.ctrlKey) {
      event.preventDefault();

      // Calculate zoom amount based on wheel delta for smoother zooming
      const zoomDelta = event.deltaY * -0.001; // Smaller increments for smoother zoom

      if (zoomDelta > 0) {
        // Don't create a new zoom operation if we have one pending
        if (!this.zoomUpdatePending) {
          this.zoomIn();
        }
      } else if (zoomDelta < 0) {
        if (!this.zoomUpdatePending && this.zoomLevel > this.initialZoomLevel) {
          this.zoomOut();
        } else if (this.zoomLevel <= this.initialZoomLevel) {
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
    // Throttle the zoom operations
    const now = Date.now();
    if (now - this.lastZoomTime < this.ZOOM_THROTTLE_MS) {
      if (!this.zoomUpdatePending) {
        this.zoomUpdatePending = true;
        setTimeout(() => {
          this.zoomLevel = Math.min(5.0, this.zoomLevel + this.zoomFactor);
          this.applyTransform();
          this.zoomUpdatePending = false;
          this.lastZoomTime = Date.now();
        }, this.ZOOM_THROTTLE_MS);
      }
      return;
    }

    this.zoomLevel = Math.min(5.0, this.zoomLevel + this.zoomFactor);
    this.applyTransform();
    this.lastZoomTime = now;
  }

  zoomOut() {
    // Throttle the zoom operations
    const now = Date.now();
    if (now - this.lastZoomTime < this.ZOOM_THROTTLE_MS) {
      if (!this.zoomUpdatePending) {
        this.zoomUpdatePending = true;
        setTimeout(() => {
          if (this.zoomLevel > this.initialZoomLevel + this.zoomFactor / 2) {
            this.zoomLevel = Math.max(
              this.initialZoomLevel,
              this.zoomLevel - this.zoomFactor
            );
            this.applyTransform();
          } else {
            this.flashZoomLimitReached();
          }
          this.zoomUpdatePending = false;
          this.lastZoomTime = Date.now();
        }, this.ZOOM_THROTTLE_MS);
      }
      return;
    }

    // Don't allow zooming out smaller than the initial zoom level
    if (this.zoomLevel > this.initialZoomLevel + this.zoomFactor / 2) {
      this.zoomLevel = Math.max(
        this.initialZoomLevel,
        this.zoomLevel - this.zoomFactor
      );
      this.applyTransform();
    } else {
      this.flashZoomLimitReached();
    }
    this.lastZoomTime = now;
  }

  resetZoom() {
    // Reset to initial zoom level
    this.zoomLevel = this.initialZoomLevel;
    this.translateX = 0; // Also reset translation
    this.translateY = 0;
    this.applyTransform();
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

  applyTransform() {
    if (!this.imageElementRef) return;

    // Cancel any pending animation frame to prevent multiple redraws
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    const transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoomLevel})`;

    // Apply transforms to image element immediately for responsiveness
    if (this.panning) {
      this.renderer.setStyle(
        this.imageElementRef.nativeElement,
        'transition',
        'none'
      );
    } else {
      this.renderer.setStyle(
        this.imageElementRef.nativeElement,
        'transition',
        'transform 0.05s ease-out'
      );
    }

    this.renderer.setStyle(
      this.imageElementRef.nativeElement,
      'transform',
      transform
    );
    this.lastTransformApplied = transform;

    // Always ensure polygons are properly updated
    this.animationFrameId = requestAnimationFrame(() => {
      // Make sure originalPolygons exists before trying to update
      if (
        this.originalPolygons &&
        Object.keys(this.originalPolygons).length > 0
      ) {
        this.updatePolygonsForTransform();
      } else {
        // If we don't have polygon data, try to reload
        this.loadImportedPolygons();
      }
      this.animationFrameId = null;
    });
  }

  // New method to update polygon positions based on current transform
  private updatePolygonsForTransform() {
    if (
      !this.originalPolygons ||
      Object.keys(this.originalPolygons).length === 0 ||
      !this.imageElementRef
    )
      return;

    // Get the current image position and dimensions
    const imageRect =
      this.imageElementRef.nativeElement.getBoundingClientRect();
    const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();

    // Calculate image to canvas offset - IMPORTANT for proper positioning
    const offsetX = imageRect.left - canvasRect.left;
    const offsetY = imageRect.top - canvasRect.top;

    // For each polygon, apply the current transform to its original coordinates
    Object.keys(this.originalPolygons).forEach((id) => {
      const original = this.originalPolygons[id];

      // Apply the transform to each point more accurately
      this.polygons[id] = {
        ...original,
        points: original.points.map((point) => {
          // Calculate position relative to image center for scaling
          const relativeX = point.x - this.imageCenter.x;
          const relativeY = point.y - this.imageCenter.y;

          // Apply scaling to relative coordinates
          const scaledX = relativeX * this.zoomLevel;
          const scaledY = relativeY * this.zoomLevel;

          // Translate back to absolute coordinates (from center)
          return {
            x: this.imageCenter.x + scaledX + this.translateX,
            y: this.imageCenter.y + scaledY + this.translateY,
          };
        }),
      };
    });

    // Store transform applied for debugging
    this.lastTransformApplied = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoomLevel})`;

    // Redraw with the updated positions
    this.redrawAllPolygons();
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

    // If we have polygons, reload them to adjust to new canvas size
    if (this.polygonDataList.length > 0 && this.imageElementRef) {
      this.loadImportedPolygons();
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
    // First redraw all the saved polygons
    this.redrawAllPolygons();

    // Then draw the current active polygon being created
    if (this.polygon.length >= 2 && this.ctx) {
      // For active drawing, use yellow (or any preferred color)
      this.ctx.beginPath();
      this.ctx.moveTo(this.polygon[0].x, this.polygon[0].y);

      for (let i = 1; i < this.polygon.length; i++) {
        this.ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
      }

      // Draw with default yellow style
      this.ctx.fillStyle = this.POLYGON_FILL_COLOR;
      this.ctx.fill();
      this.ctx.strokeStyle = this.POLYGON_BORDER_COLOR;
      this.ctx.lineWidth = this.POLYGON_BORDER_WIDTH;
      this.ctx.lineJoin = 'round';
      this.ctx.stroke();

      // Draw vertex points
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
  public spacePressed = false;

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

  // Add this new method to refresh polygons after saving
  refreshPolygons() {
    // First check if there's anything to refresh
    if (Object.keys(this.originalPolygons).length === 0) {
      // If original data is empty, reload from data source
      this.loadImportedPolygons();
      return;
    }

    // If we have polygon data, recalculate positions and redraw
    this.updatePolygonsForTransform();

    // Force a redraw of the canvas
    if (this.ctx) {
      // Request animation frame for smooth rendering
      requestAnimationFrame(() => {
        this.redrawAllPolygons();
      });
    }
  }

  // Use this when saving (call this at the end of your save method)
  saveChanges() {
    // Your existing save logic here...

    // After saving, refresh the polygons to ensure they remain visible
    setTimeout(() => {
      this.refreshPolygons();
    }, 100); // Small delay to ensure any state changes have settled
  }

  // Add a method to check polygon visibility for debugging
  checkPolygonsVisibility() {
    console.log(
      'Original polygons:',
      Object.keys(this.originalPolygons).length
    );
    console.log('Transformed polygons:', Object.keys(this.polygons).length);
    console.log('Active flags:', this.activePolygons);
  }
}
