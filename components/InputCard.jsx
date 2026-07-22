"use client";

import { useState } from "react";
import { analyzeText } from "../lib/api.js";

export default function InputCard({ loading, onAnalyzing, onSuccess, onError }) {
  // text 只属于输入卡：打字时结果区不必跟着闪，所以不必提升到 TextLabView
  const [text, setText] = useState("今天的风很轻，适合把脑海里的想法慢慢写下来。");

  async function handleAnalyze() {
    const trimmed = text.trim();
    if (!trimmed) {
      onError("请先输入一段文字");
      return;
    }

    onAnalyzing();
    try {
      // 组件只认这个函数名；里面是 axios 还是 fetch，这里不关心
      const data = await analyzeText(trimmed);
      onSuccess(data);
    } catch (err) {
      onError(err.message || "分析失败，请稍后重试");
    }
  }

  return (
    <article className="panel panel-half lab-panel card">
      <div className="panel-heading">
        <p className="section-kicker">输入区</p>
        <h3>贴一段中文</h3>
      </div>
      <form
        className="lab-form"
        onSubmit={(e) => {
          e.preventDefault(); // 阻止表单默认刷新整页
          handleAnalyze();
        }}
      >
        <label htmlFor="text-input">文本内容</label>
        <textarea
          id="text-input"
          rows="8"
          placeholder="例如：生活没有标准答案，但每一天都值得认真感受。"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
        />
        <p className="lab-count">已输入 {text.length} 字</p>
        {/* type="submit"：回车也能提交；loading 时禁用防连点 */}
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "分析中…" : "开始分析"}
        </button>
      </form>
    </article>
  );
}