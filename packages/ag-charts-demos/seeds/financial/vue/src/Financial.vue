<script setup lang="ts">
import { AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

import FinancialApp from './FinancialApp.vue';
import './financial.css';

// Candlestick/OHLC series, crosshairs, chart sync, zoom and the navigator are
// all enterprise features, so register the enterprise bundle for this demo.
ModuleRegistry.registerModules([AllEnterpriseModule]);
</script>

<template>
    <FinancialApp />
</template>
