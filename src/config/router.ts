import { lazy, LazyExoticComponent, FC } from 'react';

interface Route {
  title: string;
  path: string;
  Component: LazyExoticComponent<FC>;
}

const routes: Route[] = [
  {
    title: 'Home',
    path: '/',
    Component: lazy(() => import('../pages/home')),
  },
  {
    title: 'About',
    path: '/about',
    Component: lazy(() => import('../pages/about')),
  },
];

export { Route };
export default routes;