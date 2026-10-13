import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [vue()],
    // One Vue runtime whatever the install layout. In the AG Charts monorepo `vue` is not hoisted,
    // so ag-grid-vue3 and reka-ui each sit beside a copy of their own; components created by one
    // copy cannot render under another.
    resolve: { dedupe: ['vue'] },
});
