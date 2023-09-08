import type { ErrorBar, ErrorBarDatum } from '../../errorBar';

//export function updateErrorBar({node: node, datum: datum}: { node: ErrorBar, datum:  }) {
export function updateErrorBar(node: ErrorBar, datum: ErrorBarDatum) {
    node.datum = datum;
    node.updatePath();
}
