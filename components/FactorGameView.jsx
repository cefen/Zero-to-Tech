"use client";

/**
 * FactorGameView.jsx
 * ------------------------------------------------------------
 * 把 works/DIVgame.html 接到 Next.js 后的「页面视图」。
 * 对照文字实验室：TextLabView = 实验室页；本文件 = 游戏页。
 *
 * 为什么顶上必须 "use client"？
 * - 有 useState / useEffect / 点击 / requestAnimationFrame / localStorage
 * - 这些只能在浏览器里跑，不能当纯服务端组件
 *
 * 设计取舍（重要）：
 * - 分数、计时仍用「改 DOM 文本」更新（跟原 HTML 一样），
 *   因为计时器每 10ms 跳一次，若每次都 setState 会疯狂重渲染。
 * - 开始/结束遮罩用 useState，因为它们是低频 UI 切换。
 * - 掉落的等式用 createElement 挂到 boardRef 上，避免每帧 React reconcile。
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Nav from "./Nav.jsx";
import PageHeading from "./PageHeading.jsx";
import AnimatedCardGrid from "./AnimatedCardGrid.jsx";
import { factorGame } from "../data/site.js";
// 样式只应由游戏页引入；不要塞进 app/layout.jsx，否则会变成「全局污染」
import "../css/factorgame.css";

/** 题库：correct=true 点中 +1；false 为经典易错干扰项，点中 −1 */
const EQUATIONS_POOL = [
  // Correct - Numerical Common Factor
  { text: "2x + 4 = 2(x + 2)", correct: true },
  { text: "3a - 6 = 3(a - 2)", correct: true },
  { text: "5x + 10 = 5(x + 2)", correct: true },
  { text: "4y - 12 = 4(y - 3)", correct: true },
  { text: "10b + 20 = 10(b + 2)", correct: true },
  { text: "2x - 2 = 2(x - 1)", correct: true },
  { text: "3x + 9 = 3(x + 3)", correct: true },
  { text: "5a - 15 = 5(a - 3)", correct: true },
  { text: "4k + 8 = 4(k + 2)", correct: true },
  { text: "6x - 12 = 6(x - 2)", correct: true },

  // Correct - Simple Variable Factor
  { text: "x² + x = x(x + 1)", correct: true },
  { text: "a² - a = a(a - 1)", correct: true },
  { text: "x² + 2x = x(x + 2)", correct: true },
  { text: "y² - 3y = y(y - 3)", correct: true },
  { text: "m² + 4m = m(m + 4)", correct: true },
  { text: "b² - 5b = b(b - 5)", correct: true },
  { text: "x² - 3x = x(x - 3)", correct: true },
  { text: "a² + 5a = a(a + 5)", correct: true },
  { text: "k² + k = k(k + 1)", correct: true },
  { text: "x² - x = x(x - 1)", correct: true },

  // Correct - Formulas
  { text: "x² - 1 = (x + 1)(x - 1)", correct: true },
  { text: "x² - 4 = (x + 2)(x - 2)", correct: true },
  { text: "a² - 9 = (a + 3)(a - 3)", correct: true },
  { text: "x² - 16 = (x + 4)(x - 4)", correct: true },
  { text: "x² + 2x + 1 = (x + 1)²", correct: true },
  { text: "x² - 2x + 1 = (x - 1)²", correct: true },
  { text: "a² + 4a + 4 = (a + 2)²", correct: true },
  { text: "x² - 4x + 4 = (x - 2)²", correct: true },
  { text: "x² + 6x + 9 = (x + 3)²", correct: true },
  { text: "4x² - 9 = (2x + 3)(2x - 3)", correct: true },

  // Incorrect — 提公因式易错
  { text: "2x + 4 = 2(x + 4)", correct: false },
  { text: "3a - 6 = 3(a - 6)", correct: false },
  { text: "5x + 10 = 5(x + 5)", correct: false },
  { text: "4y - 12 = 4(y - 12)", correct: false },
  { text: "10b + 20 = 10(b + 20)", correct: false },
  { text: "3x + 9 = 3(x + 9)", correct: false },
  { text: "4k + 8 = 4(k + 8)", correct: false },
  { text: "6x - 12 = 6(x - 12)", correct: false },
  { text: "2x - 2 = 2(x - 2)", correct: false },
  { text: "8a + 4 = 8(a + 4)", correct: false },

  // Incorrect — 提公因式时漏符号 / 乱凑
  { text: "x² + x = x(x + x)", correct: false },
  { text: "a² - a = a(a - a)", correct: false },
  { text: "x² + 2x = x(x + 2x)", correct: false },
  { text: "x² - 3x = x(x - 3x)", correct: false },
  { text: "y² - 3y = y(y - 3y)", correct: false },
  { text: "m² + 4m = m(m + 4m)", correct: false },

  // Incorrect — 平方差 / 完全平方经典混淆（如 x²-4=(x-2)²）
  { text: "x² - 1 = (x - 1)²", correct: false },
  { text: "x² - 4 = (x - 2)²", correct: false },
  { text: "a² - 9 = (a - 3)²", correct: false },
  { text: "x² - 16 = (x - 4)²", correct: false },
  { text: "x² - 25 = (x - 5)²", correct: false },
  { text: "x² - 4 = (x + 2)²", correct: false },
  { text: "a² - 9 = (a + 3)²", correct: false },
  { text: "x² - 1 = (x + 1)²", correct: false },
  { text: "4x² - 9 = (2x - 3)²", correct: false },
  { text: "x² - 9 = x(x - 9)", correct: false },

  // Incorrect — 完全平方式展开写残
  { text: "x² + 2x + 1 = x² + 1", correct: false },
  { text: "x² - 2x + 1 = x² - 1", correct: false },
  { text: "a² + 4a + 4 = a² + 4", correct: false },
  { text: "x² + 6x + 9 = (x + 6)²", correct: false },
  { text: "x² - 4x + 4 = (x + 2)²", correct: false },
  { text: "x² + 2x + 1 = (x - 1)²", correct: false },
  { text: "x² - 2x + 1 = (x + 1)²", correct: false },
  { text: "a² + 4a + 4 = (a - 2)²", correct: false },
];

const SHAPES = ["bubble", "rect", "diamond", "square", "trapezoid"];
const HISTORY_KEY = "factorization_game_history";
const WIN_SCORE = 10;
const FAIL_SCORE = -1; // 掉到 −1 立即失败结算

export default function FactorGameView() {
  const rootRef = useRef(null); // 游戏根节点（烟花挂这里，不挂 body）
  const boardRef = useRef(null);
  const scoreElRef = useRef(null);
  const timerElRef = useRef(null);
  const historyListRef = useRef(null);

  // 可变游戏状态放 ref：定时器回调里读最新值，不必闭包过期
  const scoreRef = useRef(0);
  const startTimeRef = useRef(null);
  const runningRef = useRef(false);
  const timerIntervalRef = useRef(null);
  const spawnIntervalRef = useRef(null);

  // 本局统计：答对/答错、正确题的反应时间累加（毫秒）
  const correctCountRef = useRef(0);
  const wrongCountRef = useRef(0);
  const reactionSumMsRef = useRef(0);

  const [showStart, setShowStart] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  /** outcome: "win" | "fail" —— 决定结算标题与视觉风格 */
  const [finalStats, setFinalStats] = useState({
    outcome: "win",
    time: "0.00",
    wrong: 0,
    correct: 0,
    total: 0,
    avgReaction: "—",
    score: 0,
  });

  /** 把分数刷到左上角，并闪一下 */
  function paintScore() {
    if (!scoreElRef.current) return;
    scoreElRef.current.innerText = String(scoreRef.current);
    scoreElRef.current.parentElement?.classList.add("score-anim");
    setTimeout(
      () => scoreElRef.current?.parentElement?.classList.remove("score-anim"),
      300
    );
  }

  function resetRoundStats() {
    correctCountRef.current = 0;
    wrongCountRef.current = 0;
    reactionSumMsRef.current = 0;
  }

  /** 从 localStorage 读历史，画到底部列表 */
  function loadHistory() {
    const el = historyListRef.current;
    if (!el) return;
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    if (history.length === 0) {
      el.innerHTML =
        '<div style="text-align: center; opacity: 0.6;">暂无历史记录</div>';
      return;
    }
    el.innerHTML = history
      .map(
        (item) => `
      <div class="history-item">
        <span>${item.date}</span>
        <span><strong>${item.time}s</strong></span>
      </div>`
      )
      .join("");
  }

  function saveHistory(time) {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    history.unshift({ time, date: new Date().toLocaleString() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
    loadHistory();
  }

  function clearHistory() {
    if (confirm("确定要清空所有历史记录吗？")) {
      localStorage.removeItem(HISTORY_KEY);
      loadHistory();
    }
  }

  function updateTimer() {
    if (!timerElRef.current || !startTimeRef.current) return;
    const diff = (Date.now() - startTimeRef.current) / 1000;
    timerElRef.current.innerText = diff.toFixed(2);
  }

  function stopLoops() {
    clearInterval(timerIntervalRef.current);
    clearInterval(spawnIntervalRef.current);
    timerIntervalRef.current = null;
    spawnIntervalRef.current = null;
  }

  /** 清空棋盘上残留的等式 / 特效节点 */
  function clearBoard() {
    const board = boardRef.current;
    if (board) board.innerHTML = "";
  }

  function createSuccessEffect(x, y) {
    const board = boardRef.current;
    if (!board) return;
    const burst = document.createElement("div");
    burst.className = "success-burst";
    burst.style.left = `${x - 100}px`;
    burst.style.top = `${y - 100}px`;
    board.appendChild(burst);

    const flash = document.createElement("div");
    flash.className = "flash flash-success";
    burst.appendChild(flash);

    for (let i = 0; i < 30; i++) {
      const particle = document.createElement("div");
      particle.className = "success-particle";
      const size = 6 + Math.random() * 12;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 100;
      particle.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
      particle.style.setProperty("--ty", `${Math.sin(angle) * dist}px`);
      particle.style.left = "100px";
      particle.style.top = "100px";
      const colors = ["#50e3c2", "#4a90e2", "#ffffff", "#b2fef2"];
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];
      burst.appendChild(particle);
    }
    setTimeout(() => burst.remove(), 800);
  }

  function createExplosion(x, y) {
    const board = boardRef.current;
    if (!board) return;
    const explosion = document.createElement("div");
    explosion.className = "explosion";
    explosion.style.left = `${x - 100}px`;
    explosion.style.top = `${y - 100}px`;
    board.appendChild(explosion);

    const flash = document.createElement("div");
    flash.className = "flash";
    explosion.appendChild(flash);

    for (let i = 0; i < 40; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      const size = 8 + Math.random() * 15;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 120;
      particle.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
      particle.style.setProperty("--ty", `${Math.sin(angle) * dist}px`);
      particle.style.left = "100px";
      particle.style.top = "100px";
      const colors = ["#ff4d4d", "#ff944d", "#ffeb3b", "#ffffff"];
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];
      explosion.appendChild(particle);
    }
    setTimeout(() => explosion.remove(), 800);
  }

  function createCelebration() {
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const colors = ["#50e3c2", "#4a90e2", "#fdbb2d", "#ff4d4d", "#b21f1f", "#ffffff"];

    for (let wave = 0; wave < 3; wave++) {
      setTimeout(() => {
        for (let i = 0; i < 60; i++) {
          const particle = document.createElement("div");
          particle.className = "celebration-particle";
          const size = 10 + Math.random() * 20;
          particle.style.width = `${size}px`;
          particle.style.height = `${size}px`;
          particle.style.background = colors[Math.floor(Math.random() * colors.length)];
          particle.style.boxShadow = `0 0 15px ${particle.style.background}`;
          const angle = Math.random() * Math.PI * 2;
          const dist = 120 + Math.random() * 220;
          particle.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
          particle.style.setProperty("--ty", `${Math.sin(angle) * dist}px`);
          particle.style.left = `${centerX}px`;
          particle.style.top = `${centerY}px`;
          root.appendChild(particle);
          setTimeout(() => particle.remove(), 1500);
        }
      }, wave * 300);
    }
  }

  /** @param {"win"|"fail"} outcome */
  function endGame(outcome) {
    runningRef.current = false;
    stopLoops();
    if (outcome === "win") createCelebration();

    const timeText = timerElRef.current?.innerText || "0.00";
    const correct = correctCountRef.current;
    const wrong = wrongCountRef.current;
    const total = correct + wrong;
    // 平均反应时间：仅统计「点对」的题；从完全露出到点击的毫秒均值
    const avgReaction =
      correct > 0
        ? (reactionSumMsRef.current / correct / 1000).toFixed(2)
        : "—";

    setFinalStats({
      outcome,
      time: timeText,
      wrong,
      correct,
      total,
      avgReaction,
      score: scoreRef.current,
    });
    // 失败略快弹出嘲讽；成功留一秒看烟花
    setTimeout(() => setShowGameOver(true), outcome === "win" ? 1000 : 450);
    saveHistory(timeText);
  }

  function handleItemClick(element, isCorrect) {
    if (!runningRef.current) return;
    const cx = element.offsetLeft + element.clientWidth / 2;
    const cy = element.offsetTop + element.clientHeight / 2;

    if (isCorrect) {
      // 反应时间：算式顶边完全进入棋盘（visibleAt）→ 点对
      const visibleAt = element._visibleAt ?? Date.now();
      const reactionMs = Math.max(0, Date.now() - visibleAt);
      reactionSumMsRef.current += reactionMs;
      correctCountRef.current += 1;

      scoreRef.current += 1;
      paintScore();
      createSuccessEffect(cx, cy);
      element.remove();
      if (scoreRef.current >= WIN_SCORE) endGame("win");
    } else {
      wrongCountRef.current += 1;
      // 答错 −1；允许掉到 FAIL_SCORE（−1）触发即时失败
      scoreRef.current -= 1;
      paintScore();
      createExplosion(cx, cy);
      element.remove();
      if (scoreRef.current <= FAIL_SCORE) endGame("fail");
    }
  }

  function spawnEquation() {
    if (!runningRef.current) return;
    const board = boardRef.current;
    if (!board) return;

    const eqData = EQUATIONS_POOL[Math.floor(Math.random() * EQUATIONS_POOL.length)];
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const div = document.createElement("div");
    div.className = `equation-item shape-${shape}`;
    div.innerText = eqData.text;

    const baseWidth = 200;
    const width = baseWidth + Math.random() * 50;
    let height = 100;

    if (shape === "bubble" || shape === "square") {
      const side = Math.max(width, 140);
      div.style.width = `${side}px`;
      div.style.height = `${side}px`;
    } else if (shape === "diamond") {
      div.style.width = `${width * 1.4}px`;
      div.style.height = `${width * 1.2}px`;
    } else if (shape === "trapezoid") {
      div.style.width = `${width * 1.3}px`;
      div.style.height = `100px`;
    } else {
      div.style.width = `${width}px`;
      div.style.height = `${height}px`;
    }

    const startX = Math.random() * Math.max(0, board.clientWidth - parseFloat(div.style.width));
    div.style.left = `${startX}px`;
    div.style.top = `-150px`;
    board.appendChild(div);

    // 完全露出时刻：算式顶边刚进入棋盘可见区（posY >= 0）时记下
    div._visibleAt = null;

    let posY = -100;
    const speed = 0.6 + Math.random() * 0.8;

    const fall = () => {
      // 离开页面 / 结束游戏后，动画要停，并删节点，防止内存泄漏
      if (!runningRef.current) {
        div.remove();
        return;
      }
      posY += speed;
      div.style.top = `${posY}px`;
      if (div._visibleAt == null && posY >= 0) {
        div._visibleAt = Date.now();
      }
      if (posY > board.clientHeight) {
        div.remove();
      } else {
        requestAnimationFrame(fall);
      }
    };

    div.onclick = (e) => {
      e.stopPropagation();
      handleItemClick(div, eqData.correct);
    };

    requestAnimationFrame(fall);
  }

  function startGame() {
    setShowStart(false);
    setShowGameOver(false);
    clearBoard();
    runningRef.current = true;
    scoreRef.current = 0;
    resetRoundStats();
    if (scoreElRef.current) scoreElRef.current.innerText = "0";
    if (timerElRef.current) timerElRef.current.innerText = "0.00";
    startTimeRef.current = Date.now();

    stopLoops();
    timerIntervalRef.current = setInterval(updateTimer, 10);
    spawnIntervalRef.current = setInterval(spawnEquation, 2500);
    spawnEquation(); // 立刻掉一个，不用干等 2.5s
  }

  /** 再来一局：原 HTML 用 location.reload()；在 SPA 里应重置状态，不要整页刷新 */
  function restartGame() {
    setShowGameOver(false);
    setShowStart(true);
    runningRef.current = false;
    stopLoops();
    clearBoard();
    scoreRef.current = 0;
    resetRoundStats();
    if (scoreElRef.current) scoreElRef.current.innerText = "0";
    if (timerElRef.current) timerElRef.current.innerText = "0.00";
  }

  // 挂载：读历史；卸载：停定时器 + 清棋盘（路由切走时必须清理）
  useEffect(() => {
    loadHistory();
    return () => {
      runningRef.current = false;
      stopLoops();
      clearBoard();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatedCardGrid className="dashboard-grid">
      <article className="hero-stage panel-full">
        <Nav />
        <PageHeading title={factorGame.heroTitle} subtitle={factorGame.heroSubtitle} />
        {/* 小出口：回首页，和文字实验室体验一致 */}
        <p style={{ marginTop: 8 }}>
          <Link href="/" className="featured-link">
            <span className="featured-link-label">← 返回主页</span>
          </Link>
        </p>
      </article>

      <article className="panel panel-full card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="factor-game-root" ref={rootRef}>
          <div id="game-container">
            <div id="ui-overlay">
              <div id="score-display" className="stat-card">
                得分: <span ref={scoreElRef}>0</span>
                <span className="score-range">
                  {" "}
                  ({FAIL_SCORE} 失败 · {WIN_SCORE} 通关)
                </span>
              </div>
              <div id="timer-display" className="stat-card">
                用时: <span ref={timerElRef}>0.00</span>s
              </div>
            </div>

            <div id="game-board" ref={boardRef} />

            <div id="bottom-panel">
              <div id="history-list" ref={historyListRef}>
                <div style={{ textAlign: "center", opacity: 0.6 }}>暂无历史记录</div>
              </div>
              <button type="button" id="clear-history" onClick={clearHistory}>
                清空历史记录
              </button>
            </div>

            {showStart && (
              <div id="start-overlay">
                <h1>因式分解掉落版</h1>
                <ul className="rule-list">
                  <li>点击<strong>正确</strong>的等式：得分 <strong>+1</strong></li>
                  <li>点击<strong>错误</strong>的等式：得分 <strong>−1</strong></li>
                  <li>
                    达到 <strong>{WIN_SCORE}</strong> 分 → 成功通关
                  </li>
                  <li>
                    掉到 <strong>{FAIL_SCORE}</strong> 分 → <strong>即时失败</strong>
                  </li>
                </ul>
                <button type="button" className="btn-start" onClick={startGame}>
                  开始游戏
                </button>
              </div>
            )}

            {showGameOver && (
              <div
                id="game-over-overlay"
                className={
                  finalStats.outcome === "win"
                    ? "outcome-win"
                    : "outcome-fail"
                }
                style={{ display: "flex" }}
              >
                {finalStats.outcome === "win" ? (
                  <>
                    <p className="outcome-kicker">完美通关</p>
                    <h1 className="outcome-title outcome-title-win">
                      你是数学小天才！
                    </h1>
                    <p className="outcome-subtitle outcome-subtitle-win">
                      10 分完美通关，因式分解在你手里像喝水一样简单！
                    </p>
                  </>
                ) : (
                  <>
                    <p className="outcome-kicker outcome-kicker-fail">即时失败</p>
                    <h1 className="outcome-title outcome-title-fail">
                      你是数学小庸才！
                    </h1>
                    <p className="outcome-subtitle outcome-subtitle-fail">
                      积分掉到 −1……建议回去把平方差和完全平方背熟再来挑战。
                    </p>
                  </>
                )}

                <p className="final-time">
                  最终用时: <strong>{finalStats.time}</strong>s
                  <span className="final-score-tag">
                    {" "}
                    · 结算分 {finalStats.score}
                  </span>
                </p>
                <ul className="stats-list">
                  <li>
                    <span className="stats-label">答错题数</span>
                    <span className="stats-value">{finalStats.wrong}</span>
                  </li>
                  <li>
                    <span className="stats-label">答对 / 全部作答</span>
                    <span className="stats-value">
                      {finalStats.correct}/{finalStats.total}
                    </span>
                  </li>
                  <li>
                    <span className="stats-label">平均反应时间</span>
                    <span className="stats-value">
                      {finalStats.avgReaction === "—"
                        ? "—"
                        : `${finalStats.avgReaction}s`}
                    </span>
                  </li>
                </ul>
                <p className="stats-hint">
                  反应时间：算式完全露出后，到你点对它的平均间隔
                </p>
                <button
                  type="button"
                  className={
                    "btn-start" +
                    (finalStats.outcome === "fail" ? " btn-retry-fail" : "")
                  }
                  onClick={restartGame}
                >
                  再来一局
                </button>
              </div>
            )}
          </div>
        </div>
      </article>
    </AnimatedCardGrid>
  );
}
