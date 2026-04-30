type Renderer<P, R> = (params: P) => string | R | undefined;

interface RendererParams {
    text: string;
}

interface RendererResult {
    html: string;
}

interface test_CorrectSharedRenderer {
    renderer?: Renderer<RendererParams, RendererResult>;
}

interface test_CorrectSharedRendererWithStringR {
    renderer?: Renderer<RendererParams, string>;
}

interface test_CorrectSharedRendererInUnion {
    renderer?: Renderer<RendererParams, RendererResult> | undefined;
}

interface test_IncorrectBespokeRenderer {
    renderer?: (params: RendererParams) => string;
}

interface test_IncorrectBespokeRendererUndefined {
    renderer?: (params: RendererParams) => string | undefined;
}

interface test_IncorrectAliasedRenderer {
    renderer?: SomeOtherType;
}

type SomeOtherType = (params: RendererParams) => string;
