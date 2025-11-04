1s/^/import { AgCharts } from 'ag-charts-angular';\nimport { ModuleRegistry, AllCommunityModules } from 'ag-charts-community';\n/
s/\imports: \[\]/imports: [AgCharts]/
/export class App/{
  a\
  constructor() {\
    ModuleRegistry.registerModules(AllCommunityModules);\
  }\n
}
/title = .*/{
  a\
  options: any = {
  r ../options.partial
  a\
  };
}
