function getEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
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
    const token = getEnv("GITHUB_TOKEN");
    const { assetId } = req.body || {};

    if (!assetId) {
      res.status(400).json({
        error: "assetId is required"
      });
      return;
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/assets/${assetId}`, {
      method: "DELETE",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });

    if (!response.ok && response.status !== 404) {
      const data = await response.json().catch(() => null);

      throw new Error(data?.message || `GitHub delete failed: ${response.status}`);
    }

    res.status(200).json({
      ok: true
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message || "Delete failed"
    });
  }
}
