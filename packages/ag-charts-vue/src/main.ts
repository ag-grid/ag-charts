import { Vue } from 'vue-property-decorator';
import { AgChartsVue } from './AgChartsVue';

Vue.config.productionTip = false;

/*
 * This is for testing this component in isolation - not really useful outside of local dev
 * Not deployed/built for downstream consumption
 */
new Vue({
    render: (h) => h(AgChartsVue),
}).$mount('#app');
