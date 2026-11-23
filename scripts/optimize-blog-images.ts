/**
 * 博客配图批处理：把原图缩放为长边受控的 WebP，并清除 EXIF/GPS/ICC 等元数据。
 *
 * 单张图片的处理：等比缩放到长边不超过 width（默认 2048）、编码为 WebP（默认质量 82）、
 * 删除原图（--keep 可保留）。
 * 动画图只转码不缩放；sharp 默认不写入任何元数据，输出文件不会携带原图的 EXIF 与 GPS。
 *
 * 用法（Node ≥ 22.18 可直接运行 .ts）：
 *   pnpm images                        处理 src/content/blog 下全部图片
 *   pnpm images 2026/1121-M3-autumn    只处理指定文章目录
 *   pnpm images --dry-run              仅列出将处理的文件
 *   pnpm images --keep --force         保留原图并覆盖已存在的 .webp
 */

import { existsSync } from "node:fs";
import { readdir, readFile, stat, unlink } from "node:fs/promises";
import { basename, extname, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import sharp from "sharp";

/** 项目根目录（脚本位于 <root>/scripts/） */
const projectRoot = resolve(import.meta.dirname, "..");

/** 博客图片搜索根目录 */
const blogRoot = join(projectRoot, "src", "content", "blog");

/** 需要转换的源图片扩展名（小写） */
const sourceExtensions = new Set([".jpg", ".jpeg", ".png", ".gif"]);

/** 命令行开关 */
interface CliOptions {
  /** 输出图片的长边像素上限 */
  width: number;
  /** WebP 编码质量（1-100） */
  quality: number;
  /** 是否保留原图 */
  keepSource: boolean;
  /** 是否覆盖已存在的同名 .webp */
  force: boolean;
  /** 是否只打印待处理文件而不写入 */
  dryRun: boolean;
}

/** 单张图片的处理结果 */
interface ConversionResult {
  /** 源文件绝对路径 */
  source: string;
  /** 源文件字节数 */
  sourceBytes: number;
  /** 输出文件字节数 */
  outputBytes: number;
  /** 是否因 .webp 已存在而跳过 */
  skipped: boolean;
}

/**
 * 把图片路径的扩展名替换为 nextExtension。
 * 非图片扩展名原样返回，扩展名集合统一以 sourceExtensions 为准。
 */
function replaceImageExtension(file: string, nextExtension: string): string {
  const extension = extname(file).toLowerCase();
  if (!sourceExtensions.has(extension)) {
    return file;
  }
  return `${file.slice(0, -extension.length)}${nextExtension}`;
}

/**
 * 解析命令行参数，位置参数为相对 src/content/blog 的子目录。
 * 数值参数非法时抛出错误，由入口统一打印。
 */
function parseCli(): { subPath: string; options: CliOptions } {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      width: { type: "string", default: "2048" },
      quality: { type: "string", default: "82" },
      keep: { type: "boolean", default: false },
      force: { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
    },
  });

  const width = Number(values.width);
  const quality = Number(values.quality);
  if (!Number.isFinite(width) || width <= 0) {
    throw new Error(`--width 需要正整数，收到：${values.width}`);
  }
  if (!Number.isFinite(quality) || quality < 1 || quality > 100) {
    throw new Error(`--quality 需要在 1-100 之间，收到：${values.quality}`);
  }

  return {
    subPath: positionals[0] ?? "",
    options: {
      width: Math.round(width),
      quality: Math.round(quality),
      keepSource: values.keep ?? false,
      force: values.force ?? false,
      dryRun: values["dry-run"] ?? false,
    },
  };
}

/** 递归收集目录下待转换的源图片 */
async function collectImages(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectImages(fullPath)));
    } else if (sourceExtensions.has(extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * 转换单张图片：缩放并编码为 WebP，随后按选项删除原图。
 * 动画图只转码不缩放：多帧图的 height 是各帧拼接后的总高度，按长边缩放会把每帧压得过小。
 * 目标 .webp 已存在且未指定 --force 时跳过，避免重复压缩损失画质。
 */
async function convertImage(
  source: string,
  options: CliOptions,
): Promise<ConversionResult> {
  const output = replaceImageExtension(source, ".webp");
  const sourceBytes = (await stat(source)).size;

  if (existsSync(output) && !options.force) {
    return { source, sourceBytes, outputBytes: 0, skipped: true };
  }

  // 先读入内存：Windows 上 sharp 按路径读取会在删除源文件时返回 EBUSY
  const input = await readFile(source);
  const image = sharp(input, { animated: true });
  const { pages } = await image.metadata();
  const animated = (pages ?? 1) > 1;
  const scaled = animated
    ? image
    : image.resize({
        width: options.width,
        height: options.width,
        fit: "inside",
        withoutEnlargement: true,
      });

  await scaled
    .webp({ quality: options.quality, effort: 5, smartSubsample: true })
    .toFile(output);

  if (!options.keepSource) {
    await unlink(source);
  }

  return {
    source,
    sourceBytes,
    outputBytes: (await stat(output)).size,
    skipped: false,
  };
}

/** 字节数格式化为 KB / MB 字符串 */
function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
}

/** 打印单张处理结果，缩进以便与汇总输出区分 */
function printResult(result: ConversionResult): void {
  const name = basename(result.source);
  if (result.skipped) {
    console.log(`  跳过 ${name}（已存在 .webp，用 --force 覆盖）`);
    return;
  }
  const ratio = ((result.outputBytes / result.sourceBytes) * 100).toFixed(1);
  console.log(
    `  ${name}  ${formatSize(result.sourceBytes)} → ${formatSize(result.outputBytes)}（${ratio}%）`,
  );
}

async function main(): Promise<void> {
  const { subPath, options } = parseCli();
  const targetDir = subPath ? resolve(blogRoot, subPath) : blogRoot;
  if (relative(blogRoot, targetDir).startsWith("..")) {
    throw new Error(`目标目录必须位于 ${blogRoot} 内，收到：${targetDir}`);
  }

  const images = await collectImages(targetDir);
  if (images.length === 0) {
    console.log(`未在 ${targetDir} 找到待处理的图片`);
    return;
  }

  console.log(
    `处理 ${images.length} 张图片 → WebP，长边 ${options.width}px，质量 ${options.quality}` +
      `${options.dryRun ? "（dry-run，不写入文件）" : ""}`,
  );

  let sourceTotal = 0;
  let outputTotal = 0;
  let converted = 0;

  for (const image of images) {
    if (options.dryRun) {
      console.log(`  待处理 ${relative(projectRoot, image)}`);
      continue;
    }
    const result = await convertImage(image, options);
    printResult(result);
    if (result.skipped) {
      continue;
    }
    converted += 1;
    sourceTotal += result.sourceBytes;
    outputTotal += result.outputBytes;
  }

  if (converted === 0) {
    console.log("没有需要转换的图片");
    return;
  }

  const percent = ((outputTotal / sourceTotal) * 100).toFixed(1);
  console.log(
    `完成 ${converted} 张：${formatSize(sourceTotal)} → ${formatSize(outputTotal)}（${percent}%）`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
