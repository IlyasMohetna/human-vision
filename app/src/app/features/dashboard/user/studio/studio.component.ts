import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  HostListener,
  Renderer2,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ControlBarComponent } from './components/control-bar/control-bar.component';
import { LeftSideBarComponent } from './components/left-side-bar/left-side-bar.component';
import { RightSideBarComponent } from './components/right-side-bar/right-side-bar.component';
import { LoadingOverlayComponent } from './components/loading-overlay/loading-overlay.component';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { PolygonDataService } from '../../../../services/polygon-data.service';
import { PolygonDataMap } from './polygon.types';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-studio',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    ControlBarComponent,
    LeftSideBarComponent,
    RightSideBarComponent,
    DragDropModule,
    HttpClientModule,
    LoadingOverlayComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './studio.component.html',
  styleUrls: ['./studio.component.css'],
})
export class StudioComponent implements AfterViewInit, OnDestroy, OnInit {
  imageUrl = '';
  drawMode = false;
  mouseX = 0;
  mouseY = 0;

  zoomLevel = 1.0;
  zoomFactor = 0.1;
  minZoomLevel = 1;

  private initialZoomSet = false;
  private initialZoomLevel = 1.0;

  showCrosshair = true;
  crosshairX = 0;
  crosshairY = 0;

  private imageNaturalWidth = 0;
  private imageNaturalHeight = 0;
  private containerWidth = 0;
  private containerHeight = 0;

  variants: any[] = [];
  metadata: any = {};
  vehicle: any = {};
  public datasetId: number | null = null;

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

  // New: Type colors map - fix the type definition
  private readonly TYPE_COLORS: Record<
    string,
    { border: string; fill: string }
  > = {
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
    blue: {
      border: 'rgba(0, 120, 255, 1)', // Solid blue
      fill: 'rgba(0, 120, 255, 0.2)', // Semi-transparent blue
    },
    default: {
      // Change default to blue "info" color instead of gray
      border: 'rgba(0, 120, 255, 1)', // Blue
      fill: 'rgba(0, 120, 255, 0.2)',
    },
    unassigned: {
      // Add explicit unassigned for clarity
      border: 'rgba(0, 120, 255, 1)', // Blue
      fill: 'rgba(0, 120, 255, 0.2)',
    },
  };

  // Replace polygon data type with new structure
  public polygonDataList: any[] = [];

  // The currently active/displayed polygons
  activePolygons: { [id: string]: boolean } = {};

  // Modified polygon storage to include type information
  private polygons: PolygonDataMap = {};

  // Add these constants near the top of the class
  private readonly POLYGON_BORDER_COLOR = 'yellow';
  private readonly POLYGON_BORDER_WIDTH = 3;
  private readonly POLYGON_FILL_COLOR = 'rgba(255, 255, 0, 0.2)'; // semi-transparent yellow
  private readonly VERTEX_COLOR = 'yellow';
  private readonly VERTEX_RADIUS = 4;

  // Add this property to track which polygon is being hovered
  hoveredPolygonId: string | null = null;

  // Add these properties to store original polygon coordinates
  private originalPolygons: PolygonDataMap = {};

  // Add this property to store image center
  private imageCenter = { x: 0, y: 0 };

  // Add this property to better track and debug the transforms
  private lastTransformApplied = '';

  // Add these properties for smoother animations
  private animationFrameId: number | null = null;
  private zoomUpdatePending = false;
  private lastZoomTime = 0;
  private readonly ZOOM_THROTTLE_MS = 10; // Throttle to improve performance

  // Navigation items for the sidebar
  sidebarNavItems = [
    { icon: '📁', label: 'Project' },
    { icon: '🔧', label: 'Tools' },
    { icon: '🔍', label: 'Zoom' },
    { icon: '📋', label: 'Annotations' },
  ];

  // Currently selected sidebar item (default to Tools)
  selectedSidebarItem = 1; // Start with Tools selected

  // Lists for different priority annotations
  highPriorityAnnotations: any[] = [];
  mediumPriorityAnnotations: any[] = [];
  lowPriorityAnnotations: any[] = [];
  unassignedAnnotations: any[] = [];

  // Add the missing isDragging property
  private isDragging = false;

  // Add loading state variables
  isLoading = true;
  studioHash = '';
  currentImageUrl = '';

  constructor(
    private renderer: Renderer2,
    private polygonDataService: PolygonDataService,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {
    // Generate a random hash when component is initialized
    this.studioHash = this.generateRandomHash();
  }

  // Method to generate a random hash
  private generateRandomHash(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
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

  ngOnInit() {
    this.loadDatasetId();

    this.route.data.subscribe((data) => {
      if (data['randomHash']) {
        if (typeof data['randomHash'] === 'function') {
          this.studioHash = data['randomHash']();
        } else {
          this.studioHash = data['randomHash'];
        }
      }
    });
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

    // Fetch data from the service
    this.loadPolygonData();
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

  private loadDatasetId() {
    this.http
      .get('http://localhost:9400/api/dataset/random')
      .subscribe((res: any) => {
        this.datasetId = res.id;
      });
  }

  private loadPolygonData() {
    this.isLoading = true; // Ensure loading is shown

    this.polygonDataService.fetchPolygonData().subscribe({
      next: (response) => {
        // Set the polygon data list from objects array
        this.polygonDataList = response.objects || [];

        // Initialize all polygons as active
        this.polygonDataList.forEach((poly) => {
          this.activePolygons[poly.objectId] = true;

          // Distribute to categories based on label type
          this.categorizePolygon(poly);
        });

        this.metadata = [response.meta || {}];

        this.vehicle = response.vehicle || {};

        if (response.variants && response.variants.length > 0) {
          const originalImage = response.variants.find(
            (variant: any) => variant.type === 'Original Image'
          );

          this.variants = response.variants;

          if (originalImage && originalImage.path) {
            this.imageUrl = originalImage.path;
            this.currentImageUrl = originalImage.path;
          }
        }

        // Add a delay before hiding the loading overlay
        setTimeout(() => {
          this.isLoading = false;
        }, 2000); // Wait 2 more seconds after data is loaded
      },
      error: (error) => {
        console.error('Error fetching polygon data:', error);
        // Hide loading even on error, after a delay
        setTimeout(() => {
          this.isLoading = false;
        }, 2000);
      },
    });
  }

  private categorizePolygon(polygon: any) {
    switch (polygon.label?.toLowerCase()) {
      case 'person':
        this.highPriorityAnnotations.push(polygon);
        break;
      case 'car':
      case 'bicycle':
      case 'motorcycle':
        this.mediumPriorityAnnotations.push(polygon);
        break;
      case 'traffic sign':
      case 'traffic light':
        this.lowPriorityAnnotations.push(polygon);
        break;
      default:
        this.unassignedAnnotations.push(polygon);
        break;
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
        // Map coordinates from data to canvas space - now using polygon instead of points
        if (!polyData.polygon || !Array.isArray(polyData.polygon)) {
          console.warn('Invalid polygon data for:', polyData);
          return;
        }

        const points = polyData.polygon.map(([x, y]: [number, number]) => ({
          x: offsetX + x * scaleX,
          y: offsetY + y * scaleY,
        }));

        // Store both original and transformed coordinates
        this.originalPolygons[polyData.objectId] = {
          points: [...points], // Clone the points
          type: polyData.type,
          label: polyData.label,
        };

        this.polygons[polyData.objectId] = {
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
        // Get the corresponding polygon data
        const polygonData = this.polygonDataList.find((p) => p.objectId === id);

        // Use priority for color if available, otherwise default to label-based color
        const colorType =
          polygonData?.priority ||
          this.getColorTypeFromLabel(polygonData?.label);

        // Now we know colorType is always a valid key
        const colors =
          this.TYPE_COLORS[colorType] || this.TYPE_COLORS['default'];

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
      }
    });

    // Draw the hovered polygon with special effects
    if (this.hoveredPolygonId && this.activePolygons[this.hoveredPolygonId]) {
      const poly = this.polygons[this.hoveredPolygonId];
      if (poly && poly.points.length >= 2) {
        const polygonData = this.polygonDataList.find(
          (p) => p.objectId === this.hoveredPolygonId
        );

        // Use priority for color if available, otherwise default to label-based color
        const colorType =
          polygonData?.priority ||
          this.getColorTypeFromLabel(polygonData?.label);

        this.drawSinglePolygon(poly.points, colorType, true);
      }
    }

    this.ctx.restore();
  }

  // Updated method signature to accept string instead of specific union type
  private drawSinglePolygon(
    points: { x: number; y: number }[],
    type: string,
    isHovered: boolean = false
  ) {
    if (!this.ctx || points.length < 2) return;

    // Use default if type is not found
    const colors = this.TYPE_COLORS[type] || this.TYPE_COLORS['default'];

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
  }

  // Helper method to get a valid color type from a label
  private getColorTypeFromLabel(label: string | undefined): string {
    if (!label) return 'unassigned'; // Changed from 'default' to 'unassigned'

    const labelLower = label.toLowerCase();

    if (['person', 'pedestrian'].includes(labelLower)) {
      return 'high';
    } else if (['car', 'bicycle', 'motorcycle'].includes(labelLower)) {
      return 'medium';
    } else if (['traffic sign', 'traffic light'].includes(labelLower)) {
      return 'low';
    }

    return 'unassigned'; // Changed from 'default' to 'unassigned'
  }

  setHoveredPolygon(id: string | null) {
    if (this.hoveredPolygonId !== id) {
      console.log('Setting hovered polygon:', id);
      this.hoveredPolygonId = id;
      this.redrawAllPolygons();
    }
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

  handleWheel(event: WheelEvent) {
    event.preventDefault();

    const target = event.target as HTMLElement;
    if (!this.imageContainerRef.nativeElement.contains(target)) {
      return;
    }

    if (event.ctrlKey) {
      event.preventDefault();

      const zoomDelta = event.deltaY * -0.001;

      if (zoomDelta > 0) {
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
    }
  }

  zoomIn() {
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
    this.zoomLevel = this.initialZoomLevel;
    this.translateX = 0;
    this.translateY = 0;
    this.applyTransform();
  }

  flashZoomLimitReached() {
    const image = this.imageElementRef.nativeElement;
    if (!image) return;

    this.renderer.addClass(image, 'zoom-limit');

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

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    const transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoomLevel})`;

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

    this.animationFrameId = requestAnimationFrame(() => {
      if (
        this.originalPolygons &&
        Object.keys(this.originalPolygons).length > 0
      ) {
        this.updatePolygonsForTransform();
      } else {
        this.loadImportedPolygons();
      }
      this.animationFrameId = null;
    });
  }

  private updatePolygonsForTransform() {
    if (
      !this.originalPolygons ||
      Object.keys(this.originalPolygons).length === 0 ||
      !this.imageElementRef
    )
      return;

    const imageRect =
      this.imageElementRef.nativeElement.getBoundingClientRect();
    const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();

    const offsetX = imageRect.left - canvasRect.left;
    const offsetY = imageRect.top - canvasRect.top;

    Object.keys(this.originalPolygons).forEach((id) => {
      const original = this.originalPolygons[id];

      this.polygons[id] = {
        ...original,
        points: original.points.map((point) => {
          const relativeX = point.x - this.imageCenter.x;
          const relativeY = point.y - this.imageCenter.y;

          const scaledX = relativeX * this.zoomLevel;
          const scaledY = relativeY * this.zoomLevel;

          return {
            x: this.imageCenter.x + scaledX + this.translateX,
            y: this.imageCenter.y + scaledY + this.translateY,
          };
        }),
      };
    });

    this.lastTransformApplied = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoomLevel})`;

    this.redrawAllPolygons();
  }

  toggleCrosshair() {
    this.showCrosshair = !this.showCrosshair;
  }

  showCoordinates = false;
  displayedCoordinateX = 0;
  displayedCoordinateY = 0;

  updateCrosshairPosition(event: MouseEvent) {
    const parentRect = (
      event.currentTarget as HTMLElement
    ).getBoundingClientRect();
    this.crosshairX = event.clientX - parentRect.left;
    this.crosshairY = event.clientY - parentRect.top;

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

  handleKeyboardShortcuts(event: KeyboardEvent) {}

  private resizeCanvasToContainer() {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement as HTMLElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

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

    this.redrawPolygons();

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
    this.redrawAllPolygons();

    if (this.polygon.length >= 2 && this.ctx) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.polygon[0].x, this.polygon[0].y);

      for (let i = 1; i < this.polygon.length; i++) {
        this.ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
      }

      this.ctx.fillStyle = this.POLYGON_FILL_COLOR;
      this.ctx.fill();
      this.ctx.strokeStyle = this.POLYGON_BORDER_COLOR;
      this.ctx.lineWidth = this.POLYGON_BORDER_WIDTH;
      this.ctx.lineJoin = 'round';
      this.ctx.stroke();

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
    this.showCoordinates = false;
  }

  panning = false;
  private panningStartX = 0;
  private panningStartY = 0;
  private translateX = 0;
  private translateY = 0;
  public spacePressed = false;

  onMouseDownContainer(event: MouseEvent) {
    if (this.spacePressed) {
      this.panning = true;
      this.panningStartX = event.clientX - this.translateX;
      this.panningStartY = event.clientY - this.translateY;
    } else {
      this.startDrawing(event);
    }
  }

  onMouseMoveContainer(event: MouseEvent) {
    if (!this.panning) {
      this.drawPolygon(event);

      // Add polygon hover detection on mouse move
      this.checkPolygonHover(event);
    }
  }

  // Add new method to check if mouse is hovering over a polygon
  checkPolygonHover(event: MouseEvent) {
    if (this.isDragging || this.panning) return; // Don't check during drag or pan

    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let hoveredId: string | null = null;

    // Check if the mouse is inside any polygon
    Object.entries(this.polygons).forEach(([id, poly]) => {
      if (
        this.activePolygons[id] &&
        this.isPointInPolygon(mouseX, mouseY, poly.points)
      ) {
        hoveredId = id;
      }
    });

    // Only update if we're hovering over a different polygon
    if (hoveredId !== this.hoveredPolygonId) {
      console.log('Canvas hover polygon:', hoveredId);
      this.setHoveredPolygon(hoveredId);
    }
  }

  // Add helper method to check if a point is inside a polygon
  isPointInPolygon(
    x: number,
    y: number,
    points: { x: number; y: number }[]
  ): boolean {
    if (points.length < 3) return false;

    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x;
      const yi = points[i].y;
      const xj = points[j].x;
      const yj = points[j].y;

      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }

  onMouseUpContainer(event: MouseEvent) {
    this.finishDrawing();
  }

  refreshPolygons() {
    if (Object.keys(this.originalPolygons).length === 0) {
      this.loadImportedPolygons();
      return;
    }

    this.updatePolygonsForTransform();

    if (this.ctx) {
      requestAnimationFrame(() => {
        this.redrawAllPolygons();
      });
    }
  }

  saveChanges() {
    setTimeout(() => {
      this.refreshPolygons();
    }, 100);
  }

  checkPolygonsVisibility() {
    console.log(
      'Original polygons:',
      Object.keys(this.originalPolygons).length
    );
    console.log('Transformed polygons:', Object.keys(this.polygons).length);
    console.log('Active flags:', this.activePolygons);
  }

  maxZoom() {
    this.zoomLevel = 5.0;
    this.applyTransform();
  }

  togglePanning() {
    this.panning = !this.panning;
  }

  private draggedPolygonId: string | null = null;

  onDragStart(event: DragEvent, polygon: any) {
    if (!event.dataTransfer) return;
    this.draggedPolygonId = polygon.objectId;
    event.dataTransfer.setData('text/plain', polygon.objectId);
    event.dataTransfer.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, priority: 'high' | 'medium' | 'low') {
    event.preventDefault();
    const polygonId = event.dataTransfer?.getData('text/plain');

    if (polygonId && this.draggedPolygonId) {
      const polygon = this.polygonDataList.find(
        (p) => p.objectId === polygonId
      );
      if (polygon) {
        polygon.priority = priority;
        console.log(`Changed polygon ${polygonId} priority to ${priority}`);

        if (this.polygons[polygonId]) {
          this.redrawAllPolygons();
        }
      }
      this.draggedPolygonId = null;
    }
  }

  clearPriority(polygonId: string | undefined | null) {
    if (!polygonId) return;

    const polygon = this.polygonDataList.find((p) => p.objectId === polygonId);
    if (polygon) {
      polygon.priority = undefined;
      this.redrawAllPolygons();
    }
  }

  onAnnotationDrop(event: CdkDragDrop<any[]>) {
    // Get item being moved
    const item = event.previousContainer.data[event.previousIndex];

    // Determine new priority based on the container ID
    let newPriority: string | undefined = undefined;
    if (event.container.id === 'high-priority') {
      newPriority = 'high';
    } else if (event.container.id === 'medium-priority') {
      newPriority = 'medium';
    } else if (event.container.id === 'low-priority') {
      newPriority = 'low';
    } else if (event.container.id === 'unassigned') {
      // Explicitly clear priority when moved to unassigned
      newPriority = undefined;
    }

    // Update the item's priority
    if (item) {
      if (newPriority) {
        console.log(`Updating ${item.objectId} priority to ${newPriority}`);
        item.priority = newPriority;
      } else {
        // Clear priority explicitly when moved to unassigned
        console.log(`Clearing priority for ${item.objectId}`);
        delete item.priority; // Remove the property completely
      }
    }

    // Move the item between arrays
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }

    // Make sure to redraw all polygons to show the updated colors
    this.redrawAllPolygons();
  }

  // Toggle a specific polygon's visibility - this was missing
  togglePolygon(id: string) {
    this.activePolygons[id] = !this.activePolygons[id];
    this.redrawAllPolygons();
  }

  // Method to handle sidebar navigation selection
  selectSidebarItem(index: number) {
    this.selectedSidebarItem = index;
  }

  // Add method to check if the annotation list contains an ID
  hasAnnotationWithId(list: any[], id: string): boolean {
    return list.some((item) => item.objectId === id);
  }

  // Add methods to set the isDragging state
  onPolygonDragStart() {
    this.isDragging = true;
  }

  onPolygonDragEnd() {
    this.isDragging = false;
  }

  onVariantSelected(variant: any) {
    this.imageUrl = variant.path;
    this.currentImageUrl = variant.path;
  }
}
