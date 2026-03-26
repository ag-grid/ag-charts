/**
 * A graph that is optimised for vertex lookup and adjacency by edge value.
 */
export class AdjacencyListGraph<V, E = undefined> {
    private _vertexCount = 0;
    private _edgeCount = 0;

    // Stores edges in a way to optimise lookup of vertices adjacent by edge value to a vertex. This is less optimal
    // for iteration of all edges and deletion of vertices & edges, however this is less useful for our case.

    // Caches neighbours on a given edge value, optimised for lookup by the `to` vertex value.
    private readonly cachedNeighboursEdge?: E;

    // Stores edges that are pending processing on a given edge value, optimised for iteration of pairs of adjacent
    // vertices. Should call `.clear()` once the edges have been processed.
    private readonly processedEdge?: E;
    protected pendingProcessingEdgesFrom: Vertex<V>[] = [];
    protected pendingProcessingEdgesTo: Vertex<V>[] = [];

    private readonly singleValueEdges?: Set<E>;

    constructor(cachedNeighboursEdge?: E, processedEdge?: E, singleValueEdges?: Set<E>) {
        this.cachedNeighboursEdge = cachedNeighboursEdge;
        this.processedEdge = processedEdge;
        this.singleValueEdges = singleValueEdges;
    }

    clear() {
        this._vertexCount = 0;
        this._edgeCount = 0;
        this.pendingProcessingEdgesFrom = [];
        this.pendingProcessingEdgesTo = [];
        this.singleValueEdges?.clear();
    }

    getVertexCount() {
        return this._vertexCount;
    }

    getEdgeCount() {
        return this._edgeCount;
    }

    addVertex(value: V): Vertex<V> {
        const vertex = new Vertex(value);
        this._vertexCount++;
        return vertex;
    }

    addEdge(from: Vertex<V>, to: Vertex<V>, edge: E): void {
        // Optimize cached neighbours handling
        if (edge === this.cachedNeighboursEdge) {
            from.updateCachedNeighbours().set(to.value, to);
        } else if (edge === this.processedEdge) {
            this.pendingProcessingEdgesFrom.push(from);
            this.pendingProcessingEdgesTo.push(to);
        }

        // Optimize edges handling - single lookup with fallback
        const { edges } = from;
        const vertices = edges.get(edge);
        if (!vertices) {
            edges.set(edge, [to]);
            this._edgeCount++;
        } else if (!vertices.includes(to)) {
            if (this.singleValueEdges?.has(edge)) {
                edges.set(edge, [to]);
            } else {
                vertices.push(to);
                this._edgeCount++;
            }
        }
    }

    removeVertex(vertex: Vertex<V>): void {
        this._vertexCount--;
        const edges = vertex.edges;
        if (!edges) return;
        for (const [, adjacentVertices] of edges) {
            this._vertexCount -= adjacentVertices.length;
        }
        vertex.clear();

        // TODO: iterate all edges and their vertices to find and delete references to `vertex`
    }

    removeEdge(from: Vertex<V>, to: Vertex<V>, edge: E): void {
        const neighbours = from.edges.get(edge);
        if (!neighbours) return;

        const index = neighbours.indexOf(to);
        if (index === -1) return;

        neighbours.splice(index, 1);
        if (neighbours.length === 0) {
            from.edges.delete(edge);
        }

        this._edgeCount--;

        if (edge === this.cachedNeighboursEdge) {
            from.readCachedNeighbours()?.delete(to.value);
        }
    }

    removeEdges(from: Vertex<V>, edgeValue: E): void {
        from.edges.delete(edgeValue);
    }

    getVertexValue(vertex: Vertex<V>): V {
        return vertex.value;
    }

    // Iterate all the neighbours of a given vertex.
    *neighbours(from: Vertex<V>): Generator<Vertex<V>, void, unknown> {
        for (const [, adjacentVertices] of from.edges) {
            for (const adjacentVertex of adjacentVertices) {
                yield adjacentVertex;
            }
        }
    }

    // Iterate all the neighbours and their edges of a given vertex
    *neighboursAndEdges(from: Vertex<V, E>): Generator<[Vertex<V>, E], void, unknown> {
        for (const [edge, adjacentVertices] of from.edges) {
            for (const adjacentVertex of adjacentVertices) {
                yield [adjacentVertex, edge];
            }
        }
    }

    // Get the set of neighbours along a given edge.
    neighboursWithEdgeValue(from: Vertex<V>, edgeValue: E) {
        return from.edges.get(edgeValue);
    }

    // Find the first neighbour along the given edge.
    findNeighbour(from: Vertex<V>, edgeValue: E): Vertex<V> | undefined {
        return from.edges.get(edgeValue)?.[0];
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
        if (!neighbours) return;
        for (const neighbour of neighbours) {
            if (this.getVertexValue(neighbour) === value) {
                return neighbour;
            }
        }
    }

    // Find a vertex by iterating an array of vertex values along a given edge.
    findVertexAlongEdge(from: Vertex<V>, findValues: Array<V>, edgeValue: E): Vertex<V> | undefined {
        if (edgeValue === this.cachedNeighboursEdge) {
            let found;
            for (const value of findValues) {
                found = (found ?? from).readCachedNeighbours()?.get(value);
                if (!found) return;
            }
            return found;
        }

        if (findValues.length === 0) return;

        let found: Vertex<V> | undefined = from;
        for (const value of findValues) {
            const neighbours: Vertex<V>[] | undefined = found
                ? this.neighboursWithEdgeValue(found, edgeValue)
                : undefined;
            if (!neighbours) return;

            found = neighbours.find((n) => n.value === value);
        }
        return found;
    }

    adjacent(from: Vertex<V>, to: Vertex<V>): boolean {
        for (const [, adjacentVertices] of from.edges) {
            if (adjacentVertices.includes(to)) return true;
        }
        return false;
    }
}

/**
 * A wrapper class to ensure each vertex is unique even if the value is the same object.
 */
export class Vertex<V, E = unknown> {
    public edges: Map<E, Vertex<V>[]> = new Map();
    private _cachedNeighbours?: Map<V, Vertex<V>>;

    constructor(public value: V) {}

    readCachedNeighbours() {
        return this._cachedNeighbours;
    }

    updateCachedNeighbours() {
        this._cachedNeighbours ??= new Map();
        return this._cachedNeighbours;
    }

    clear() {
        this.edges.clear();
        this._cachedNeighbours?.clear();
    }
}
