import { Link } from "react-router";
import { Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useDocumentTitle } from "@/hooks/use-document-title";

/** 通用 404 页面：未匹配到任何路由时渲染在 Layout 的 Outlet 中 */
function NotFound() {
  useDocumentTitle("页面未找到");
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Empty className="min-h-80">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Compass />
          </EmptyMedia>
          <EmptyTitle>页面不存在</EmptyTitle>
          <EmptyDescription>请检查地址或返回首页。</EmptyDescription>
        </EmptyHeader>
        <Link to="/" className={buttonVariants()}>
          返回首页
        </Link>
      </Empty>
    </div>
  );
}

export default NotFound;
