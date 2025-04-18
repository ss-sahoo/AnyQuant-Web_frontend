export const Fetch = async (endPoint, config, headerKey) => {
  const baseUrl = "https://anyquant.co.uk"
  const url = `${baseUrl}${endPoint.startsWith("/") ? endPoint : `/${endPoint}`}`

  const headers = new Headers(config.headers || {})

  // Ensure Content-Type is set only if not already present
  if (!(config.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.append("Content-Type", "application/json")
  }

  if (headerKey) {
    headers.append("x-ext-link-key", headerKey)
  }

  // Optionally include the Authorization header if a token exists
  const authToken = localStorage.getItem("auth_token")
  if (authToken && !headers.has("Authorization")) {
    headers.append("Authorization", `Bearer ${authToken}`)
  }

  const modifiedConfig = { ...config, headers }

  try {
    const response = await fetch(url, modifiedConfig)

    if (response.status === 404) throw new Error("Not Found")
    if (response.status === 401) throw new Error("Unauthorized")

    return response
  } catch (error) {
    console.error("Fetch Error: ", error.message || error)
    throw error
  }
}
