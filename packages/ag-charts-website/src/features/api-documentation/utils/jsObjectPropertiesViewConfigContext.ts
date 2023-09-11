import { createContext } from 'react';
import type { JsObjectPropertiesViewConfig } from '../types';

export const JsObjectPropertiesViewConfigContext = createContext<JsObjectPropertiesViewConfig>(
    {} as JsObjectPropertiesViewConfig
);
