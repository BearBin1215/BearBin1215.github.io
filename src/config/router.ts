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
  Component: () => Promise<{ default: React.FC }>;
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
    Component: () => import('@/pages/home'),
  },
  {
    title: '牢骚',
    children: [
      {
        title: '个人观点',
        path: '/viewpoint',
        Component: () => import('@/pages/viewpoint'),
      },
    ],
  },
  {
    title: '小玩具',
    children: [
      {
        title: 'Less解析器',
        path: '/lessparser',
        Component: () => import('@/pages/tools/LessParser'),
      },
      {
        title: 'Sass解析器',
        path: '/sassparser',
        Component: () => import('@/pages/tools/SassParser'),
      },
      {
        title: 'MW小工具',
        path: '/mwgadgets',
        Component: () => import('@/pages/tools/MWGadgets'),
      },
    ],
  },
  {
    title: '关于',
    path: '/about',
    Component: () => import('@/pages/about'),
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
export type { RoutePage, RouteList, Route };
export default routes;
