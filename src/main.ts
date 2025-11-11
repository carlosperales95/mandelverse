import { createApp } from 'vue'
import App from './App.vue'
import { tooltip } from './directives/tooltip';
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const app = createApp(App);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.directive('tooltip', tooltip);
app.use(pinia);
app.mount('#app');