export const config = {
  api: {
    bodyParser: false
  }
};

const RELEASE_TAG = "glorbo-builds";
const RELEASE_NAME = "Glorbo Builds Storage";

function getEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => {
      chunks.push(chunk);
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    req.on("error", reject);
  });
}

async function githubRequest(url, options = {}) {
  const token = getEnv("GITHUB_TOKEN");

  const response = await fetch(url, {
    ...options,
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || `GitHub request failed: ${response.status}`);
  }

  return data;
}

async function getOrCreateRelease(owner, repo) {
  const releaseUrl = `https://api.github.com/repos/${owner}/${repo}/releases/tags/${RELEASE_TAG}`;

  try {
    return await githubRequest(releaseUrl);
  } catch (error) {
    if (!String(error.message).includes("Not Found")) {
      throw error;
    }
  }

  return githubRequest(`https://api.github.com/repos/${owner}/${repo}/releases`, {
    method: "POST",
    body: JSON.stringify({
      tag_name: RELEASE_TAG,
      name: RELEASE_NAME,
      body: "Storage release for Glorbo uploaded builds.",
      draft: false,
      prerelease: false
    })
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({
      error: "Method not allowed"
    });
    return;
  }

  try {
    const owner = getEnv("GITHUB_OWNER");
    const repo = getEnv("GITHUB_REPO");

    const fileNameRaw = String(req.query.fileName || "").trim();
    const originalName = String(req.query.originalName || fileNameRaw || "build.zip").trim();
    const contentType = String(req.query.contentType || req.headers["content-type"] || "application/octet-stream");

    if (!fileNameRaw) {
      res.status(400).json({
        error: "fileName is required"
      });
      return;
    }

    const fileName = fileNameRaw.replace(/[^\w.\-а-яА-ЯёЁ]/g, "_");
    const body = await readRawBody(req);

    if (!body.length) {
      res.status(400).json({
        error: "Empty file body"
      });
      return;
    }

    const release = await getOrCreateRelease(owner, repo);
    const uploadUrl = release.upload_url.split("{")[0];

    const asset = await githubRequest(`${uploadUrl}?name=${encodeURIComponent(fileName)}`, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(body.length)
      },
      body
    });

    res.status(200).json({
      ok: true,
      originalName,
      assetName: asset.name,
      assetId: asset.id,
      releaseId: release.id,
      downloadUrl: asset.browser_download_url
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message || "Upload failed"
    });
  }
}
