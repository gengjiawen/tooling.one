import type { NextApiRequest, NextApiResponse } from "next"

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    description: "A simplified httpbin",
    endpoints: [
      "/api/httpbin/get",
      "/api/httpbin/post",
      "/api/httpbin/put",
      "/api/httpbin/delete",
      "/api/httpbin/patch",
      "/api/httpbin/headers",
      "/api/httpbin/ip",
      "/api/httpbin/json",
      "/api/httpbin/cookies",
      "/api/httpbin/status/:code",
      "/api/httpbin/delay/:seconds",
      "/api/httpbin/redirect/:count",
      "/api/httpbin/anything",
    ],
  })
}
