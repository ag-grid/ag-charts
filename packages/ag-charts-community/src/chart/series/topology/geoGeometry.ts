import type { Geometry, Position } from 'geojson';

import { BBox } from '../../../scene/bbox';
import { Path2D } from '../../../scene/path2D';
import { Path, ScenePathChangeDetection } from '../../../scene/shape/path';
import { lineStringDistance } from './lineStringUtil';
import { polygonDistance } from './polygonUtil';

export class GeoGeometry extends Path {
    @ScenePathChangeDetection()
    projectedGeometry: Geometry | undefined = undefined;

    private bbox: BBox | undefined;
    // Keep non-filled shapes separate so we don't fill them
    private strokePath = new Path2D();

    override computeBBox(): BBox | undefined {
        if (this.dirtyPath || this.isDirtyPath()) {
            this.updatePath();
            this.dirtyPath = false;
        }

        return this.bbox?.clone();
    }

    override updatePath(): void {
        const { projectedGeometry } = this;

        this.strokePath.clear();
        this.path.clear();

        this.bbox = projectedGeometry != null ? this.drawGeometry(projectedGeometry, undefined) : undefined;
    }

    override drawPath(ctx: any) {
        super.drawPath(ctx);

        this.strokePath.draw(ctx);
        this.renderStroke(ctx);
    }

    override containsPoint(x: number, y: number): boolean {
        const { projectedGeometry } = this;
        if (projectedGeometry == null) return false;

        ({ x, y } = this.transformPoint(x, y));
        if (!this.getCachedBBox().containsPoint(x, y)) return false;

        return this.geometryContainsPoint(projectedGeometry, x, y);
    }

    private geometryContainsPoint(geometry: Geometry, x: number, y: number): boolean {
        const { strokeWidth } = this;
        switch (geometry.type) {
            case 'GeometryCollection':
                return geometry.geometries.some((g) => this.geometryContainsPoint(g, x, y));
            case 'Polygon':
                return polygonDistance(geometry.coordinates, x, y) <= 0;
            case 'MultiPolygon':
                return geometry.coordinates.some((coordinates) => polygonDistance(coordinates, x, y) <= 0);
            case 'LineString':
                return lineStringDistance(geometry.coordinates, x, y) < strokeWidth;
            case 'MultiLineString':
                return geometry.coordinates.some((lineString) => lineStringDistance(lineString, x, y) < strokeWidth);
            case 'Point':
            case 'MultiPoint':
                return false;
        }
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
        if (coordinates.length < 2) return bbox;

        // For polygons (i.e. closed), the start and end coordinates are the same
        // Use closePath instead so the path draws its miters correctly
        const end = isClosed ? coordinates.length - 1 : coordinates.length;

        for (let i = 0; i < end; i += 1) {
            const [x, y] = coordinates[i];

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
            path.closePath();
        }

        return bbox;
    }
}
