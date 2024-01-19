import { lazy, LazyExoticComponent, FC } from 'react';

interface Route {
  title: string;
  path: string;
  Component: LazyExoticComponent<FC>;
}

const routes: Route[] = [
  {
    title: '首页',
    path: '/',
    Component: lazy(() => import('../pages/home')),
  },
  {
    title: '个人观点',
    path: '/viewpoint',
    Component: lazy(() => import('../pages/viewpoint')),
  },
  {
    title: 'LESS解析器',
    path: '/LessParser',
    Component: lazy(() => import('../pages/tools/LessParser')),
  },
  {
    title: '关于',
    path: '/about',
    Component: lazy(() => import('../pages/about')),
  },
];

export { Route };
export default routes;