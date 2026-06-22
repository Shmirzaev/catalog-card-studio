import type { NextConfig } from "next";

const githubPagesBasePath = process.env.NODE_ENV === "production" ? "/catalog-card-studio" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: githubPagesBasePath || undefined,
  assetPrefix: githubPagesBasePath ? `${githubPagesBasePath}/` : undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: githubPagesBasePath
  },
  images: {
    unoptimized: true
  }
};

export default nextConfig;
