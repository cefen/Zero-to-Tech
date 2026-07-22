"use client"

import { useState } from "react";
import Nav from "./Nav.jsx";
import PageHeading from "./PageHeading.jsx";
import AnimatedCardGrid from "./AnimatedCardGrid.jsx";
import InputCard from "./InputCard.jsx";
import ResultCard from "./ResultCard.jsx";
import { textLab } from "../data/site.js";

export default function TextLabView() {
  // null = 还没分析过；有对象 = 后端返回的结果
  // useState是React的内置函数，null 代表这个变量里的内容是初始值
  // useState(null) 执行后，React 会返回一个包含两个元素的数组： {当前存储的数据(null),  专门用来修改这个数据的方法(setResult)}
  const [result, setResult] = useState(null); // 将result设为null, setResult为修改result的函数
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // result = null, loading = false, error = "", 这些是初始值

  return (
    /* 网格总容器 */ 
    <AnimatedCardGrid className="dashboard-grid">

      {/* 顶部的全宽大卡片 */}
      <article className="hero-stage panel-full"> 

        {/* 顶部导航栏 */}
        <Nav /> 

        {/* 大标题和副标题 */}
        <PageHeading title={textLab.heroTitle} subtitle={textLab.heroSubtitle} />
     </article>

      {/* 传给输入卡的不是「结果本身」，而是三个回调：
        - 开始请求时：清错误、亮 loading
        - 成功：写入 result
        - 失败：写入 error */}
      <InputCard
        loading={loading}
        onAnalyzing={() => {
          setLoading(true);
          setError("");
        }}
        onSuccess={(data) => {
          setResult(data);
          setLoading(false);
        }}
        onError={(message) => {
          setError(message);
          setLoading(false);
        }}
      />

      {/* 结果卡是「纯展示」：给什么显示什么 */}
      <ResultCard result={result} loading={loading} error={error} />
    </AnimatedCardGrid>
  );
}
