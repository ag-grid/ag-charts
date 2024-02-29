import type { Geometry, Position } from 'geojson';

import { BBox } from '../../../scene/bbox';
import { Path2D } from '../../../scene/path2D';
import { Path, ScenePathChangeDetection } from '../../../scene/shape/path';
import type { MercatorScale } from './mercatorScale';

export class GeoGeometry extends Path {
    @ScenePathChangeDetection()
    geometry: Geometry | undefined = undefined;

    @ScenePathChangeDetection()
    scale: MercatorScale | undefined;

    private bbox: BBox | undefined;
    // Keep non-filled shapes separate so we don't fill them
    private strokePath = new Path2D();

    override computeBBox(): BBox | undefined {
        if (this.dirtyPath || this.isDirtyPath()) {
            this.updatePath();
            this.dirtyPath = false;
        }

        return this.bbox;
    }

    override updatePath(): void {
        let bbox: BBox | undefined;
        this.strokePath.clear();
        this.path.clear();

        const { geometry } = this;
        if (geometry != null) {
            bbox = this.drawGeometry(geometry, bbox);
        }

        this.bbox = bbox;
    }

    override drawPath(ctx: any) {
        super.drawPath(ctx);

        this.strokePath.draw(ctx);
        this.renderStroke(ctx);
    }

    override containsPoint(x: number, y: number): boolean {
        const { geometry } = this;
        if (geometry == null) return false;

        ({ x, y } = this.transformPoint(x, y));
        if (!this.getCachedBBox().containsPoint(x, y)) return false;

        return this.geometryContainsPoint(geometry, x, y);
    }

    private geometryContainsPoint(geometry: Geometry, x: number, y: number): boolean {
        switch (geometry.type) {
            case 'GeometryCollection':
                return geometry.geometries.some((g) => this.geometryContainsPoint(g, x, y));
            case 'Polygon':
                return this.polygonsContainsPoint(geometry.coordinates, x, y);
            case 'MultiPolygon':
                return geometry.coordinates.some((coordinates) => this.polygonsContainsPoint(coordinates, x, y));
            case 'LineString':
            case 'MultiLineString':
            case 'Point':
            case 'MultiPoint':
                return false;
        }
    }

    private polygonsContainsPoint(polygons: Position[][], x: number, y: number): boolean {
        if (polygons.length < 1) return false;

        if (!this.polygonContainsPoint(polygons[0], x, y)) {
            return false;
        }

        for (let i = 1; i < polygons.length; i += 1) {
            const enclave = polygons[i];
            if (this.polygonContainsPoint(enclave, x, y)) {
                return false;
            }
        }

        return true;
    }

    private polygonContainsPoint(polygon: Position[], x: number, y: number): boolean {
        const { scale } = this;
        if (scale == null) return false;

        let [x0, y0] = scale.convert(polygon[polygon.length - 1]);
        let x1 = 0;
        let y1 = 0;
        let inside = false;

        for (let i = 0; i < polygon.length; i += 1) {
            [x1, y1] = scale.convert(polygon[i]);

            if (y1 > y !== y0 > y && x < ((x0 - x1) * (y - y1)) / (y0 - y1) + x1) {
                inside = !inside;
            }

            x0 = x1;
            y0 = y1;
        }

        return inside;
    }

    private drawGeometry(geometry: Geometry, bbox: BBox | undefined): BBox | undefined {
        const { path, strokePath } = this;
        switch (geometry.type) {
            case 'GeometryCollection':
                geometry.geometries.forEach((g) => {
                    bbox = this.drawGeometry(g, bbox);
                });
                break;
            case 'Polygon':
                bbox = this.drawPolygon(path, geometry.coordinates, bbox);
                break;
            case 'MultiPolygon':
                geometry.coordinates.forEach((coordinates) => {
                    bbox = this.drawPolygon(path, coordinates, bbox);
                });
                break;
            case 'LineString':
                bbox = this.drawLineString(strokePath, geometry.coordinates, bbox, false);
                break;
            case 'MultiLineString':
                geometry.coordinates.forEach((coordinates) => {
                    bbox = this.drawLineString(strokePath, coordinates, bbox, false);
                });
                break;
            case 'Point':
            case 'MultiPoint':
                break;
        }

        return bbox;
    }

    private drawPolygon(path: Path2D, polygons: Position[][], bbox: BBox | undefined): BBox | undefined {
        if (polygons.length < 1) return bbox;

        bbox = this.drawLineString(path, polygons[0], bbox, true);
        for (let i = 1; i < polygons.length; i += 1) {
            // Don't extend bbox for enclaves
            const enclave = polygons[i];
            this.drawLineString(path, enclave, undefined, true);
        }
        return bbox;
    }

    private drawLineString(
        path: Path2D,
        coordinates: Position[],
        bbox: BBox | undefined,
        isClosed: boolean
    ): BBox | undefined {
        const { scale } = this;

        if (scale == null || coordinates.length < 2) return bbox;

        // For polygons (i.e. closed), the start and end coordinates are the same
        // Use closePath instead so the path draws its miters correctly
        const end = isClosed ? coordinates.length - 1 : coordinates.length;

        for (let i = 0; i < end; i += 1) {
            const lonLat = coordinates[i];
            const [x, y] = scale.convert(lonLat);

            if (i === 0) {
                path.moveTo(x, y);
            } else {
                path.lineTo(x, y);
            }

            if (bbox == null) {
                bbox = new BBox(x, y, 0, 0);
            } else {
                const { x: x0, y: y0 } = bbox;
                const x1 = x0 + bbox.width;
                const y1 = y0 + bbox.height;

                bbox.x = Math.min(x0, x);
                bbox.y = Math.min(y0, y);
                bbox.width = Math.max(x1, x) - bbox.x;
                bbox.height = Math.max(y1, y) - bbox.y;
            }
        }

        if (isClosed) {
            this.path.closePath();
        }

        return bbox;
    }
}
