from http.server import BaseHTTPRequestHandler, HTTPServer
import json

profile = {
    "heroTitle": "关于我",
    "heroSubtitle": "项目，创意，灵感，心得，我的作品",
}

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):                                               # 若请求方是用GET方法,则执行：
        # print(self.headers)          # 收到的请求头
        # print(self.client_address)   # 请求是从哪个地址来的
                                                      
        if self.path == "/api/profile":
            self.send_response(200)                                 # 响应行 (状态码)
            self.send_header("Content-Type", "application/json")    # 响应头 : 响应格式
            self.end_headers()                                      # 空行
            body = json.dumps(profile, ensure_ascii=False)          # ensure_ascii=False：让中文原样输出
            self.wfile.write(body.encode("utf-8"))                  
        # elif self.path == "/hello":
        #     self.send_response(200)
        #     self.send_header("Content-Type", "text/plain; charset=utf-8")   # ← 一会儿改成 text/plain 再试 (本来是HTML) 
        #                                                                     # 结果:plain 是直接将本来是HTML代码的文字直接显示
        #     self.end_headers()
        #     self.wfile.write("<h1>你好，HTTP</h1>".encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

print("后端已启动：http://localhost:8000/api/profile")
HTTPServer(("", 8000), Handler).serve_forever()
