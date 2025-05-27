import { isObject } from 'ag-charts-core';

/**
 * A graph that is optimised for vertex lookup and adjacency by edge value.
 */
export class AdjacencyListGraph<V, E = undefined> {
    // Store vertices as a flat set to optimise vertex lookup.
    private _vertices: Set<Vertex<V>> = new Set();

    // Stores edges in a way to optimise lookup of vertices adjacent by edge value to a vertex. This is less optimal
    // for iteration of all edges and deletion of vertices & edges, however this is less useful for our case.
    private _edges: Map<Vertex<V>, Map<E, Set<Vertex<V>>>> = new Map();

    clear() {
        this._vertices = new Set();
        this._edges = new Map();
    }

    addVertex(value: V): Vertex<V> {
        const vertex = new Vertex(value);
        this._vertices.add(vertex);
        return vertex;
    }

    addEdge(from: Vertex<V>, to: Vertex<V>, edge: E): void {
        if (!this._edges.has(from)) {
            this._edges.set(from, new Map([[edge, new Set([to])]]));
            return;
        }

        const edges = this._edges.get(from)!;
        const vertices = edges.get(edge);
        if (vertices) {
            vertices.add(to);
        } else {
            edges.set(edge, new Set([to]));
        }
    }

    removeVertex(vertex: Vertex<V>): void {
        this._vertices.delete(vertex);
        const edges = this._edges.get(vertex);
        if (!edges) return;
        for (const [_edge, adjacentVertices] of edges) {
            for (const adjacentVertex of adjacentVertices) {
                this._vertices.delete(adjacentVertex);
            }
        }
        this._edges.delete(vertex);

        // TODO: iterate all edges and their vertices to find and delete references to `vertex`
    }

    removeEdge(from: Vertex<V>, to: Vertex<V>): void {
        const edges = this._edges.get(from);
        if (!edges) return;
        for (const [edge, adjacentVertices] of edges) {
            adjacentVertices.delete(to);
            if (adjacentVertices.size === 0) {
                edges.delete(edge);
            }
        }
        if (edges.size === 0) {
            this._edges.delete(from);
        }
    }

    removeEdges(from: Vertex<V>, edgeValue: E): void {
        this._edges.get(from)?.delete(edgeValue);
    }

    getVertexValue(vertex: Vertex<V>): V {
        return vertex.value;
    }

    // Iterate the edges as a tuple of the 'from' vertex, 'to' vertex and edge value. Optionally constrained to a
    // single edge value.
    *edges(edgeValue?: E): Generator<[Vertex<V>, Vertex<V>, E], void, unknown> {
        for (const [fromVertex, fromVertexEdges] of this._edges) {
            if (edgeValue) {
                const edges = fromVertexEdges.get(edgeValue);
                if (!edges) continue;
                for (const toVertex of edges) {
                    yield [fromVertex, toVertex, edgeValue];
                }
            } else {
                for (const [edgeV, toVertices] of fromVertexEdges) {
                    for (const toVertex of toVertices) {
                        yield [fromVertex, toVertex, edgeV];
                    }
                }
            }
        }
    }

    // Iterate all the neighbours of a given vertex.
    *neighbours(from: Vertex<V>): Generator<Vertex<V>, void, unknown> {
        const edges = this._edges.get(from);
        if (!edges) return;
        for (const [_edge, adjacentVertices] of edges) {
            for (const adjacentVertex of adjacentVertices) {
                yield adjacentVertex;
            }
        }
    }

    // Iterate all the neighbours and their edges of a given vertex
    *neighboursAndEdges(from: Vertex<V>): Generator<[Vertex<V>, E], void, unknown> {
        const edges = this._edges.get(from);
        if (!edges) return;
        for (const [edge, adjacentVertices] of edges) {
            for (const adjacentVertex of adjacentVertices) {
                yield [adjacentVertex, edge];
            }
        }
    }

    // Get the set of neighbours along a given edge.
    neighboursWithEdgeValue(from: Vertex<V>, edgeValue: E): Set<Vertex<V>> {
        return this._edges.get(from)?.get(edgeValue) ?? new Set();
    }

    // Find the first neighbour along the given edge.
    findNeighbour(from: Vertex<V>, edgeValue: E): Vertex<V> | undefined {
        const neighbours = this._edges.get(from)?.get(edgeValue);
        if (!neighbours) return;
        const [neighbour] = neighbours;
        return neighbour;
    }

    // Find the value of the first neighbour along the given edge.
    findNeighbourValue(from: Vertex<V>, edgeValue: E): V | undefined {
        const neighbour = this.findNeighbour(from, edgeValue);
        if (!neighbour) return;
        return this.getVertexValue(neighbour);
    }

    // Find the first neighbour with a given value, optionally along a given edge.
    findNeighbourWithValue(from: Vertex<V>, value: V, edgeValue?: E): Vertex<V> | undefined {
        const neighbours = edgeValue == null ? this.neighbours(from) : this.neighboursWithEdgeValue(from, edgeValue);
        for (const neighbour of neighbours) {
            if (this.getVertexValue(neighbour) === value) {
                return neighbour;
            }
        }
    }

    // Find a vertex by iterating an array of vertex values along a given edge.
    findVertexAlongEdge(from: Vertex<V>, findValues: Array<V>, edgeValue: E): Vertex<V> | undefined {
        let vertex = from;
        let found;
        for (const value of findValues) {
            let foundNext = false;
            for (const neighbour of this.neighboursWithEdgeValue(vertex, edgeValue)) {
                if (this.getVertexValue(neighbour) !== value) continue;
                vertex = neighbour;
                foundNext = true;
                break;
            }
            if (!foundNext) return;
            found = vertex;
        }
        return found;
    }

    density(): number {
        const numVertices = this._vertices.size;
        let numEdges = 0;
        for (const [, edges] of this._edges) {
            for (const adjacentVertices of edges.values()) {
                numEdges += adjacentVertices.size;
            }
        }

        return numEdges / (numVertices * (numVertices - 1));
    }

    adjacent(from: Vertex<V>, to: Vertex<V>): boolean {
        const edges = this._edges.get(from);
        if (!edges) return false;
        for (const [_edge, adjacentVertices] of edges) {
            if (adjacentVertices.has(to)) return true;
        }
        return false;
    }

    debug() {
        let string = '';
        for (const [from, edges] of this._edges) {
            let f: any = this.getVertexValue(from);
            if (isObject(f)) f = `{${Object.keys(f).join(',')}}`;
            string += `${f}\n`;
            for (const [edge, tos] of edges) {
                for (const to of tos) {
                    let t: any = this.getVertexValue(to);
                    if (isObject(t)) t = `{${Object.keys(t).join(',')}}`;
                    string += `  -> ${edge as any} -> ${t}\n`;
                }
            }
        }
        return string;
    }
}

/**
 * A wrapper class to ensure each vertex is unique even if the value is the same object.
 */
export class Vertex<V> {
    constructor(public value: V) {}
}
