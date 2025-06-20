/**
 * A graph that is optimised for vertex lookup and adjacency by edge value.
 */
export class AdjacencyListGraph<V, E = undefined> {
    private _vertexCount = 0;

    // Stores edges in a way to optimise lookup of vertices adjacent by edge value to a vertex. This is less optimal
    // for iteration of all edges and deletion of vertices & edges, however this is less useful for our case.

    // Caches neighbours on a given edge value, optimised for lookup by the `to` vertex value.
    private readonly cachedNeighboursEdge?: E;

    // Stores edges that are pending processing on a given edge value, optimised for iteration of pairs of adjacent
    // vertices. Should call `.clear()` once the edges have been processed.
    private readonly processedEdge?: E;
    protected pendingProcessingEdges: [Vertex<V>, Vertex<V>][] = [];

    constructor(cachedNeighboursEdge?: E, processedEdge?: E) {
        this.cachedNeighboursEdge = cachedNeighboursEdge;
        this.processedEdge = processedEdge;
    }

    clear() {
        this._vertexCount = 0;
        this.pendingProcessingEdges = [];
    }

    addVertex(value: V): Vertex<V> {
        const vertex = new Vertex(value);
        this._vertexCount++;
        return vertex;
    }

    addEdge(from: Vertex<V>, to: Vertex<V>, edge: E): void {
        // Optimize cached neighbours handling
        if (edge === this.cachedNeighboursEdge) {
            from.cachedNeighbours.set(to.value, to);
        }

        if (edge === this.processedEdge) {
            this.pendingProcessingEdges.push([from, to]);
        }

        // Optimize edges handling - single lookup with fallback
        // edges ??= this._edges.get(from);
        const { edges } = from;
        const vertices = edges.get(edge);
        if (!vertices) {
            edges.set(edge, [to]);
        } else if (vertices.indexOf(to) === -1) {
            vertices.push(to);
        }
    }

    removeVertex(vertex: Vertex<V>): void {
        this._vertexCount--;
        const edges = vertex.edges;
        if (!edges) return;
        for (const [_edge, adjacentVertices] of edges) {
            this._vertexCount -= adjacentVertices.length;
        }
        vertex.edges.clear();

        // TODO: iterate all edges and their vertices to find and delete references to `vertex`
    }

    removeEdge(from: Vertex<V>, to: Vertex<V>): void {
        const edges = from.edges;
        if (!edges) return;
        for (const [edge, adjacentVertices] of edges) {
            const index = adjacentVertices.indexOf(to);
            adjacentVertices.splice(index, 1);
            if (adjacentVertices.length === 0) {
                edges.delete(edge);
            }
        }
        if (edges.size === 0) {
            from.edges.clear();
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
        for (const [_edge, adjacentVertices] of from.edges) {
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
    neighboursWithEdgeValue(from: Vertex<V>, edgeValue: E): Vertex<V>[] {
        return from.edges.get(edgeValue) ?? [];
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
                found = (found ?? from).cachedNeighbours.get(value);
                if (!found) return;
            }
            return found;
        }

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

    adjacent(from: Vertex<V>, to: Vertex<V>): boolean {
        for (const [_edge, adjacentVertices] of from.edges) {
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
    public cachedNeighbours: Map<V, Vertex<V>> = new Map();

    constructor(public value: V) {}
}
