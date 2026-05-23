// @ts-check
const path = require("path")

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  env: {
    COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA ?? "",
    PKG_VERSION: require("./package.json").version,
  },
}

module.exports = nextConfig
