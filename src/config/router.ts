import { lazy, LazyExoticComponent, FC } from 'react';

/**
 * 路由基础
 */
interface RouteBasic {
  title: string;
}

/**
 * 页面路由
 */
interface RoutePage extends RouteBasic {
  path: string;
  Component: LazyExoticComponent<FC>;
}

/**
 * 二级路由
 */
interface RouteList extends RouteBasic {
  children: RoutePage[];
}

type Route = RoutePage | RouteList;

/**
 * 路由定义
 */
const routes: Route[] = [
  {
    title: '首页',
    path: '/',
    Component: lazy(() => import('@/pages/home')),
  },
  {
    title: '牢骚',
    children: [
      {
        title: '个人观点',
        path: '/viewpoint',
        Component: lazy(() => import('@/pages/viewpoint')),
      },
    ],
  },
  {
    title: '小玩具',
    children: [
      {
        title: 'Less解析器',
        path: '/LessParser',
        Component: lazy(() => import('@/pages/tools/LessParser')),
      },
    ],
  },
  {
    title: '关于',
    path: '/about',
    Component: lazy(() => import('@/pages/about')),
  },
];

/**
 * 展开嵌套路由为一维
 */
const flattenRoutes = (routes: Route[]) => {
  const flattened: RoutePage[] = [];

  for (const route of routes) {
    if ('path' in route) {
      flattened.push(route);
    } else {
      flattened.push(...route.children);
    }
  }

  return flattened;
};

export { flattenRoutes };
export default routes;
