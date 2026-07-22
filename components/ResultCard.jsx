"use client";

import { useEffect, useRef } from "react";
import { animate, scrambleText } from "animejs";

export default function ResultCard({ result, loading, error }) {
  const cardRef = useRef(null);
  const scoreRef = useRef(null);

  // 有新结果时，卡片再播一次入场动画
  useEffect(() => {
    if (!cardRef.current) return;

    animate(cardRef.current, {
      opacity: [0, 1],
      translateY: [24, 0],
      duration: 700,
      ease: "outBack",
    });
  }, [result]); // 依赖 result：每次分析成功都会变，动画重播

  // 分数滚动动画：等 result 有了、DOM 上的 strong 挂好再播
  useEffect(() => {
    if (!result || !scoreRef.current) return;

    scoreRef.current.textContent = String(result.score);
    animate(scoreRef.current, {
      innerHTML: scrambleText({ chars: "0-9" }),
      duration: 1500,
    });
  }, [result]);

  // 优先顺序：加载中 → 出错 → 有结果 → 还没分析过
  let body;
  if (loading) {
    body = <p>正在分析，请稍候…</p>;
  } else if (error) {
    body = <p style={{ color: "crimson" }}>{error}</p>;
  } else if (result) {
    body = (
      <div className="result-stack">
        <div className="result-item">
          <span>原文</span>
          <p>{result.text}</p>
        </div>
        <div className="result-item">
          <span>拼音</span>
          <p>{result.pinyin}</p>
        </div>
        <div className="result-grid">
          <div className="result-badge">
            <span>情感分数</span>
            <strong data-score ref={scoreRef}>
              {result.score}
            </strong>
          </div>
          <div className="result-badge">
            <span>情感判断</span>
            <strong>{result.label}</strong>
          </div>
        </div>
      </div>
    );
  } else {
    body = <p>在左侧输入文字，点「开始分析」后这里会显示结果。</p>;
  }

  return (
    <article ref={cardRef} className="panel panel-half lab-panel result-panel card">
      <div className="panel-heading">
        <p className="section-kicker">结果区</p>
        <h3>分析结果</h3>
      </div>
      {body}
    </article>
  );
}