import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StudioService {
  private readonly POLYGON_BORDER_COLOR = 'yellow';
  private readonly POLYGON_BORDER_WIDTH = 3;
  private readonly POLYGON_FILL_COLOR = 'rgba(255, 255, 0, 0.2)'; // semi-transparent yellow
  private readonly VERTEX_COLOR = 'yellow';
  private readonly VERTEX_RADIUS = 4;

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
      border: 'rgba(0, 120, 255, 1)', // Blue
      fill: 'rgba(0, 120, 255, 0.2)',
    },
    unassigned: {
      border: 'rgba(0, 120, 255, 1)', // Blue
      fill: 'rgba(0, 120, 255, 0.2)',
    },
  };

  private polygons: {
    [id: string]: {
      points: { x: number; y: number }[];
      type: 'high' | 'medium' | 'low';
      label?: string;
    };
  } = {};

  private originalPolygons: {
    [id: string]: {
      points: { x: number; y: number }[];
      type: 'high' | 'medium' | 'low';
      label?: string;
    };
  } = {};

  private imageCenter = { x: 0, y: 0 };

  private zoomLevel = 1.0;
  private translateX = 0;
  private translateY = 0;

  loadPolygonData(polygonDataList: any[], imageElement: HTMLImageElement) {
    const imageRect = imageElement.getBoundingClientRect();
    const scaleX = imageElement.clientWidth / imageElement.naturalWidth;
    const scaleY = imageElement.clientHeight / imageElement.naturalHeight;

    this.originalPolygons = {};
    this.polygons = {};

    polygonDataList.forEach((polyData) => {
      const points = polyData.polygon.map(([x, y]: [number, number]) => ({
        x: x * scaleX,
        y: y * scaleY,
      }));

      this.originalPolygons[polyData.objectId] = {
        points: [...points],
        type: polyData.type,
        label: polyData.label,
      };

      this.polygons[polyData.objectId] = {
        points: [...points],
        type: polyData.type,
        label: polyData.label,
      };
    });

    this.imageCenter = {
      x: imageRect.width / 2,
      y: imageRect.height / 2,
    };
  }

  updatePolygonsForTransform() {
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
  }

  redrawAllPolygons(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    Object.entries(this.polygons).forEach(([id, poly]) => {
      if (poly.points.length >= 2) {
        const colors =
          this.TYPE_COLORS[poly.type] || this.TYPE_COLORS['default'];

        ctx.beginPath();
        ctx.moveTo(poly.points[0].x, poly.points[0].y);

        for (let i = 1; i < poly.points.length; i++) {
          ctx.lineTo(poly.points[i].x, poly.points[i].y);
        }

        ctx.closePath();
        ctx.fillStyle = colors.fill;
        ctx.fill();

        ctx.strokeStyle = colors.border;
        ctx.lineWidth = this.POLYGON_BORDER_WIDTH;
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    });
  }
}
