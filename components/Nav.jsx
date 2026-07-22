"use client";

//   - <Link href="/..."> 表示"点这里跳到那一页"
//   - usePathname() 告诉我们"现在地址栏长什么样"（用来高亮当前页）
// 因为用到了 usePathname、要在浏览器里跑，所以顶上标了 "use client"。
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();
  const items = [
    { href: "/",         label: "个人主页" },
    { href: "/text-lab", label: "文字实验室" },
    { href: "/factor-game", label: "因式分解小游戏"},
  ];

  return (
    <div className="hero-topline">
      <p className="brand-eyebrow">zero to tech</p>
      <nav className="inline-links hero-nav">
        {items.map((it) => {
          const active =
            it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={"nav-link" + (active ? " active" : "")}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
