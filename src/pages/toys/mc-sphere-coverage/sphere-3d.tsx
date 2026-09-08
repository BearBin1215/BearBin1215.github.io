import { useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { getSphereVoxels } from "./sphere";

interface SphereCoverage3DProps {
  /** 球直径（格） */
  diameter: number;
  /** 球心间距（格） */
  distance: number;
  /** 3D 视图是否处于打开状态 */
  open: boolean;
}

/** 体素坐标编码偏移：world 坐标范围 [-129, 385]（含邻接查询 ±2），加偏移后落入每轴 10bit 无符号区间 */
const VOXEL_KEY_OFFSET = 129;
/** 体素坐标每轴位宽，三轴共 30bit，编码结果保持在 32 位安全整数范围内 */
const VOXEL_KEY_BITS = 10;

/** 将支持半格球心的体素坐标编码为整数键，避免浮点误差与海量字符串分配影响邻接判断。 */
function voxelKey(x: number, y: number, z: number): number {
  return (
    ((x + VOXEL_KEY_OFFSET) << (VOXEL_KEY_BITS * 2)) |
    ((y + VOXEL_KEY_OFFSET) << VOXEL_KEY_BITS) |
    (z + VOXEL_KEY_OFFSET)
  );
}

/**
 * 在容器中渲染四球覆盖的外露方块。
 * Three.js 与轨道控制器均在组件首次打开时动态加载，避免影响普通 2D 页面首屏。
 */
export function SphereCoverage3D({ diameter, distance, open }: SphereCoverage3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) {
      return;
    }

    let disposed = false;
    let cleanup: (() => void) | undefined;
    setLoading(true);
    setError(null);

    void Promise.all([
      import("three"),
      import("three/examples/jsm/controls/OrbitControls.js"),
    ])
      .then(([THREE, controlsModule]) => {
        if (disposed) {
          return;
        }
        const { OrbitControls } = controlsModule;
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          canvas,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        const scene = new THREE.Scene();
        const isDark = document.documentElement.classList.contains("dark");
        scene.background = new THREE.Color(isDark ? 0x1b2028 : 0xf7f8fa);

        const aspect =
          Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1);
        const camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 2000);
        const span = diameter + distance;
        camera.position.set(span * 1.35, span * 1.05, span * 1.35);
        const target = new THREE.Vector3(distance / 2, 0, distance / 2);
        camera.lookAt(target);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.copy(target);
        controls.enableDamping = true;
        controls.minDistance = Math.max(4, diameter * 0.65);
        controls.maxDistance = Math.max(80, span * 5);

        scene.add(new THREE.HemisphereLight(0xffffff, 0x657080, 2.2));
        const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
        keyLight.position.set(span, span * 1.5, span);
        scene.add(keyLight);

        const occupied = new Set<number>();
        const centers: ReadonlyArray<readonly [number, number]> = [
          [0, 0],
          [distance, 0],
          [0, distance],
          [distance, distance],
        ];
        const offset = diameter - 1;
        // 体素坐标为扁平 [x, y, z] 连续存储
        const voxels = getSphereVoxels(diameter);
        for (const [cx, cy] of centers) {
          for (let i = 0; i < voxels.length; i += 3) {
            const x = voxels[i] ?? 0;
            const y = voxels[i + 1] ?? 0;
            const z = voxels[i + 2] ?? 0;
            occupied.add(
              voxelKey(x * 2 - offset + cx * 2, z * 2 - offset, y * 2 - offset + cy * 2),
            );
          }
        }

        // 渲染四球并集中至少一面外露的方块（occupied 已按世界格去重）
        const exposed: Array<readonly [number, number, number]> = [];
        const neighbors = [
          [2, 0, 0],
          [-2, 0, 0],
          [0, 2, 0],
          [0, -2, 0],
          [0, 0, 2],
          [0, 0, -2],
        ] as const;
        const keyMask = (1 << VOXEL_KEY_BITS) - 1;
        for (const key of occupied) {
          const x = (key >> (VOXEL_KEY_BITS * 2)) - VOXEL_KEY_OFFSET;
          const y = ((key >> VOXEL_KEY_BITS) & keyMask) - VOXEL_KEY_OFFSET;
          const z = (key & keyMask) - VOXEL_KEY_OFFSET;
          if (
            neighbors.some(
              ([dx, dy, dz]) => !occupied.has(voxelKey(x + dx, y + dy, z + dz)),
            )
          ) {
            exposed.push([x, y, z]);
          }
        }

        const geometry = new THREE.BoxGeometry(0.98, 0.98, 0.98);
        const material = new THREE.MeshStandardMaterial({
          color: isDark ? 0x57a8d8 : 0x2f88b5,
          transparent: true,
          opacity: 0.62,
          depthWrite: false,
          roughness: 0.78,
          metalness: 0.03,
        });
        const mesh = new THREE.InstancedMesh(geometry, material, exposed.length);
        const dummy = new THREE.Object3D();
        for (let i = 0; i < exposed.length; i++) {
          const [x, y, z] = exposed[i] ?? [0, 0, 0];
          dummy.position.set(x / 2, y / 2, z / 2);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
        scene.add(mesh);

        const grid = new THREE.GridHelper(
          Math.max(diameter + distance + 8, 16),
          Math.max(diameter + distance + 8, 16),
          isDark ? 0x526170 : 0xc3ccd5,
          isDark ? 0x34404d : 0xdde3e8,
        );
        // 网格覆盖四球包围盒，中心与四个球心构成的正方形中心重合；
        // 高度放在最底层方块的底面，避免与模型产生可见间隙。
        grid.position.set(distance / 2, -diameter / 2, distance / 2);
        scene.add(grid);

        const resize = () => {
          const width = Math.max(container.clientWidth, 1);
          const height = Math.max(container.clientHeight, 1);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        const observer = new ResizeObserver(resize);
        observer.observe(container);
        resize();

        let frame = 0;
        const render = () => {
          controls.update();
          renderer.render(scene, camera);
          frame = requestAnimationFrame(render);
        };
        render();
        setLoading(false);

        cleanup = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          controls.dispose();
          geometry.dispose();
          material.dispose();
          grid.geometry.dispose();
          // GridHelper 的材质类型为单个或数组，两种情况都释放
          if (Array.isArray(grid.material)) {
            for (const m of grid.material) {
              m.dispose();
            }
          } else {
            grid.material.dispose();
          }
          renderer.dispose();
        };
      })
      .catch(() => {
        if (!disposed) {
          setLoading(false);
          setError("3D 视图初始化失败，请稍后重试");
        }
      });

    return () => {
      disposed = true;
      cleanup?.();
      setLoading(false);
    };
  }, [diameter, distance, open]);

  return (
    <div
      ref={containerRef}
      className="relative min-h-0 flex-1 overflow-hidden bg-muted/20"
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70">
          <Spinner className="size-6" />
        </div>
      )}
      {error && (
        <p className="absolute inset-0 flex items-center justify-center px-6 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
