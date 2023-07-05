import { FRAMEWORK_DISPLAY_TEXT } from "../constants";
import type { Framework } from "../types/ag-grid";

export const getFrameworkDisplayText = (framework: Framework): string => {
    return FRAMEWORK_DISPLAY_TEXT[framework];
};
