import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import './assets/main.css';
import router from './router';
import { useConfigStore } from './stores/config';

async function bootstrap() {
  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);

  const config = useConfigStore();
  try {
    await config.load();
    if (config.error) {
      console.error('[ptc-dashboard] config load failed:', config.error);
    } else {
      console.info(
        `[ptc-dashboard] config loaded: ${config.recommendations.length} recs, ${config.statusCatalogRows.length} statuses, ${config.fiscalMonthRows.length} months`,
      );
    }
  } catch (e) {
    console.error('[ptc-dashboard] config load threw:', e);
  }

  app.use(router).mount('#app');
}

bootstrap();
