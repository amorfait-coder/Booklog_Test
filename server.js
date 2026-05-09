const fs = require("node:fs");
const http = require("node:http");
const https = require("node:https");
const path = require("node:path");
const { URL } = require("node:url");

const rootDir = __dirname;
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (request.method !== "GET") {
    sendJson(response, 405, { message: "지원하지 않는 요청 방식입니다." });
    return;
  }

  if (requestUrl.pathname === "/api/naver-books") {
    handleNaverBookSearch(requestUrl, response);
    return;
  }

  serveStaticFile(requestUrl.pathname, response);
});

server.listen(port, () => {
  console.log(`Booklog server running at http://localhost:${port}`);
});

function handleNaverBookSearch(requestUrl, response) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  const query = requestUrl.searchParams.get("query")?.trim();

  if (!clientId || !clientSecret) {
    sendJson(response, 500, {
      message: "NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET 환경변수를 설정한 뒤 서버를 다시 실행하세요.",
    });
    return;
  }

  if (!query) {
    sendJson(response, 400, { message: "검색어가 필요합니다." });
    return;
  }

  const naverPath = `/v1/search/book.json?${new URLSearchParams({
    query,
    display: "10",
    start: "1",
    sort: "sim",
  })}`;

  const apiRequest = https.request(
    {
      hostname: "openapi.naver.com",
      path: naverPath,
      method: "GET",
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    },
    (apiResponse) => {
      let body = "";
      apiResponse.setEncoding("utf8");
      apiResponse.on("data", (chunk) => {
        body += chunk;
      });
      apiResponse.on("end", () => {
        response.writeHead(apiResponse.statusCode || 502, {
          "Content-Type": "application/json; charset=utf-8",
        });
        response.end(body || "{}");
      });
    },
  );

  apiRequest.on("error", () => {
    sendJson(response, 502, { message: "네이버 책 API에 연결하지 못했습니다." });
  });

  apiRequest.end();
}

function serveStaticFile(requestPath, response) {
  const pathname = requestPath === "/" ? "/index.html" : decodeURIComponent(requestPath);
  const filePath = path.normalize(path.join(rootDir, pathname));

  if (!filePath.startsWith(rootDir)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    });
    fs.createReadStream(filePath).pipe(response);
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}
