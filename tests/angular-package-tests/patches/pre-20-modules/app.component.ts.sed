1s/^/import { AgCharts } from 'ag-charts-angular';\nimport { ModuleRegistry, AllCommunityModule } from 'ag-charts-community';\n/
s/\imports: \[\]/imports: [AgCharts]/
/export class AppComponent/{
  a\
  constructor() {\
    ModuleRegistry.registerModules(AllCommunityModule);\
  }\n
}
/title = .*/{
  a\
  options: any = {
  r ../options.partial
  a\
  };
}
