// 个人主页。
// 内容从 site.js 的 home 里读——"数据与界面分离"
// 本身纯展示、不带交互，是个"服务端组件"，顶上不用写 "use client"。
//  使用 Next 的 <Link> 来实现页面跳转
import Link from "next/link";
import Nav from "./Nav.jsx";
import PageHeading from "./PageHeading.jsx";
import AnimatedCardGrid from "./AnimatedCardGrid.jsx";
import { home } from "../data/site.js";

export default function HomeView() {
  return (
    <AnimatedCardGrid className="dashboard-grid">
      <article className="hero-stage panel-full">
        <Nav />
        <PageHeading title={home.heroTitle} subtitle={home.heroSubtitle} />
      </article>

      {/*
        panel-half = 占 12 列网格里的 6 列 → 桌面并排两张。
        小屏时 responsive.css 已把 .panel-half 改回 span 12，自动上下叠。
      */}
      {home.works.map((work) => (
        <article
          key={work.id}
          className="panel panel-half featured-work-panel card"
        >
          <p className="section-kicker">{work.kicker}</p>
          <p className="featured-title">{work.title}</p>
          <p className="featured-copy">{work.copy}</p>
          <Link className="featured-link" href={work.href}>
            <span className="featured-link-label">{work.linkLabel}</span>
            <span className="arrow">›</span>
          </Link>
        </article>
      ))}

      <article className="panel panel-full identity-panel card">
        <div className="identity-item">
          <p className="section-kicker">座右铭</p>
          <p className="identity-value identity-quote">{home.identity.motto}</p>
        </div>
        <div className="identity-item">
          <p className="section-kicker">正在学习</p>
          <p className="identity-value">{home.identity.learning}</p>
        </div>
      </article>
    </AnimatedCardGrid>
  );
}
