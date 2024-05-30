import { AgDefaultDarkTheme } from './agDefaultDarkTheme';
import { AgDefaultTheme } from './agDefaultTheme';
import { AgMaterialDarkTheme } from './agMaterialDarkTheme';
import { AgMaterialTheme } from './agMaterialTheme';
import { AgPolychromaDarkTheme } from './agPolychromaDarkTheme';
import { AgPolychromaTheme } from './agPolychromaTheme';
import { AgSheetsDarkTheme } from './agSheetsDarkTheme';
import { AgSheetsTheme } from './agSheetsTheme';
import { AgVividDarkTheme } from './agVividDarkTheme';
import { AgVividTheme } from './agVividTheme';
import type { ThemeDefinition } from './themeDefinition';
import type { ThemeName } from './themeTypes';

export const themeMap = new Map(
    [
        AgDefaultTheme,
        AgDefaultDarkTheme,
        AgMaterialTheme,
        AgMaterialDarkTheme,
        AgPolychromaTheme,
        AgPolychromaDarkTheme,
        AgSheetsTheme,
        AgSheetsDarkTheme,
        AgVividTheme,
        AgVividDarkTheme,
    ].map((themeDef) => [themeDef.themeName, themeDef]) as [ThemeName, ThemeDefinition<any, any>][]
);
