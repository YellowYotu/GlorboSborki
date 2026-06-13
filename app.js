import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyBmbyuk3_4jfXiOsGIq0s5f1XlY7-zURmw",
  authDomain: "glorbosborki.firebaseapp.com",
  projectId: "glorbosborki",
  storageBucket: "glorbosborki.firebasestorage.app",
  messagingSenderId: "109589525000",
  appId: "1:109589525000:web:dd1751457f4fd7a21b97bd",
  measurementId: "G-1S8Q46BVKH"
};

const CREATOR_KEY = "yellowyotu";
const MAX_FILE_SIZE = 1024 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".zip", ".rar", ".7z"];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let currentUser = null;
let currentLanguage = localStorage.getItem("glorbo-language") || "ru";
let unsubscribeServerBuilds = null;
let unsubscribeLocalBuilds = null;
let unsubscribeRequests = null;
let unsubscribeMessages = null;

const i18n = {
  ru: {
    loginTitle: "Вход",
    registerTitle: "Регистрация",
    nickname: "Никнейм",
    password: "Пароль",
    repeatPassword: "Повторить пароль",
    loginBtn: "Войти",
    registerBtn: "Зарегистрироваться",
    noAccount: "Нету аккаунта?",
    createAccount: "Создать аккаунт",
    hasAccount: "Уже есть аккаунт?",
    navBuilds: "Сборки",
    navChat: "Чат",
    navRequests: "Заявки",
    navSettings: "Настройки",
    navInfo: "Инфо",
    buildsTitle: "Сборки Minecraft",
    buildsSub: "Личные и серверные сборки обновляются в реальном времени",
    uploadBuild: "✦ Загрузить сборку",
    serverBuilds: "Серверные сборки",
    localBuilds: "Мои локальные сборки",
    noServerBuilds: "Пока нет сборок для всех",
    noLocalBuilds: "Пока нет личных сборок",
    uploadArchive: "Загрузить архив сборки",
    uploadLimit: "Только .zip, .rar, .7z. Максимум 1 GB",
    onlyMe: "Только для моего аккаунта",
    forEveryone: "Для всех после проверки",
    chooseFile: "Выбрать файл",
    chatTitle: "Чат",
    chatSub: "Сообщения обновляются в реальном времени",
    send: "Отправить",
    requestsTitle: "Заявки на серверные сборки",
    requestsSub: "Только Creator может принять или отклонить",
    noRequests: "Пока нет заявок",
    settingsTitle: "Настройки",
    settingsSub: "Аккаунт, язык и тема",
    account: "👤 Аккаунт",
    language: "🌐 Язык",
    theme: "🎨 Тема",
    logout: "Выйти с аккаунта",
    infoTitle: "О сайте",
    infoText: "Сайт для загрузки личных и серверных сборок Minecraft."
  },
  en: {
    loginTitle: "Login",
    registerTitle: "Registration",
    nickname: "Nickname",
    password: "Password",
    repeatPassword: "Repeat password",
    loginBtn: "Login",
    registerBtn: "Register",
    noAccount: "No account?",
    createAccount: "Create account",
    hasAccount: "Already have an account?",
    navBuilds: "Builds",
    navChat: "Chat",
    navRequests: "Requests",
    navSettings: "Settings",
    navInfo: "Info",
    buildsTitle: "Minecraft Builds",
    buildsSub: "Private and server builds update in real time",
    uploadBuild: "✦ Upload build",
    serverBuilds: "Server builds",
    localBuilds: "My local builds",
    noServerBuilds: "No public builds yet",
    noLocalBuilds: "No private builds yet",
    uploadArchive: "Upload build archive",
    uploadLimit: "Only .zip, .rar, .7z. Max 1 GB",
    onlyMe: "Only for my account",
    forEveryone: "For everyone after review",
    chooseFile: "Choose file",
    chatTitle: "Chat",
    chatSub: "Messages update in real time",
    send: "Send",
    requestsTitle: "Server build requests",
    requestsSub: "Only Creator can approve or reject",
    noRequests: "No requests yet",
    settingsTitle: "Settings",
    settingsSub: "Account, language and theme",
    account: "👤 Account",
    language: "🌐 Language",
    theme: "🎨 Theme",
    logout: "Logout",
    infoTitle: "About",
    infoText: "A site for uploading private and server Minecraft builds."
  }
};

function normalizeNickname(nickname) {
  return String(nickname || "").trim().toLowerCase();
}

function displayNickname(user) {
  return user?.nickname || user?.username || user?.name || user?.id || "Guest";
}

function getRoleForNickname(nickname, storedRole) {
  if (normalizeNickname(nickname) === CREATOR_KEY) {
    return "Creator";
  }

  return storedRole || "Player";
}

function safeAvatar(nickname) {
  const value = String(nickname || "Guest").trim();

  if (value.length === 0) {
    return "?";
  }

  return value.charAt(0).toUpperCase();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setError(id, message) {
  document.getElementById(id).textContent = message || "";
}

function showToast(message) {
  let toast = document.getElementById("toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.cssText = "position:fixed;left:50%;bottom:34px;transform:translateX(-50%);background:var(--accent);color:#fff;font-weight:900;padding:10px 22px;border-radius:999px;z-index:900;box-shadow:0 10px 30px rgba(0,0,0,.25);transition:opacity .2s;";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.opacity = "1";
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = "0";
  }, 2400);
}

function applyLanguage() {
  const dictionary = i18n[currentLanguage] || i18n.ru;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;

    if (dictionary[key]) {
      element.textContent = dictionary[key];
    }
  });

  document.documentElement.lang = currentLanguage;
}

function setCurrentUser(user) {
  const nickname = displayNickname(user);
  const role = getRoleForNickname(nickname, user?.role);

  currentUser = {
    ...user,
    id: normalizeNickname(nickname),
    nickname,
    role
  };

  localStorage.setItem("glorbo-current-user", JSON.stringify({
    id: currentUser.id,
    nickname: currentUser.nickname,
    role: currentUser.role
  }));

  document.getElementById("auth-screen").classList.add("hidden");
  document.getElementById("top-username").textContent = currentUser.nickname;
  document.getElementById("top-role").textContent = currentUser.role;
  document.getElementById("top-avatar").textContent = safeAvatar(currentUser.nickname);
  document.getElementById("acc-name").textContent = currentUser.nickname;
  document.getElementById("acc-role").textContent = currentUser.role;
  document.getElementById("acc-avatar").textContent = safeAvatar(currentUser.nickname);

  document.querySelectorAll(".creator-only").forEach((element) => {
    element.classList.toggle("hidden", currentUser.role !== "Creator");
  });

  startRealtime();
}

async function ensureUserRole(userId, data) {
  const nickname = data?.nickname || data?.username || userId;
  const role = getRoleForNickname(nickname, data?.role);

  if (data?.nickname !== nickname || data?.role !== role) {
    await setDoc(doc(db, "users", userId), {
      ...data,
      nickname,
      role,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  return {
    ...data,
    id: userId,
    nickname,
    role
  };
}

async function register() {
  const nickname =
    document
      .getElementById(
        "register-nickname"
      )
      .value
      .trim();

  const password =
    document
      .getElementById(
        "register-password"
      )
      .value;

  const repeatPassword =
    document
      .getElementById(
        "register-password-repeat"
      )
      .value;

  const userId =
    normalizeNickname(
      nickname
    );

  setError(
    "register-error",
    ""
  );

  if (
    !nickname
    || !password
    || !repeatPassword
  ) {
    setError(
      "register-error",
      "Заполни все поля"
    );
    return;
  }

  if (
    password
    !==
    repeatPassword
  ) {
    setError(
      "register-error",
      "Пароли не совпадают"
    );
    return;
  }

  try {

    const userRef =
      doc(
        db,
        "users",
        userId
      );

    const snapshot =
      await getDoc(
        userRef
      );

    if (
      snapshot.exists()
    ) {

      const old =
        snapshot.data();

      if (
        old.passwordHash
        || old.password
      ) {

        setError(
          "register-error",
          "Такой аккаунт уже существует"
        );

        return;
      }

    }

    const role =
      nickname
        .toLowerCase()
        ===
      "yellowyotu"
        ? "Creator"
        : "Player";

    const hash =
      await sha256(
        password
      );

    await setDoc(
      userRef,
      {
        id:
          userId,

        name:
          nickname,

        nickname:
          nickname,

        passwordHash:
          hash,

        role,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()
      },
      {
        merge: true
      }
    );

    setCurrentUser(
      {
        id:
          userId,

        nickname,

        role
      }
    );

    showToast(
      "Аккаунт создан"
    );

  } catch (
    error
  ) {

    console.error(
      error
    );

    setError(
      "register-error",
      error.message
    );

  }
}

async function sha256(
  text
) {
  const bytes =
    new TextEncoder()
      .encode(
        text
      );

  const hash =
    await crypto
      .subtle
      .digest(
        "SHA-256",
        bytes
      );

  return Array
    .from(
      new Uint8Array(
        hash
      )
    )
    .map(
      (
        b
      ) =>
        b
          .toString(
            16
          )
          .padStart(
            2,
            "0"
          )
    )
    .join(
      ""
    );
}

async function login() {
  const nickname =
    document.getElementById("login-nickname")
      .value
      .trim();

  const password =
    document.getElementById("login-password")
      .value;

  const userId =
    normalizeNickname(nickname);

  setError(
    "login-error",
    ""
  );

  try {
    const snapshot =
      await getDoc(
        doc(
          db,
          "users",
          userId
        )
      );

    if (
      !snapshot.exists()
    ) {
      setError(
        "login-error",
        "Аккаунт не найден"
      );
      return;
    }

    const data =
      snapshot.data();

    const storedName =
      data.nickname
      || data.name
      || userId;

    let ok =
      false;

    if (
      data.password
    ) {
      ok =
        data.password === password;
    }

    if (
      data.passwordHash
    ) {
      const hash =
        await sha256(
          password
        );

      ok =
        hash ===
        data.passwordHash;
    }

    if (
      !ok
    ) {
      setError(
        "login-error",
        "Неверный пароль"
      );
      return;
    }

    const role =
      storedName
        .toLowerCase()
        ===
      "yellowyotu"
        ? "Creator"
        : (
            data.role
            || "Player"
          );

    await setDoc(
      doc(
        db,
        "users",
        userId
      ),
      {
        nickname:
          storedName,
        role
      },
      {
        merge: true
      }
    );

    setCurrentUser({
      id:
        data.id
        || userId,
      nickname:
        storedName,
      role
    });

  } catch (
    e
  ) {
    console.error(
      e
    );

    setError(
      "login-error",
      e.message
    );
  }
}

async function restoreSession() {
  try {

    const raw =
      localStorage
        .getItem(
          "glorbo-current-user"
        );

    if (
      !raw
    ) {
      return;
    }

    const saved =
      JSON
        .parse(
          raw
        );

    const userId =
      normalizeNickname(
        saved.nickname
        || saved.name
        || saved.id
      );

    const snapshot =
      await getDoc(
        doc(
          db,
          "users",
          userId
        )
      );

    if (
      !snapshot.exists()
    ) {
      return;
    }

    const data =
      snapshot.data();

    const nickname =
      data.nickname
      || data.name
      || userId;

    const role =
      nickname
        .toLowerCase()
        ===
      "yellowyotu"
        ? "Creator"
        : (
            data.role
            || "Player"
          );

    setCurrentUser({
      id:
        data.id
        || userId,
      nickname,
      role
    });

  } catch (
    e
  ) {

    console.error(
      "restore",
      e
    );

  }
}

function logout() {
  stopRealtime();
  currentUser = null;
  localStorage.removeItem("glorbo-current-user");
  document.getElementById("auth-screen").classList.remove("hidden");
  showPage("builds");
}

function stopRealtime() {
  [unsubscribeServerBuilds, unsubscribeLocalBuilds, unsubscribeRequests, unsubscribeMessages].forEach((unsubscribe) => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  unsubscribeServerBuilds = null;
  unsubscribeLocalBuilds = null;
  unsubscribeRequests = null;
  unsubscribeMessages = null;
}

function startRealtime() {
  stopRealtime();

  unsubscribeServerBuilds = onSnapshot(
    query(collection(db, "serverBuilds"), orderBy("createdAt", "desc")),
    (snapshot) => renderBuilds(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })), "server"),
    (error) => console.error("Server builds realtime failed:", error)
  );

  unsubscribeLocalBuilds = onSnapshot(
    query(collection(db, "localBuilds"), where("ownerId", "==", currentUser.id), orderBy("createdAt", "desc")),
    (snapshot) => renderBuilds(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })), "local"),
    (error) => console.error("Local builds realtime failed:", error)
  );

  unsubscribeMessages = onSnapshot(
    query(collection(db, "messages"), orderBy("createdAt", "asc")),
    (snapshot) => renderMessages(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    (error) => console.error("Messages realtime failed:", error)
  );

  if (currentUser.role === "Creator") {
    unsubscribeRequests = onSnapshot(
      query(collection(db, "buildRequests"), where("status", "==", "pending"), orderBy("createdAt", "desc")),
      (snapshot) => renderRequests(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
      (error) => console.error("Requests realtime failed:", error)
    );
  }
}

function renderBuilds(builds, type) {
  const grid = document.getElementById(type === "server" ? "server-builds-grid" : "local-builds-grid");
  const empty = document.getElementById(type === "server" ? "server-empty" : "local-empty");

  grid.innerHTML = "";
  empty.classList.toggle("hidden", builds.length > 0);

  builds.forEach((build) => {
    const canDelete = currentUser?.role === "Creator" || build.ownerId === currentUser?.id;
    const card = document.createElement("div");
    card.className = "build-card";

    card.innerHTML = `
      <div class="card-top">
        <span class="badge">${type === "server" ? "Server" : "Local"}</span>
        <span class="badge">${escapeHtml(build.extension || "")}</span>
      </div>
      <div class="card-title">${escapeHtml(build.name)}</div>
      <div class="card-sub">User: ${escapeHtml(build.ownerNickname || build.ownerId || "unknown")}</div>
      <div class="card-sub">Size: ${escapeHtml(formatSize(build.size || 0))}</div>
      <div class="card-actions">
        <a href="${escapeHtml(build.downloadUrl || "#")}" target="_blank" rel="noopener">Download</a>
        ${canDelete ? `<button class="delete" data-delete-build="${escapeHtml(build.id)}" data-delete-type="${type}" data-github-asset-id="${escapeHtml(build.githubAssetId || "")}">Delete</button>` : ""}
      </div>
    `;

    grid.appendChild(card);
  });
}

function renderRequests(requests) {
  const grid = document.getElementById("requests-grid");
  const empty = document.getElementById("requests-empty");

  grid.innerHTML = "";
  empty.classList.toggle("hidden", requests.length > 0);

  requests.forEach((request) => {
    const card = document.createElement("div");
    card.className = "build-card";

    card.innerHTML = `
      <div class="card-top">
        <span class="badge creator">Request</span>
        <span class="badge">${escapeHtml(request.extension || "")}</span>
      </div>
      <div class="card-title">${escapeHtml(request.name)}</div>
      <div class="card-sub">User: ${escapeHtml(request.ownerNickname || request.ownerId || "unknown")}</div>
      <div class="card-sub">Size: ${escapeHtml(formatSize(request.size || 0))}</div>
      <div class="card-actions">
        <a href="${escapeHtml(request.downloadUrl || "#")}" target="_blank" rel="noopener">Download</a>
        <button data-approve-request="${escapeHtml(request.id)}">Approve</button>
        <button class="reject" data-reject-request="${escapeHtml(request.id)}" data-github-asset-id="${escapeHtml(request.githubAssetId || "")}">Reject</button>
      </div>
    `;

    grid.appendChild(card);
  });
}

function renderMessages(messages) {
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML = "";

  messages.slice(-150).forEach((message) => {
    const item = document.createElement("div");
    item.className = "chat-message";
    const date = message.createdAt?.toDate ? message.createdAt.toDate().toLocaleString() : "";

    item.innerHTML = `
      <div>
        <span class="chat-author">${escapeHtml(message.nickname || "Guest")}</span>
        <span class="chat-date">${escapeHtml(date)}</span>
      </div>
      <div class="chat-text">${escapeHtml(message.text || "")}</div>
    `;

    chatBox.appendChild(item);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

function formatSize(bytes) {
  const value = Number(bytes || 0);

  if (value < 1024) {
    return value + " B";
  }

  if (value < 1024 * 1024) {
    return (value / 1024).toFixed(1) + " KB";
  }

  if (value < 1024 * 1024 * 1024) {
    return (value / 1024 / 1024).toFixed(1) + " MB";
  }

  return (value / 1024 / 1024 / 1024).toFixed(2) + " GB";
}

function fileExtension(fileName) {
  const lower = String(fileName || "").toLowerCase();
  return ALLOWED_EXTENSIONS.find((extension) => lower.endsWith(extension)) || "";
}

function validateFile(file) {
  if (!file) {
    return "Файл не выбран";
  }

  const extension = fileExtension(file.name);

  if (!extension) {
    return "Можно загружать только .zip, .rar или .7z";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "Файл больше 1 GB";
  }

  return "";
}

async function uploadBuild(file) {
  const status = document.getElementById("upload-status");
  const error = validateFile(file);

  if (error) {
    status.style.color = "var(--red)";
    status.textContent = "❌ " + error;
    return;
  }

  if (!currentUser) {
    status.style.color = "var(--red)";
    status.textContent = "❌ Сначала войди в аккаунт";
    return;
  }

  const scope = document.querySelector("input[name='uploadScope']:checked")?.value || "private";
  const extension = fileExtension(file.name);
  const safeName = file.name.replace(/[^\w.\-а-яА-ЯёЁ]/g, "_");
  const uniqueName = `${Date.now()}_${currentUser.id}_${safeName}`;

  status.style.color = "var(--text-secondary)";
  status.textContent = "Загрузка в GitHub Releases...";

  try {
    const params = new URLSearchParams({
      fileName: uniqueName,
      originalName: file.name,
      contentType: file.type || "application/octet-stream"
    });

    const response = await fetch(`/api/upload-build?${params.toString()}`, {
      method: "POST",
      headers: {
        "Content-Type": file.type || "application/octet-stream"
      },
      body: file
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.downloadUrl) {
      throw new Error(result?.error || "GitHub Release upload failed");
    }

    const payload = {
      name: file.name,
      searchName: file.name.toLowerCase(),
      extension,
      size: file.size,
      ownerId: currentUser.id,
      ownerNickname: currentUser.nickname,
      storageProvider: "github-releases",
      githubReleaseId: result.releaseId || null,
      githubAssetId: result.assetId || null,
      githubAssetName: result.assetName || uniqueName,
      downloadUrl: result.downloadUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (scope === "private") {
      await addDoc(collection(db, "localBuilds"), payload);
      status.style.color = "var(--green)";
      status.textContent = "✅ Личная сборка загружена в GitHub Releases";
    } else {
      await addDoc(collection(db, "buildRequests"), {
        ...payload,
        status: "pending"
      });
      status.style.color = "var(--green)";
      status.textContent = "✅ Файл загружен, заявка отправлена Creator";
    }
  } catch (error) {
    console.error("Upload failed:", error);
    status.style.color = "var(--red)";
    status.textContent = "❌ Ошибка загрузки: " + error.message;
  }
}

async function approveRequest(requestId) {
  if (currentUser?.role !== "Creator") {
    return;
  }

  try {
    const requestRef = doc(db, "buildRequests", requestId);
    const snapshot = await getDoc(requestRef);

    if (!snapshot.exists()) {
      showToast("Заявка не найдена");
      return;
    }

    const data = snapshot.data();

    await addDoc(collection(db, "serverBuilds"), {
      name: data.name,
      searchName: data.searchName || String(data.name || "").toLowerCase(),
      extension: data.extension,
      size: data.size,
      ownerId: data.ownerId,
      ownerNickname: data.ownerNickname,
      storageProvider: data.storageProvider || "github-releases",
      githubReleaseId: data.githubReleaseId || null,
      githubAssetId: data.githubAssetId || null,
      githubAssetName: data.githubAssetName || null,
      downloadUrl: data.downloadUrl,
      approvedBy: currentUser.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await updateDoc(requestRef, {
      status: "approved",
      approvedBy: currentUser.id,
      updatedAt: serverTimestamp()
    });

    showToast("Заявка принята");
  } catch (error) {
    console.error("Approve failed:", error);
    showToast("Ошибка approve: " + error.message);
  }
}

async function rejectRequest(requestId, githubAssetId) {
  if (currentUser?.role !== "Creator") {
    return;
  }

  try {
    await updateDoc(doc(db, "buildRequests", requestId), {
      status: "rejected",
      rejectedBy: currentUser.id,
      updatedAt: serverTimestamp()
    });

    if (githubAssetId) {
      await deleteGithubAsset(githubAssetId).catch(() => {});
    }

    showToast("Заявка отклонена");
  } catch (error) {
    console.error("Reject failed:", error);
    showToast("Ошибка reject: " + error.message);
  }
}

async function deleteBuild(buildId, type, githubAssetId) {
  try {
    const collectionName = type === "server" ? "serverBuilds" : "localBuilds";
    await deleteDoc(doc(db, collectionName, buildId));

    if (githubAssetId) {
      await deleteGithubAsset(githubAssetId).catch(() => {});
    }

    showToast("Сборка удалена");
  } catch (error) {
    console.error("Delete failed:", error);
    showToast("Ошибка удаления: " + error.message);
  }
}

async function deleteGithubAsset(githubAssetId) {
  const response = await fetch("/api/delete-github-asset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      assetId: githubAssetId
    })
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.error || "GitHub asset delete failed");
  }

  return result;
}

async function sendMessage() {
  const input = document.getElementById("chat-input");
  const text = input.value.trim();

  if (!text || !currentUser) {
    return;
  }

  try {
    await addDoc(collection(db, "messages"), {
      text,
      userId: currentUser.id,
      nickname: currentUser.nickname,
      role: currentUser.role,
      createdAt: serverTimestamp()
    });

    input.value = "";
  } catch (error) {
    console.error("Message failed:", error);
    showToast("Ошибка сообщения: " + error.message);
  }
}

function showPage(name) {
  document.querySelectorAll(".page").forEach((page) => page.classList.add("hidden"));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));

  const page = document.getElementById("page-" + name);
  const nav = document.querySelector(`.nav-item[data-page="${name}"]`);

  if (page) {
    page.classList.remove("hidden");
  }

  if (nav) {
    nav.classList.add("active");
  }
}

function showSettingsTab(name) {
  document.querySelectorAll(".settings-tab").forEach((tab) => tab.classList.add("hidden"));
  document.querySelectorAll(".setnav-item").forEach((item) => item.classList.remove("active"));

  const tab = document.getElementById("stab-" + name);
  const nav = document.querySelector(`.setnav-item[data-tab="${name}"]`);

  if (tab) {
    tab.classList.remove("hidden");
  }

  if (nav) {
    nav.classList.add("active");
  }
}

function bindEvents() {
  document.getElementById("show-register-btn").addEventListener("click", () => {
    document.getElementById("login-box").classList.add("hidden");
    document.getElementById("register-box").classList.remove("hidden");
  });

  document.getElementById("show-login-btn").addEventListener("click", () => {
    document.getElementById("register-box").classList.add("hidden");
    document.getElementById("login-box").classList.remove("hidden");
  });

  document.getElementById("register-btn").addEventListener("click", register);
  document.getElementById("login-btn").addEventListener("click", login);
  document.getElementById("logout-btn").addEventListener("click", logout);

  document.getElementById("login-password").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      login();
    }
  });

  document.getElementById("register-password-repeat").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      register();
    }
  });

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => showPage(item.dataset.page));
  });

  document.querySelectorAll(".setnav-item").forEach((item) => {
    item.addEventListener("click", () => showSettingsTab(item.dataset.tab));
  });

  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => {
      currentLanguage = button.dataset.lang;
      localStorage.setItem("glorbo-language", currentLanguage);
      applyLanguage();
    });
  });

  bindThemeButtons();
  bindCustomThemeControls();

  document.getElementById("scroll-upload-btn").addEventListener("click", () => {
    document.getElementById("upload-zone").scrollIntoView({ behavior: "smooth" });
  });

  document.getElementById("choose-file-btn").addEventListener("click", () => {
    document.getElementById("file-input").click();
  });

  document.getElementById("file-input").addEventListener("change", (event) => {
    uploadBuild(event.target.files[0]);
    event.target.value = "";
  });

  const uploadZone = document.getElementById("upload-zone");

  uploadZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    uploadZone.classList.add("drag-over");
  });

  uploadZone.addEventListener("dragleave", () => {
    uploadZone.classList.remove("drag-over");
  });

  uploadZone.addEventListener("drop", (event) => {
    event.preventDefault();
    uploadZone.classList.remove("drag-over");
    uploadBuild(event.dataTransfer.files[0]);
  });

  document.getElementById("send-message-btn").addEventListener("click", sendMessage);

  document.getElementById("chat-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  });

  document.body.addEventListener("click", (event) => {
    const approveId = event.target.dataset.approveRequest;
    const rejectId = event.target.dataset.rejectRequest;
    const deleteId = event.target.dataset.deleteBuild;

    if (approveId) {
      approveRequest(approveId);
      return;
    }

    if (rejectId) {
      rejectRequest(rejectId, event.target.dataset.githubAssetId || "");
      return;
    }

    if (deleteId) {
      deleteBuild(deleteId, event.target.dataset.deleteType, event.target.dataset.githubAssetId || "");
    }
  });
}

const THEME_NAMES = [
  "dark",
  "orange",
  "violet",
  "ocean",
  "forest",
  "sunset",
  "ice",
  "light",
  "custom"
];

const DEFAULT_CUSTOM_VALUES = {
  "--bg-main": "#101217",
  "--bg-sidebar": "#0b0d12",
  "--bg-card": "#171a22",
  "--bg-soft": "#12151d",
  "--border": "#272b38",
  "--border-hover": "#41475a",
  "--text-primary": "#edf0f7",
  "--text-secondary": "#9aa2bc",
  "--text-muted": "#606982",
  "--accent": "#5b8fff",
  "--border-size": "1px",
  "--radius-card": "14px",
  "--radius-button": "999px",
  "--radius-input": "10px"
};

function clearThemeClasses() {
  THEME_NAMES.forEach((theme) => {
    document.body.classList.remove("theme-" + theme);
  });

  document.body.classList.remove("light");
}

function setActiveThemeButton(theme) {
  document.querySelectorAll("[data-theme]").forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === theme);
  });
}

function applyTheme(theme) {
  clearThemeClasses();

  const selectedTheme = theme || "dark";

  if (selectedTheme === "custom") {
    const custom = JSON.parse(localStorage.getItem("glorbo-custom-theme") || "{}");
    applyCustomValues({
      ...DEFAULT_CUSTOM_VALUES,
      ...custom
    }, false);
    document.body.classList.add("theme-custom");
  } else {
    document.body.classList.add("theme-" + selectedTheme);
  }

  localStorage.setItem("glorbo-theme", selectedTheme);
  setActiveThemeButton(selectedTheme);
  syncCustomControlsFromComputed();
}

function bindThemeButtons() {
  document.querySelectorAll("[data-theme]").forEach((button) => {
    button.addEventListener("click", () => {
      applyTheme(button.dataset.theme);
      showToast("Theme: " + button.dataset.theme);
    });
  });
}

function normalizeCssValue(varName, value) {
  if (
    varName === "--border-size"
    || varName === "--radius-card"
    || varName === "--radius-button"
    || varName === "--radius-input"
  ) {
    return String(parseInt(value, 10) || 0) + "px";
  }

  return value;
}

function applyCustomValues(values, save) {
  Object.entries(values).forEach(([varName, value]) => {
    document.documentElement.style.setProperty(varName, value);
  });

  const borderEnabled = values.__borderEnabled !== false;

  if (!borderEnabled) {
    document.documentElement.style.setProperty("--border-size", "0px");
  }

  if (save) {
    localStorage.setItem("glorbo-custom-theme", JSON.stringify(values));
  }
}

function getComputedCssVar(varName) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

function syncCustomControlsFromComputed() {
  document.querySelectorAll("[data-custom-var]").forEach((input) => {
    const varName = input.dataset.customVar;
    const value = getComputedCssVar(varName) || DEFAULT_CUSTOM_VALUES[varName];

    if (input.type === "color") {
      input.value = value;
      return;
    }

    if (input.type === "range") {
      input.value = parseInt(value, 10) || 0;
      const label = document.querySelector(`[data-custom-value="${varName}"]`);

      if (label) {
        label.textContent = value;
      }
    }
  });

  const borderCheckbox = document.getElementById("custom-border-enabled");

  if (borderCheckbox) {
    borderCheckbox.checked = (parseInt(getComputedCssVar("--border-size"), 10) || 0) > 0;
  }
}

function readCustomControlValues() {
  const values = {};

  document.querySelectorAll("[data-custom-var]").forEach((input) => {
    const varName = input.dataset.customVar;
    values[varName] = normalizeCssValue(varName, input.value);
  });

  const borderCheckbox = document.getElementById("custom-border-enabled");
  values.__borderEnabled = borderCheckbox ? borderCheckbox.checked : true;

  if (!values.__borderEnabled) {
    values.__storedBorderSize = values["--border-size"];
    values["--border-size"] = "0px";
  }

  return values;
}

function bindCustomThemeControls() {
  document.querySelectorAll("[data-custom-var]").forEach((input) => {
    input.addEventListener("input", () => {
      const varName = input.dataset.customVar;
      const value = normalizeCssValue(varName, input.value);

      document.documentElement.style.setProperty(varName, value);

      const label = document.querySelector(`[data-custom-value="${varName}"]`);

      if (label) {
        label.textContent = value;
      }

      clearThemeClasses();
      document.body.classList.add("theme-custom");
      localStorage.setItem("glorbo-theme", "custom");
      setActiveThemeButton("custom");
    });
  });

  const borderCheckbox = document.getElementById("custom-border-enabled");

  if (borderCheckbox) {
    borderCheckbox.addEventListener("change", () => {
      const currentSize = getComputedCssVar("--border-size") || "1px";
      document.documentElement.style.setProperty("--border-size", borderCheckbox.checked ? currentSize : "0px");
      localStorage.setItem("glorbo-theme", "custom");
      setActiveThemeButton("custom");
    });
  }

  const saveButton = document.getElementById("save-custom-theme-btn");

  if (saveButton) {
    saveButton.addEventListener("click", () => {
      const values = readCustomControlValues();
      applyCustomValues(values, true);
      localStorage.setItem("glorbo-theme", "custom");
      setActiveThemeButton("custom");
      showToast("Кастомная тема сохранена");
    });
  }

  const resetButton = document.getElementById("reset-custom-theme-btn");

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      localStorage.removeItem("glorbo-custom-theme");
      applyTheme("dark");
      showToast("Кастом сброшен");
    });
  }

  syncCustomControlsFromComputed();
}

function initTheme() {
  const savedTheme = localStorage.getItem("glorbo-theme") || "dark";
  applyTheme(savedTheme);
}

bindEvents();
applyLanguage();
initTheme();
restoreSession();
