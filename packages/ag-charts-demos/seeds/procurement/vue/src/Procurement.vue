<script setup lang="ts">
import { AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

import WorkspaceApp from './WorkspaceApp.vue';
import './procurement.css';

// Sunburst and Map series are enterprise features.
ModuleRegistry.registerModules([AllEnterpriseModule]);
</script>

<template>
    <WorkspaceApp />
</template>
