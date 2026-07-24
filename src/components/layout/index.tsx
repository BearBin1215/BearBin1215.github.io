import { Outlet } from "react-router";
import { AudioController } from "@/components/audio-controller";
import { Background } from "@/components/background";
import { NavigationProgress } from "./navigation-progress";
import { Header } from "./header";
import { Footer } from "./footer";
import { BackToTop } from "./back-to-top";

/** 页面整体布局：顶部 sticky + 中间内容 + 底部页脚，均随文档流 */
function Layout() {
  return (
    <>
      <Background />
      {/* 全局音频控制器：在布局层维护唯一 audio 元素，状态来自 zustand store */}
      <AudioController />
      <NavigationProgress />
      <div className="flex min-h-svh flex-col">
        <Header />
        <main className="flex flex-1 flex-col">
          <Outlet />
        </main>
        <Footer />
      </div>
      <BackToTop />
    </>
  );
}

export { Layout };
