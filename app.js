const storageKey = "booklog.posts.v2";

const fields = {
  title: document.querySelector("#title"),
  author: document.querySelector("#author"),
  publisher: document.querySelector("#publisher"),
  publishYear: document.querySelector("#publishYear"),
  coverUrl: document.querySelector("#coverUrl"),
  category: document.querySelector("#category"),
  rating: document.querySelector("#rating"),
  quote: document.querySelector("#quote"),
  bookText: document.querySelector("#bookText"),
  comment: document.querySelector("#comment"),
  body: document.querySelector("#body"),
};

const samplePosts = [
  {
    id: createId(),
    title: "작별하지 않는다",
    author: "한강",
    publisher: "문학동네",
    publishYear: "2021",
    coverUrl: "",
    category: "소설",
    rating: 5,
    quote: "역사를 견디는 마음의 온도를 오래 생각하게 한다.",
    bookText: "눈과 바람, 기억과 증언이 겹쳐지는 장면을 기록해 두고 싶었다.",
    comment: "개인의 기억이 공동체의 상처와 맞닿을 때 독자는 사건을 정보가 아니라 감각으로 받아들이게 된다.",
    body: "문장은 조용하지만 장면마다 남는 무게가 크다. 읽고 난 뒤에도 질문이 쉽게 닫히지 않는 책이다.",
    createdAt: new Date("2026-04-22T09:00:00").toISOString(),
  },
  {
    id: createId(),
    title: "물고기는 존재하지 않는다",
    author: "룰루 밀러",
    publisher: "곰출판",
    publishYear: "2021",
    coverUrl: "",
    category: "과학",
    rating: 4,
    quote: "분류하려는 마음과 세계의 혼란 사이에서 읽힌다.",
    bookText: "질서라고 믿었던 것이 사실은 관찰자의 욕망일 수 있다는 대목이 오래 남았다.",
    comment: "과학 지식이 삶의 태도에 관한 질문으로 확장되는 방식이 좋았다.",
    body: "과학 에세이처럼 출발하지만 개인의 회복과 세계를 이해하는 방식까지 넓어진다.",
    createdAt: new Date("2026-04-18T15:30:00").toISOString(),
  },
];

const form = document.querySelector("#postForm");
const formMode = document.querySelector("#formMode");
const cancelEditBtn = document.querySelector("#cancelEditBtn");
const newPostBtn = document.querySelector("#newPostBtn");
const fetchMetaBtn = document.querySelector("#fetchMetaBtn");
const scanImage = document.querySelector("#scanImage");
const ocrStatus = document.querySelector("#ocrStatus");
const coverPreview = document.querySelector("#coverPreview");
const searchInput = document.querySelector("#searchInput");
const categoryFilter = document.querySelector("#categoryFilter");
const sortSelect = document.querySelector("#sortSelect");
const postList = document.querySelector("#postList");
const stats = document.querySelector("#stats");
const template = document.querySelector("#postTemplate");

let posts = loadPosts();
let editingId = null;

render();
updateCoverPreview();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const payload = readForm();

  if (editingId) {
    posts = posts.map((post) => (post.id === editingId ? { ...post, ...payload } : post));
    editingId = null;
  } else {
    posts = [{ id: createId(), ...payload, createdAt: new Date().toISOString() }, ...posts];
  }

  savePosts();
  resetForm();
  render();
});

cancelEditBtn.addEventListener("click", resetForm);
fetchMetaBtn.addEventListener("click", fetchBookMetadata);
scanImage.addEventListener("change", scanBookText);
fields.coverUrl.addEventListener("input", updateCoverPreview);

newPostBtn.addEventListener("click", () => {
  resetForm();
  document.querySelector(".composer").scrollIntoView({ behavior: "smooth", block: "start" });
  fields.title.focus();
});

[searchInput, categoryFilter, sortSelect].forEach((control) => {
  control.addEventListener("input", render);
});

function readForm() {
  const data = new FormData(form);
  return {
    title: data.get("title").trim(),
    author: data.get("author").trim(),
    publisher: data.get("publisher").trim(),
    publishYear: data.get("publishYear").trim(),
    coverUrl: data.get("coverUrl").trim(),
    category: data.get("category"),
    rating: Number(data.get("rating")),
    quote: data.get("quote").trim(),
    bookText: data.get("bookText").trim(),
    comment: data.get("comment").trim(),
    body: data.get("body").trim(),
  };
}

function loadPosts() {
  const current = localStorage.getItem(storageKey);
  const legacy = localStorage.getItem("booklog.posts.v1");
  const stored = current || legacy;
  if (!stored) return samplePosts;

  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return samplePosts;
    return parsed.map(normalizePost);
  } catch {
    return samplePosts;
  }
}

function normalizePost(post) {
  return {
    publisher: "",
    publishYear: "",
    coverUrl: "",
    bookText: "",
    comment: "",
    ...post,
  };
}

function savePosts() {
  localStorage.setItem(storageKey, JSON.stringify(posts));
}

function render() {
  const visiblePosts = getVisiblePosts();
  postList.replaceChildren();
  stats.textContent = `총 ${posts.length}개 기록 · 현재 ${visiblePosts.length}개 표시`;

  if (visiblePosts.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "조건에 맞는 책 포스팅이 없습니다.";
    postList.append(empty);
    return;
  }

  visiblePosts.forEach((post) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector(".category").textContent = post.category;
    node.querySelector(".rating").textContent = "★".repeat(post.rating);
    node.querySelector("h3").textContent = post.title;
    node.querySelector(".book-info").textContent = getBookInfo(post);
    node.querySelector(".quote").textContent = post.quote || "남긴 한 줄 감상이 없습니다.";
    node.querySelector(".book-text").textContent = post.bookText || "기록된 책 내용이 없습니다.";
    node.querySelector(".comment").textContent = post.comment || "기록된 코멘트가 없습니다.";
    node.querySelector(".body").textContent = post.body;
    node.querySelector(".date").textContent = formatDate(post.createdAt);

    const cover = node.querySelector(".post-cover");
    if (post.coverUrl) {
      cover.style.backgroundImage = `url("${post.coverUrl}")`;
      cover.textContent = "";
    } else {
      cover.textContent = "표지 없음";
    }

    node.querySelector(".edit").addEventListener("click", () => startEdit(post.id));
    node.querySelector(".delete").addEventListener("click", () => deletePost(post.id));
    postList.append(node);
  });
}

function getVisiblePosts() {
  const keyword = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const sort = sortSelect.value;

  return posts
    .filter((post) => {
      const matchesCategory = category === "all" || post.category === category;
      const searchable = [
        post.title,
        post.author,
        post.publisher,
        post.publishYear,
        post.quote,
        post.bookText,
        post.comment,
        post.body,
      ]
        .join(" ")
        .toLowerCase();
      return matchesCategory && searchable.includes(keyword);
    })
    .sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating || new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === "title") return a.title.localeCompare(b.title, "ko");
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
}

async function fetchBookMetadata() {
  const title = fields.title.value.trim();
  const author = fields.author.value.trim();
  if (!title && !author) {
    showStatus("제목이나 저자를 먼저 입력하세요.");
    fields.title.focus();
    return;
  }

  fetchMetaBtn.disabled = true;
  fetchMetaBtn.textContent = "찾는 중...";

  try {
    const book = await fetchYes24Book(title, author);
    if (!book) {
      showStatus("검색된 도서 정보가 없습니다.");
      return;
    }

    fields.title.value = book.title || fields.title.value;
    fields.author.value = book.authors?.[0] || fields.author.value;
    fields.publisher.value = book.publisher || fields.publisher.value;
    fields.publishYear.value = book.publishYear || fields.publishYear.value;
    fields.coverUrl.value = book.coverUrl || fields.coverUrl.value;
    updateCoverPreview();
    showStatus("YES24 도서 정보를 채웠습니다.");
  } catch (error) {
    showStatus(error.message || "도서 정보 검색 중 문제가 발생했습니다.");
  } finally {
    fetchMetaBtn.disabled = false;
    fetchMetaBtn.textContent = "YES24 정보 찾기";
  }
}

async function fetchYes24Book(title, author) {
  const keyword = [title, author].filter(Boolean).join(" ");
  const yes24Url = `https://www.yes24.com/Product/Search?domain=BOOK&query=${encodeURIComponent(keyword)}`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(yes24Url)}`;
  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error("YES24 정보를 가져오지 못했습니다.");
  }

  const html = await response.text();
  const documentFromHtml = new DOMParser().parseFromString(html, "text/html");
  return parseYes24SearchResult(documentFromHtml, author);
}

function parseYes24SearchResult(documentFromHtml, author) {
  const items = Array.from(documentFromHtml.querySelectorAll("li, .goods_info"))
    .map(parseYes24Item)
    .filter(Boolean);

  if (!items.length) return null;

  const normalizedAuthor = author.replace(/\s/g, "");
  if (!normalizedAuthor) return items[0];

  return items.find((item) => item.authors.join("").replace(/\s/g, "").includes(normalizedAuthor)) || items[0];
}

function parseYes24Item(item) {
  const titleLink = item.querySelector(".goods_name a, a[href*='/Product/Goods/'], a[href*='/product/goods/']");
  const title = cleanText(titleLink?.textContent);
  if (!title) return null;

  const href = titleLink.getAttribute("href") || "";
  const goodsId = href.match(/goods\/(\d+)/i)?.[1];
  const authorText = cleanText(item.querySelector(".goods_auth")?.textContent);
  const publisher = cleanText(item.querySelector(".goods_pub")?.textContent);
  const dateText = cleanText(item.querySelector(".goods_date")?.textContent);
  const image = item.querySelector("img[src*='image.yes24.com'], img[data-original*='image.yes24.com']");
  const imageUrl = image?.getAttribute("data-original") || image?.getAttribute("src") || "";

  return {
    title,
    authors: parseAuthors(authorText),
    publisher,
    publishYear: dateText.match(/\d{4}/)?.[0] || "",
    coverUrl: getYes24CoverUrl(imageUrl, goodsId),
  };
}

async function scanBookText(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!window.Tesseract) {
    showStatus("OCR 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인하세요.");
    return;
  }

  scanImage.disabled = true;
  showStatus("사진에서 글자를 읽는 중입니다.");

  try {
    const result = await window.Tesseract.recognize(file, "kor+eng", {
      logger(message) {
        if (message.status === "recognizing text") {
          showStatus(`스캔 중 ${Math.round(message.progress * 100)}%`);
        }
      },
    });
    const scannedText = result.data.text.trim();
    fields.bookText.value = [fields.bookText.value.trim(), scannedText].filter(Boolean).join("\n\n");
    showStatus(scannedText ? "스캔한 내용을 책 내용에 추가했습니다." : "사진에서 읽을 수 있는 글자를 찾지 못했습니다.");
  } catch {
    showStatus("사진 스캔 중 문제가 발생했습니다.");
  } finally {
    scanImage.disabled = false;
    scanImage.value = "";
  }
}

function startEdit(id) {
  const post = posts.find((item) => item.id === id);
  if (!post) return;

  editingId = id;
  Object.entries(fields).forEach(([key, field]) => {
    field.value = key === "rating" ? String(post[key] || 5) : post[key] || "";
  });
  formMode.textContent = "수정 중";
  cancelEditBtn.hidden = false;
  updateCoverPreview();
  document.querySelector(".composer").scrollIntoView({ behavior: "smooth", block: "start" });
}

function deletePost(id) {
  const post = posts.find((item) => item.id === id);
  if (!post) return;

  const confirmed = window.confirm(`"${post.title}" 포스팅을 삭제할까요?`);
  if (!confirmed) return;

  posts = posts.filter((item) => item.id !== id);
  if (editingId === id) resetForm();
  savePosts();
  render();
}

function resetForm() {
  editingId = null;
  form.reset();
  fields.rating.value = "5";
  formMode.textContent = "새 글";
  cancelEditBtn.hidden = true;
  showStatus("");
  updateCoverPreview();
}

function updateCoverPreview() {
  const url = fields.coverUrl.value.trim();
  coverPreview.style.backgroundImage = url ? `url("${url}")` : "";
  coverPreview.textContent = url ? "" : "표지";
}

function showStatus(message) {
  ocrStatus.textContent = message;
}

function getBookInfo(post) {
  return [post.author, post.publisher, post.publishYear].filter(Boolean).join(" · ") || "도서 정보 없음";
}

function cleanText(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

function parseAuthors(value) {
  return value
    .replace(/\s*저\s*$/g, "")
    .split(/,|·|\//)
    .map((item) => cleanText(item.replace(/\s*저\s*$/g, "")))
    .filter(Boolean);
}

function getYes24CoverUrl(url, goodsId) {
  if (url) return url.replace(/^http:/, "https:").replace(/&amp;/g, "&");
  return goodsId ? `https://image.yes24.com/goods/${goodsId}/XL` : "";
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function createId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
