import { Navigate, type RouteObject } from "react-router";
import { Layout } from "@/components/layout";
import { LoadingPlaceholder } from "@/components/loading-placeholder";

/** 初始 hydration 阶段占位：lazy 路由尚未加载完成时渲染在 Layout 的 Outlet 位置 */
function RootHydrateFallback() {
  return <LoadingPlaceholder spinnerSize="size-12" className="mt-20 flex-1" />;
}

/** 应用路由配置数组 */
const routes: RouteObject[] = [
  {
    element: <Layout />,
    /**
     * 初始 hydration 阶段（lazy 路由尚未加载完成）渲染在 Layout 的 Outlet 位置，
     * Layout 框架（Header/Footer/Background）仍正常显示，避免白屏与控制台警告。
     */
    HydrateFallback: RootHydrateFallback,
    children: [
      {
        path: "/",
        lazy: () => import("@/pages/home").then((m) => ({ Component: m.default })),
      },
      {
        path: "/about",
        lazy: () => import("@/pages/about").then((m) => ({ Component: m.default })),
      },
      {
        path: "/toys",
        lazy: () => import("@/pages/toys").then((m) => ({ Component: m.default })),
        children: [
          { index: true, element: <Navigate to="oritech" replace /> },
          {
            path: "oritech",
            lazy: () =>
              import("@/pages/toys/oritech").then((m) => ({ Component: m.default })),
          },
          {
            path: "pokemon-type-chart",
            lazy: () =>
              import("@/pages/toys/pokemon-type-chart").then((m) => ({
                Component: m.default,
              })),
          },
        ],
      },
      {
        path: "/blog",
        lazy: () => import("@/pages/blog").then((m) => ({ Component: m.default })),
        children: [
          {
            index: true,
            lazy: () =>
              import("@/pages/blog/overview").then((m) => ({ Component: m.default })),
          },
          {
            path: ":slug",
            lazy: () =>
              import("@/pages/blog/post").then((m) => ({ Component: m.default })),
          },
        ],
      },
      {
        path: "*",
        lazy: () => import("@/pages/not-found").then((m) => ({ Component: m.default })),
      },
    ],
  },
];

export { routes };
