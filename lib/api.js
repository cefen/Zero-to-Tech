import axios from "axios";

/* 创建 axios 实例 */
const api = axios.create({  
  baseURL: "http://127.0.0.1:8000", /* 基础请求地址，后续调用 api.post("/api/analyze") 时，Axios 会自动将其补全为 [http://127.0.0.1:8000/api/analyze] */
  headers: { "Content-Type": "application/json" }, /* 请求头，告诉FastAPI后端我们发送的数据为 JSON 格式 */
  timeout: 60000, /* 请求超时时间，单位为毫秒，60 秒 */
});

/**
 * 调用后端情感分析接口
 * 语法：JSDoc 格式注释。
作用：虽然写的是原生 JavaScript，但加上这段注释后，你（或团队成员）在 VS Code 等编辑器里调用 analyzeText 时，
鼠标悬停就能看到完整的入参类型和返回的数据结构提示，极大提升开发体验。

 * @param {string} text 用户输入的中文
 * @returns {Promise<{text: string, pinyin: string, score: number, label: string}>}
 */
export async function analyzeText(text) {   
    /* text：形参，接收前端输入框传进来的文本内容。 
    async：异步函数，表示该函数会返回一个 Promise 对象, 内部可使用 await 等待 Promise 对象的结果。*/
  try {
    const { data } = await api.post("/api/analyze", { text }); /* await api.post(...)：暂停函数执行，等待后端 HTTP 响应返回。 */
    return data;    /* 返回后端响应的响应体 */
  } 
  
  /* 错误处理 */
  catch (err) {
    // FastAPI 出错时常返回 { detail: "..." }
    const detail = err.response?.data?.detail;
    if (detail) {
      throw new Error(String(detail));
    }
    if (err.code === "ECONNABORTED") {
      throw new Error("请求超时，请稍后重试");
    }
    if (!err.response) {
      throw new Error("无法连接后端，请确认 FastAPI 已在 8000 端口运行");
    }
    throw new Error(err.message || "分析失败，请稍后重试");
  }
}