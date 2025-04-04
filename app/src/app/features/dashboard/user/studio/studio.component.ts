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
import { KeyboardService } from './services/keyboard.service';

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

  private readonly TYPE_COLORS: Record<
    string,
    { border: string; fill: string }
  > = {
    high: {
      border: 'rgba(255, 0, 0, 1)',
      fill: 'rgba(255, 0, 0, 0.2)',
    },
    medium: {
      border: 'rgba(255, 255, 0, 1)',
      fill: 'rgba(255, 255, 0, 0.2)',
    },
    low: {
      border: 'rgba(0, 255, 0, 1)',
      fill: 'rgba(0, 255, 0, 0.2)',
    },
    blue: {
      border: 'rgba(0, 120, 255, 1)',
      fill: 'rgba(0, 120, 255, 0.2)',
    },
    default: {
      border: 'rgba(0, 120, 255, 1)',
      fill: 'rgba(0, 120, 255, 0.2)',
    },
    unassigned: {
      border: 'rgba(0, 120, 255, 1)',
      fill: 'rgba(0, 120, 255, 0.2)',
    },
  };

  public polygonDataList: any[] = [];
  activePolygons: { [id: string]: boolean } = {};
  private polygons: PolygonDataMap = {};
  private readonly POLYGON_BORDER_COLOR = 'yellow';
  private readonly POLYGON_BORDER_WIDTH = 3;
  private readonly POLYGON_FILL_COLOR = 'rgba(255, 255, 0, 0.2)';
  private readonly VERTEX_COLOR = 'yellow';
  private readonly VERTEX_RADIUS = 4;
  hoveredPolygonId: string | null = null;
  private originalPolygons: PolygonDataMap = {};
  private imageCenter = { x: 0, y: 0 };
  private lastTransformApplied = '';
  private animationFrameId: number | null = null;
  private zoomUpdatePending = false;
  private lastZoomTime = 0;
  private readonly ZOOM_THROTTLE_MS = 10;
  sidebarNavItems = [
    { icon: '📁', label: 'Project' },
    { icon: '🔧', label: 'Tools' },
    { icon: '🔍', label: 'Zoom' },
    { icon: '📋', label: 'Annotations' },
  ];
  selectedSidebarItem = 1;
  highPriorityAnnotations: any[] = [];
  mediumPriorityAnnotations: any[] = [];
  lowPriorityAnnotations: any[] = [];
  unassignedAnnotations: any[] = [];
  private isDragging = false;
  private initialLoadCompleted = false;
  isLoading = true;
  studioHash = '';
  currentImageUrl = '';

  constructor(
    private renderer: Renderer2,
    private polygonDataService: PolygonDataService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private keyboardService: KeyboardService
  ) {
    this.studioHash = this.generateRandomHash();
  }

  private generateRandomHash(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  @HostListener('window:keydown', ['$event'])
  handleGlobalKeyboardShortcuts(event: KeyboardEvent) {
    if (event.key === ' ' && this.keyboardService.isSpaceKeyEnabled()) {
      event.preventDefault();
      this.spacePressed = true;
      return;
    }

    if (event.ctrlKey) {
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
      if (event.key.toLowerCase() === 'g') {
        this.toggleCrosshair();
      } else if (event.key.toLowerCase() === 'd') {
        this.toggleDrawMode();
      } else if (event.key.toLowerCase() === 'c') {
        this.clearPolygons();
      }
    }
  }

  @HostListener('window:keyup', ['$event'])
  handleGlobalKeyboardShortcutsUp(event: KeyboardEvent) {
    if (event.key === ' ' && this.keyboardService.isSpaceKeyEnabled()) {
      event.preventDefault();
      this.spacePressed = false;
    }
  }

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

    this.resizeCanvasToContainer();

    this.resizeObserver = new ResizeObserver(() => {
      this.resizeCanvasToContainer();
      this.redrawPolygons();
    });

    this.resizeObserver.observe(canvas.parentElement as Element);

    this.imageContainerRef.nativeElement.addEventListener(
      'wheel',
      this.handleWheel.bind(this),
      { passive: false }
    );

    setTimeout(() => this.updateMinZoomLevel(), 500);

    this.loadPolygonData();
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    if (this.imageContainerRef) {
      this.imageContainerRef.nativeElement.removeEventListener(
        'wheel',
        this.handleWheel.bind(this)
      );
    }

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
    if (!this.initialLoadCompleted) {
      this.isLoading = true;
    }

    this.polygonDataService.fetchPolygonData().subscribe({
      next: (response) => {
        this.datasetId = response.id;
        this.polygonDataList = response.objects || [];

        this.polygonDataList.forEach((poly) => {
          this.activePolygons[poly.objectId] = true;
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

        if (!this.initialLoadCompleted) {
          setTimeout(() => {
            this.isLoading = false;
            this.initialLoadCompleted = true;
          }, 3000);
        }
      },
      error: (error) => {
        console.error('Error fetching polygon data:', error);

        if (!this.initialLoadCompleted) {
          setTimeout(() => {
            this.isLoading = false;
            this.initialLoadCompleted = true;
          }, 2000);
        }
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

      if (!this.initialZoomSet) {
        this.updateMinZoomLevel();
        this.initialZoomLevel = this.zoomLevel;
        this.initialZoomSet = true;

        setTimeout(() => {
          this.loadImportedPolygons();
        }, 200);
      }
    }
  }

  private loadImportedPolygons() {
    if (!this.ctx || !this.imageElementRef || !this.canvasRef) {
      console.warn("Can't load polygons - dependencies not ready");
      return;
    }

    setTimeout(() => {
      const imageElement = this.imageElementRef.nativeElement;
      const canvas = this.canvasRef.nativeElement;

      const imageRect = imageElement.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();

      this.imageCenter = {
        x: (imageRect.left + imageRect.right) / 2 - canvasRect.left,
        y: (imageRect.top + imageRect.bottom) / 2 - canvasRect.top,
      };

      const offsetX = imageRect.left - canvasRect.left;
      const offsetY = imageRect.top - canvasRect.top;

      const scaleX = imageElement.clientWidth / this.imageNaturalWidth;
      const scaleY = imageElement.clientHeight / this.imageNaturalHeight;

      this.originalPolygons = {};
      this.polygons = {};

      this.polygonDataList.forEach((polyData) => {
        if (!polyData.polygon || !Array.isArray(polyData.polygon)) {
          console.warn('Invalid polygon data for:', polyData);
          return;
        }

        const points = polyData.polygon.map(([x, y]: [number, number]) => ({
          x: offsetX + x * scaleX,
          y: offsetY + y * scaleY,
        }));

        this.originalPolygons[polyData.objectId] = {
          points: [...points],
          type: polyData.type || this.getColorTypeFromLabel(polyData.label),
          label: polyData.label,
        };

        this.polygons[polyData.objectId] = {
          points: [...points],
          type: polyData.type || this.getColorTypeFromLabel(polyData.label),
          label: polyData.label,
        };
      });

      setTimeout(() => {
        this.redrawAllPolygons();
      }, 100);
    }, 500);
  }

  private redrawAllPolygons() {
    if (!this.ctx || !this.imageElementRef) return;

    const canvas = this.canvasRef.nativeElement;

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

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

    Object.entries(this.polygons).forEach(([id, poly]) => {
      if (
        this.activePolygons[id] &&
        id !== this.hoveredPolygonId &&
        poly.points.length >= 2
      ) {
        const polygonData = this.polygonDataList.find((p) => p.objectId === id);

        const colorType =
          polygonData?.priority ||
          this.getColorTypeFromLabel(polygonData?.label);

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

    if (this.hoveredPolygonId && this.activePolygons[this.hoveredPolygonId]) {
      const poly = this.polygons[this.hoveredPolygonId];
      if (poly && poly.points.length >= 2) {
        const polygonData = this.polygonDataList.find(
          (p) => p.objectId === this.hoveredPolygonId
        );

        const colorType =
          polygonData?.priority ||
          this.getColorTypeFromLabel(polygonData?.label);

        this.drawSinglePolygon(poly.points, colorType, true);
      }
    }

    this.ctx.restore();
  }

  private drawSinglePolygon(
    points: { x: number; y: number }[],
    type: string,
    isHovered: boolean = false
  ) {
    if (!this.ctx || points.length < 2) return;

    const colors = this.TYPE_COLORS[type] || this.TYPE_COLORS['default'];

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }

    this.ctx.closePath();

    if (isHovered) {
      this.ctx.shadowColor = colors.border;
      this.ctx.shadowBlur = 15;

      this.ctx.fillStyle = colors.fill.replace('0.2', '0.4');
    } else {
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = colors.fill;
    }

    this.ctx.fill();

    this.ctx.strokeStyle = colors.border;
    this.ctx.lineWidth = isHovered
      ? this.POLYGON_BORDER_WIDTH + 2
      : this.POLYGON_BORDER_WIDTH;
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();

    this.ctx.shadowBlur = 0;
  }

  private getColorTypeFromLabel(label: string | undefined): string {
    if (!label) return 'unassigned';

    const labelLower = label.toLowerCase();

    if (['person', 'pedestrian'].includes(labelLower)) {
      return 'high';
    } else if (['car', 'bicycle', 'motorcycle'].includes(labelLower)) {
      return 'medium';
    } else if (['traffic sign', 'traffic light'].includes(labelLower)) {
      return 'low';
    }

    return 'unassigned';
  }

  setHoveredPolygon(id: string | null) {
    if (this.hoveredPolygonId !== id) {
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

    const widthRatio = this.containerWidth / this.imageNaturalWidth;
    const heightRatio = this.containerHeight / this.imageNaturalHeight;

    const fitRatio = Math.min(widthRatio, heightRatio);

    this.minZoomLevel = fitRatio * 0.95;

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

      this.checkPolygonHover(event);
    }
  }

  checkPolygonHover(event: MouseEvent) {
    if (this.isDragging || this.panning) return;

    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let hoveredId: string | null = null;

    Object.entries(this.polygons).forEach(([id, poly]) => {
      if (
        this.activePolygons[id] &&
        this.isPointInPolygon(mouseX, mouseY, poly.points)
      ) {
        hoveredId = id;
      }
    });

    if (hoveredId !== this.hoveredPolygonId) {
      this.setHoveredPolygon(hoveredId);
    }
  }

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
    const item = event.previousContainer.data[event.previousIndex];

    let newPriority: string | undefined = undefined;
    if (event.container.id === 'high-priority') {
      newPriority = 'high';
    } else if (event.container.id === 'medium-priority') {
      newPriority = 'medium';
    } else if (event.container.id === 'low-priority') {
      newPriority = 'low';
    } else if (event.container.id === 'unassigned') {
      newPriority = undefined;
    }

    if (item) {
      if (newPriority) {
        item.priority = newPriority;
      } else {
        delete item.priority;
      }
    }

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

    this.redrawAllPolygons();
  }

  togglePolygon(id: string) {
    this.activePolygons[id] = !this.activePolygons[id];
    this.redrawAllPolygons();
  }

  toggleAllPolygons(visible: boolean) {
    Object.keys(this.activePolygons).forEach((id) => {
      this.activePolygons[id] = visible;
    });
    this.redrawAllPolygons();
  }

  selectSidebarItem(index: number) {
    this.selectedSidebarItem = index;
  }

  hasAnnotationWithId(list: any[], id: string): boolean {
    return list.some((item) => item.objectId === id);
  }

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

  reloadAllData() {
    this.logPolygonDataWithPriorities();

    this.studioHash = this.generateRandomHash();

    this.showReloadIndicator();

    this.polygonDataList = [];
    this.highPriorityAnnotations = [];
    this.mediumPriorityAnnotations = [];
    this.lowPriorityAnnotations = [];
    this.unassignedAnnotations = [];
    this.activePolygons = {};
    this.polygons = {};
    this.originalPolygons = {};

    this.initialZoomSet = false;

    if (this.ctx) {
      this.ctx.clearRect(
        0,
        0,
        this.canvasRef.nativeElement.width,
        this.canvasRef.nativeElement.height
      );
    }

    this.resetZoom();

    this.loadDatasetId();

    setTimeout(() => {
      this.loadPolygonData();
    }, 500);
  }

  /**
   * Formats and logs polygon data with their priorities
   * This can be used to send data to the backend later
   */
  private logPolygonDataWithPriorities() {
    // Create a formatted representation of polygons with their priorities
    const polygonsWithPriorities = this.polygonDataList.map((polygon) => {
      // Determine priority - use explicit priority if set, otherwise infer from label
      let priority = polygon.priority;

      if (!priority) {
        // Get priority from label if not explicitly set
        const label = polygon.label?.toLowerCase();
        if (label) {
          if (['person', 'pedestrian'].includes(label)) {
            priority = 'high';
          } else if (['car', 'bicycle', 'motorcycle'].includes(label)) {
            priority = 'medium';
          } else if (['traffic sign', 'traffic light'].includes(label)) {
            priority = 'low';
          } else {
            priority = 'unassigned';
          }
        } else {
          priority = 'unassigned';
        }
      }

      // Return formatted object with relevant properties
      return {
        objectId: polygon.objectId,
        label: polygon.label || 'Unlabeled',
        priority: priority,
        visible: this.activePolygons[polygon.objectId] === true,
        comment: polygon.comment || '', // Include comment in the output
        // Include other relevant properties you might need for the backend
        // coordinates: polygon.polygon // Uncomment if you need coordinates
      };
    });

    // Create a summary object with counts by priority
    const summary = {
      total: polygonsWithPriorities.length,
      highPriority: polygonsWithPriorities.filter((p) => p.priority === 'high')
        .length,
      mediumPriority: polygonsWithPriorities.filter(
        (p) => p.priority === 'medium'
      ).length,
      lowPriority: polygonsWithPriorities.filter((p) => p.priority === 'low')
        .length,
      unassigned: polygonsWithPriorities.filter(
        (p) => p.priority === 'unassigned'
      ).length,
      visible: polygonsWithPriorities.filter((p) => p.visible).length,
      hidden: polygonsWithPriorities.filter((p) => !p.visible).length,
      withComments: polygonsWithPriorities.filter((p) => p.comment).length, // Add comment count
    };

    // Log both the detailed polygon data and the summary
    console.log('=== Polygon Data with Priorities and Comments ===');
    console.log('Summary:', summary);
    console.log('Detailed polygon data:', polygonsWithPriorities);
    console.log('Raw polygon data for backend:', {
      datasetId: this.datasetId,
      polygons: polygonsWithPriorities,
    });
    console.log('===============================');

    // Return the formatted data (useful for when you want to send to backend)
    return {
      datasetId: this.datasetId,
      polygons: polygonsWithPriorities,
      summary,
    };
  }

  // Method to handle comment additions
  onCommentAdded(commentData: { id: string; comment: string }): void {
    const polygon = this.polygonDataList.find(
      (p) => p.objectId === commentData.id
    );
    if (polygon) {
      polygon.comment = commentData.comment;
      console.log(
        `Added comment to polygon ${commentData.id}: ${commentData.comment}`
      );
    }
  }

  private showReloadIndicator() {
    const indicator = this.renderer.createElement('div');
    this.renderer.setStyle(indicator, 'position', 'absolute');
    this.renderer.setStyle(indicator, 'top', '10px');
    this.renderer.setStyle(indicator, 'right', '10px');
    this.renderer.setStyle(indicator, 'background', 'rgba(0, 0, 0, 0.7)');
    this.renderer.setStyle(indicator, 'color', 'white');
    this.renderer.setStyle(indicator, 'padding', '8px 16px');
    this.renderer.setStyle(indicator, 'border-radius', '4px');
    this.renderer.setStyle(indicator, 'z-index', '9999');
    this.renderer.setProperty(indicator, 'textContent', 'Reloading data...');

    const body = document.body;
    this.renderer.appendChild(body, indicator);

    setTimeout(() => {
      this.renderer.removeChild(body, indicator);
    }, 3000);
  }
}
