import {
  SiReact,
  SiTailwindcss,
  SiVite,
  SiTypescript,
  SiShadcnui,
  SiLucide,
  SiAntdesign,
  SiSimpleicons,
  SiGithubactions,
  SiVitest,
  SiMarkdown,
} from "@icons-pack/react-simple-icons";
import { ExternalLink } from "@/components/external-link";
import { SectionTitle } from "@/components/section-title";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { TechCard, type Tech } from "./tech-card";

/** 技术分类 */
interface TechCategory {
  /** 分组标题，如"前端"、"构建"、"图标库" */
  title: string;
  /** 该分组下的所有技术条目 */
  items: Tech[];
}

/** 站点技术栈，按类别分组 */
const techStack: TechCategory[] = [
  {
    title: "前端",
    items: [
      {
        name: "React",
        version: "19",
        description: "UI 构建库",
        url: "https://react.dev",
        icon: SiReact,
      },
      {
        name: "Tailwind CSS",
        version: "4",
        description: "CSS 框架",
        url: "https://tailwindcss.com",
        icon: SiTailwindcss,
      },
      {
        name: "shadcn/ui",
        version: "4",
        description: "UI 组件集",
        url: "https://ui.shadcn.com",
        icon: SiShadcnui,
      },
      {
        name: "react-markdown",
        version: "10",
        description: "Markdown 渲染",
        url: "https://github.com/remarkjs/react-markdown",
        icon: SiMarkdown,
      },
    ],
  },
  {
    title: "构建",
    items: [
      {
        name: "Vite",
        version: "8",
        description: "开发构建工具",
        url: "https://vite.dev",
        icon: SiVite,
      },
      {
        name: "TypeScript",
        version: "6",
        description: "编程语言",
        url: "https://www.typescriptlang.org",
        icon: SiTypescript,
      },
      {
        name: "Vitest",
        version: "4",
        description: "单元测试",
        url: "https://vitest.dev",
        icon: SiVitest,
      },
      {
        name: "GitHub Actions",
        description: "CI/CD 自动构建部署",
        url: "https://docs.github.com/actions",
        icon: SiGithubactions,
      },
    ],
  },
  {
    title: "图标库",
    items: [
      {
        name: "lucide-react",
        version: "1",
        description: "通用图标库",
        url: "https://lucide.dev",
        icon: SiLucide,
      },
      {
        name: "@ant-design/icons",
        version: "6",
        description: "Ant Design 图标",
        url: "https://ant.design/components/icon",
        icon: SiAntdesign,
      },
      {
        name: "react-simple-icons",
        version: "13",
        description: "Simple Icons 的 React 封装",
        url: "https://github.com/icons-pack/react-simple-icons",
        icon: SiSimpleicons,
      },
    ],
  },
];

function About() {
  useDocumentTitle("关于");
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 p-6">
      <section>
        <SectionTitle className="mb-4">关于本站</SectionTitle>
        <article className="prose-sm">
          <p>虽然会写点CSS，但美术水平相当有限，美观程度不足请见谅。</p>
          <p>
            {"这个网站也是建了拆拆了建，最早是非常粗糙的纯静态 HTML"}
            <small>（其实就是一个壳子）</small>
            {`，2023年心血来潮用 `}
            <ExternalLink
              href="https://webpack.js.org/"
              className="underline decoration-foreground/60 decoration-dotted underline-offset-2 transition-colors hover:decoration-foreground"
            >
              webpack
            </ExternalLink>
            {" + react 搞了一版完全自己编写组件的，随便塞了点小玩具进去；后来迁移到 "}
            <ExternalLink
              href="https://rspack.dev"
              className="underline decoration-foreground/60 decoration-dotted underline-offset-2 transition-colors hover:decoration-foreground"
            >
              rspack
            </ExternalLink>
            {
              "，vite 8 出来之后又想体验一下所以又改了；现在又完全推倒用 shadcn/ui 重做，也是一波三折。"
            }
          </p>
          <p>
            从这个版本开始，应该会真的往里面放一些博客文章了。可能还有一些见闻记录，技术感悟等。
          </p>
        </article>
      </section>

      <section>
        <SectionTitle className="mb-6">技术栈</SectionTitle>
        {techStack.map((category) => (
          <div key={category.title} className="mb-6 last:mb-0">
            <SectionTitle as="h3" variant="accent" className="mb-4">
              {category.title}
            </SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {category.items.map((tech) => (
                <TechCard key={tech.name} tech={tech} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default About;
