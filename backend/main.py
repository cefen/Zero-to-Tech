import json
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from openai import AsyncOpenAI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware # 导入跨域中间件

load_dotenv()

app = FastAPI(title="文字实验室 API", version="0.1.0")

# 配置允许跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 开发阶段允许所有前端源访问，生产环境可换成特定的域名/端口
    allow_credentials=True,
    allow_methods=["*"],  # 允许 GET, POST 等所有方法
    allow_headers=["*"],  # 允许所有请求头
)

# 建议优先将 API Key 存放在环境变量中：export DEEPSEEK_API_KEY="sk-xxx"
api_key = os.getenv("DEEPSEEK_API_KEY")
if not api_key:
    raise RuntimeError("未检测到 DEEPSEEK_API_KEY，请检查 .env 文件设置！")

# 初始化 OpenAI 客户端（这里以 DeepSeek 为例，可换成 OpenAI/Qwen 等任何兼容接口）
client = AsyncOpenAI(
    api_key=api_key,
    base_url="https://api.deepseek.com"  # 若用 OpenAI 原生接口，去掉 base_url 即可
)

profile = {
    "heroTitle": "关于我",
    "heroSubtitle": "项目，创意，灵感，心得，我的作品",
}

class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="待分析的中文")

class AnalyzeResponse(BaseModel):
    text: str
    pinyin: str
    score: float
    label: str


@app.get("/api/health")
def health():
    """健康检查：确认服务活着。"""
    return {"ok": True}


@app.get("/api/profile")
def get_profile():
    """对应你手写的 GET /api/profile。"""
    return profile


@app.get("/api/hello")
def get_hello(name: str = None):
    # 稍微防呆处理，避免 name 为 None 时字符串拼接报错
    display_name = name if name else "Guest"
    return {
        "message": f"Hello, {display_name}"
    }


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):  # 1. 改为 async 异步函数，提升高并发吞吐量
    """调用大模型对文本进行拼音转换与情感/属性分析。"""
    
    # 2. 构造 Prompt，提示大模型必须严格返回指定格式的 JSON
    system_prompt = (
        "你是一个精准的文本分析助手。"
        "请对用户输入的中文文本进行分析，并**严格仅返回如下格式的 JSON 字符串**，不要包含任何额外的 markdown 标记或解释说明：\n"
        "{\n"
        '  "pinyin": "文本的汉语拼音（带声调）",\n'
        '  "score": 0.0到1.0之间的浮点数（代表情感倾向，0为极度消极，0.5为中性，1.0为极度积极）,\n'
        '  "label": "情感标签，如：积极/消极/中性/焦虑/开心等短词"\n'
        "}"
    )

    try:
        # 3. 调用大模型 Chat Completions 接口
        response = await client.chat.completions.create(
            model="deepseek-chat",  # 可替换为 gpt-4o-mini 等其他模型名字
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.text}
            ],
            temperature=0.3, # 降低随机性，使输出格式更稳定
            response_format={"type": "json_object"}  # 强制要求返回 JSON 格式
        )

        # 4. 解析 AI 返回的文本内容
        ai_content = response.choices[0].message.content
        ai_data = json.loads(ai_content)

        # 5. 组装并返回 Pydantic 响应对象
        return AnalyzeResponse(
            text=req.text,
            pinyin=ai_data.get("pinyin", ""),
            score=float(ai_data.get("score", 0.5)),
            label=ai_data.get("label", "未知")
        )

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="大模型返回的 JSON 格式解析失败")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"调用 AI 服务失败: {str(e)}")


# 运行: uvicorn main:app --reload --host 127.0.0.1 --port 8000
# 样例: Windows : curl.exe -X POST "http://127.0.0.1:8000/api/analyze" -H "Content-Type: application/json" -d "{\"text\":\"今天学习了 FastAPI，感觉非常好用！\"}"
# Linux : curl -X POST "http://127.0.0.1:8000/api/analyze" \ -H "Content-Type: application/json" \ -d '{"text":"今天学习了 FastAPI，感觉非常好用！"}'z