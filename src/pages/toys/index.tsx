import { NavLink, Outlet } from "react-router";
import { cn } from "@/lib/utils";

/** 玩具菜单项 */
interface ToyItem {
  /** 玩具名称 */
  name: string;
  /** 相对于 /toys 的路径 */
  path: string;
}

/** 玩具菜单列表 */
const toys: ToyItem[] = [{ name: "Oritech 效率计算", path: "oritech" }];

/** 根据 NavLink 是否激活返回对应的 className */
const getToyLinkClassNames = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors",
    isActive
      ? "bg-primary/15 font-medium text-foreground"
      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
  );

function Toys() {
  return (
    <div className="flex flex-col md:flex-row">
      {/* 左侧菜单：aside 拉伸填满 main 高度保证右边框完整，nav sticky 在顶栏下方 */}
      <aside className="md:w-72 md:shrink-0 md:self-stretch md:border-r">
        <nav
          className={cn(
            "flex gap-2 overflow-x-auto p-4",
            "md:sticky md:top-(--header-offset) md:flex-col md:gap-1",
            "md:max-h-(--sticky-viewport-height) md:overflow-x-visible md:overflow-y-auto",
            "md:pb-(--header-offset)",
          )}
        >
          {toys.map((toy) => (
            <NavLink key={toy.path} to={toy.path} className={getToyLinkClassNames}>
              {toy.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* 右侧内容 */}
      <main className="min-w-0 flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}

export default Toys;
