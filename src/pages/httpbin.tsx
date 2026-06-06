import React, { useState, useCallback, useRef, useEffect } from "react"
import { Layout } from "../components/Layout"
import { Button, CopyButton } from "../components/Button"
import { CodeBlock } from "../components/CodeBlock"

const ENDPOINTS = [
  { method: "GET", path: "/api/httpbin/get", desc: "Echo GET request" },
  { method: "POST", path: "/api/httpbin/post", desc: "Echo POST request" },
  { method: "PUT", path: "/api/httpbin/put", desc: "Echo PUT request" },
  { method: "PATCH", path: "/api/httpbin/patch", desc: "Echo PATCH request" },
  { method: "DELETE", path: "/api/httpbin/delete", desc: "Echo DELETE request" },
  { method: "GET", path: "/api/httpbin/headers", desc: "Return request headers" },
  { method: "GET", path: "/api/httpbin/ip", desc: "Return client IP" },
  { method: "GET", path: "/api/httpbin/json", desc: "Return sample JSON" },
  { method: "GET", path: "/api/httpbin/cookies", desc: "Show cookies" },
  { method: "GET", path: "/api/httpbin/status/418", desc: "Return status code" },
  { method: "GET", path: "/api/httpbin/delay/2", desc: "Delayed response (2s)" },
  { method: "GET", path: "/api/httpbin/redirect/3", desc: "Redirect chain" },
  { method: "ANY", path: "/api/httpbin/anything", desc: "Echo anything" },
]

function getMethodColor(method: string) {
  switch (method) {
    case "GET": return "bg-green-100 text-green-700"
    case "POST": return "bg-blue-100 text-blue-700"
    case "PUT": return "bg-orange-100 text-orange-700"
    case "PATCH": return "bg-yellow-100 text-yellow-700"
    case "DELETE": return "bg-red-100 text-red-700"
    default: return "bg-gray-100 text-gray-700"
  }
}

interface ResponseResult {
  status: number
  data: string
  headers: Record<string, string>
}

async function doRequest(
  path: string, method: string, body: string
): Promise<ResponseResult> {
  const init: RequestInit = { method }
  if (method !== "GET" && method !== "HEAD" && body) {
    init.headers = { "Content-Type": "application/json" }
    init.body = body
  }
  const res = await fetch(path, init)
  const text = await res.text()
  let formatted: string
  try { formatted = JSON.stringify(JSON.parse(text), null, 2) }
  catch { formatted = text }
  const headers: Record<string, string> = {}
  res.headers.forEach((v, k) => { headers[k] = v })
  return { status: res.status, data: formatted, headers }
}

export default function HttpbinPage() {
  const [basePath, setBasePath] = useState("/api/httpbin/get")
  const [customPath, setCustomPath] = useState("")
  const [method, setMethod] = useState("GET")
  const DEFAULT_BODY = JSON.stringify({ hello: "world", foo: "bar" }, null, 2)
  const [body, setBody] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResponseResult | null>(null)
  const loadingPath = useRef("")

  useEffect(() => {
    if (basePath === "/api/httpbin/post") {
      setBody(DEFAULT_BODY)
    }
  }, [basePath])

  const sendRequest = useCallback(async (path?: string, m?: string) => {
    const p = path || customPath || basePath
    const pm = m || method
    const b = p === "/api/httpbin/post" && !body ? DEFAULT_BODY : body
    if (p === "/api/httpbin/post") setBody(DEFAULT_BODY)
    setMethod(pm)
    setBasePath(p)
    setLoading(true)
    loadingPath.current = p
    try {
      const r = await doRequest(p, pm, b)
      if (loadingPath.current === p) setResult(r)
    } catch (err: any) {
      if (loadingPath.current === p) setResult({ status: 0, data: err.message || "Request failed", headers: {} })
    } finally {
      if (loadingPath.current === p) setLoading(false)
    }
  }, [customPath, basePath, method, body])

  return (
    <Layout>
      <div className="p-5 flex flex-col xl:flex-row gap-5">
        {/* Left: endpoints + request builder */}
        <div className="shrink-0 xl:w-[430px]">
          <div className="xl:max-h-[calc(100vh-40px)] xl:overflow-auto space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">HTTP Request Tester</h2>
              <p className="text-gray-500 text-sm">
                A simplified httpbin. All endpoints under <code className="bg-gray-200 px-1 rounded">/api/httpbin</code>.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-1.5 text-sm">Endpoints</h3>
              <div className="grid grid-cols-1 gap-1">
                {ENDPOINTS.map((ep) => {
                  const isActive = basePath === ep.path && !customPath
                  return (
                    <div
                      key={ep.path}
                      className={`flex items-center px-3 py-1.5 rounded border hover:border-blue-400 transition-colors cursor-pointer text-sm ${
                        isActive ? "border-blue-500 bg-blue-50" : "border-gray-200"
                      }`}
                      onClick={() => {
                        setBasePath(ep.path)
                        setCustomPath("")
                        if (ep.method !== "ANY") setMethod(ep.method)
                      }}
                    >
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded mr-1.5 ${getMethodColor(ep.method)}`}>
                        {ep.method}
                      </span>
                      <span className="font-mono text-xs flex-1">{ep.path}</span>
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer border ml-1 ${
                          loading && isActive
                            ? "bg-gray-100 text-gray-400 border-gray-300"
                            : "bg-white hover:bg-blue-500 hover:text-white border-blue-300 text-blue-600"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          sendRequest(ep.path, ep.method === "ANY" ? "GET" : ep.method)
                        }}
                      >
                        {loading && isActive ? "..." : "Run"}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="border rounded px-2 py-1 font-mono text-xs"
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>PATCH</option>
                  <option>DELETE</option>
                </select>
                <input
                  className="flex-1 border rounded px-2 py-1 font-mono text-xs"
                  value={customPath || basePath}
                  onChange={(e) => { setCustomPath(e.target.value); setBasePath("") }}
                  placeholder="/api/httpbin/..."
                />
                <Button onClick={() => sendRequest()} disabled={loading}>
                  {loading ? "..." : "Send"}
                </Button>
              </div>
              {(method !== "GET" && method !== "HEAD") && (
                <textarea
                  className="w-full border rounded px-2 py-1 font-mono text-xs"
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right: Response */}
        <div className="flex-1 xl:min-w-0">
          {result ? (
            <div className="xl:max-h-[calc(100vh-40px)] xl:overflow-auto space-y-3">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">Response</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    result.status >= 200 && result.status < 300
                      ? "bg-green-100 text-green-700"
                      : result.status >= 300 && result.status < 400
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                  }`}>
                    {result.status || "Error"}
                  </span>
                </div>
              </div>

              {/* Headers */}
              {Object.keys(result.headers).length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-gray-500">Headers</h4>
                    <CopyButton getValue={() => JSON.stringify(result.headers, null, 2)} />
                  </div>
                  <div className="border rounded bg-gray-50 text-xs font-mono">
                    {Object.entries(result.headers).map(([k, v]) => (
                      <div key={k} className="flex border-b last:border-b-0">
                        <span className="px-2 py-1 bg-gray-100 font-bold w-[180px] shrink-0">{k}</span>
                        <span className="px-2 py-1 break-all">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Body */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-gray-500">Body</h4>
                  <CopyButton getValue={() => result.data} />
                </div>
                <CodeBlock code={result.data} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-300 text-sm pt-20">
              Click Run or Send to see the response
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
