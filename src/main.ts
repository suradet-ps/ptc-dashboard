import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import './assets/main.css';
import { useConfigStore } from './stores/config';
import router from './router';

async function bootstrap() {
  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);

  const config = useConfigStore();
  try {
    await config.load();
  } catch {
    // Error is already stored on the config store; continue to mount
    // so the user can see the error UI instead of a blank screen.
  }

  app.use(router).mount('#app');
}

bootstrap();
