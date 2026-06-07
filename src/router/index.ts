import { watch } from 'vue';
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

import { useAuth } from '@/composables/use-auth';

import DashboardView from '@/views/DashboardView.vue';
import LoginView from '@/views/LoginView.vue';

declare module 'vue-router' {
  interface RouteMeta {
    /** True if the route requires an authenticated session. */
    requiresAuth?: boolean;
    /** True if the route requires admin role. Implies requiresAuth. */
    requiresAdmin?: boolean;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    name: 'home',
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: '/smart-ptc',
    name: 'smart-ptc',
    component: () => import('@/views/SmartPTC/MeetingListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/smart-ptc/propose',
    name: 'smart-ptc-propose',
    component: () => import('@/views/SmartPTC/AgendaProposalView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/smart-ptc/meeting/:id',
    name: 'smart-ptc-meeting',
    component: () => import('@/views/SmartPTC/MeetingDetailView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/smart-ptc/meeting/:id/print',
    name: 'smart-ptc-meeting-print',
    component: () => import('@/views/SmartPTC/MeetingReportPrint.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/smart-ptc/meeting/:id/agenda-print',
    name: 'smart-ptc-agenda-print',
    component: () => import('@/views/SmartPTC/AgendaExportPrint.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('@/views/AdminUsersView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Auth guard. The session can take a moment to hydrate on first
// navigation (it reads from localStorage + queries ptc_user), so we
// wait for `initialized` once and then run the gate synchronously.
let guardReady = false;
let guardReadyPromise: Promise<void> | null = null;

function ensureGuardReady(): Promise<void> {
  if (guardReady) return Promise.resolve();
  if (guardReadyPromise) return guardReadyPromise;
  guardReadyPromise = new Promise((resolve) => {
    // useAuth() is idempotent: calling it here subscribes us to the
    // first session hydration. We resolve when session has been read
    // and ptc_user has been loaded (or determined to be missing).
    const { session, user } = useAuth();
    if (session.value !== null || user.value === null) {
      // Already settled (no session, or already loaded) — proceed.
      guardReady = true;
      resolve();
      return;
    }
    const stop = watch(
      [session, user],
      ([s, u]) => {
        if (s === null || u !== null) {
          stop();
          guardReady = true;
          resolve();
        }
      },
      { immediate: true },
    );
  });
  return guardReadyPromise;
}

router.beforeEach(async (to) => {
  await ensureGuardReady();
  const { isAuthenticated, isAdmin: isAdminFn } = useAuth();

  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth);
  const requiresAdmin = to.matched.some((r) => r.meta.requiresAdmin);

  // Authenticated users shouldn't see the login page — bounce them home.
  if (to.name === 'login' && isAuthenticated.value) {
    return { name: 'home' };
  }

  if (requiresAuth && !isAuthenticated.value) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  if (requiresAdmin && !isAdminFn.value) {
    return { name: 'home' };
  }

  return true;
});

export default router;
