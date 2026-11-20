import base, { sonarjsConfig, widgetBoundaryConfig } from '../../eslint.config.mjs';

export default [...sonarjsConfig, ...base, widgetBoundaryConfig];
