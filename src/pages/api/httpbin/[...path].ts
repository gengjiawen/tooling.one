import type { NextApiRequest, NextApiResponse } from "next"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"]
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim()
  if (Array.isArray(forwarded)) return forwarded[0].split(",")[0].trim()
  return req.socket.remoteAddress || "127.0.0.1"
}

function parseBody(req: NextApiRequest): string | Record<string, unknown> {
  try {
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body
  } catch {
    return req.body
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const path = (req.query.path as string[]) || []
  const method = req.method || "GET"
  const segment = path[0] || ""

  if (segment === "status" && path[1]) {
    const code = parseInt(path[1], 10)
    if (code >= 100 && code < 600) {
      return res.status(code).json({ code })
    }
    return res.status(400).json({ error: "Invalid status code" })
  }

  if (segment === "delay" && path[1]) {
    const delay = Math.min(parseFloat(path[1]), 10)
    if (!isNaN(delay)) {
      await sleep(delay * 1000)
      const body = parseBody(req)
      return res.status(200).json({
        args: req.query,
        data: req.body,
        files: {},
        form: {},
        headers: req.headers,
        json: body === req.body ? null : body,
        method,
        origin: getClientIp(req),
        url: `${req.headers.host}${req.url}`,
      })
    }
    return res.status(400).json({ error: "Invalid delay value" })
  }

  if (segment === "redirect" && path[1]) {
    const count = parseInt(path[1], 10)
    if (count > 0 && count <= 10) {
      const nextUrl =
        count === 1
          ? "/api/httpbin/get"
          : `/api/httpbin/redirect/${count - 1}`
      return res.redirect(302, nextUrl)
    }
    return res.status(400).json({ error: "Redirect count must be 1-10" })
  }

  const sendResponse = (
    overrides: Record<string, unknown> = {}
  ) => {
    const body = parseBody(req)
    return res.status(200).json({
      args: req.query,
      data: req.body,
      files: {},
      form: {},
      headers: req.headers,
      json: body === req.body ? null : body,
      method,
      origin: getClientIp(req),
      url: `${req.headers.host}${req.url}`,
      ...overrides,
    })
  }

  switch (segment) {
    case "ip":
      return res.status(200).json({
        origin: getClientIp(req),
      })

    case "headers":
      return res.status(200).json({
        headers: req.headers,
      })

    case "cookies":
      if (method === "GET") {
        return res.status(200).json({
          cookies: req.cookies,
        })
      }
      return sendResponse()

    case "json":
      return res.status(200).json({
        slideshow: {
          author: "Yours Truly",
          title: "Sample Slide Show",
        },
      })

    case "get":
    case "post":
    case "put":
    case "delete":
    case "patch":
    case "anything":
      return sendResponse()

    default:
      return res.status(200).json({
        args: req.query,
        data: req.body,
        files: {},
        form: {},
        headers: req.headers,
        json: null,
        method,
        origin: getClientIp(req),
        url: `${req.headers.host}${req.url}`,
      })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
}

export default handler
