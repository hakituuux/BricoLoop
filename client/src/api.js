// une seule fonction pour parler a l'api
// elle ajoute X-User-Id, lit le json, et renvoie error + field si ca rate
export async function apiFetch(url, userId, options) {
  const opts = options || {}
  const headers = {}

  headers['Content-Type'] = 'application/json'
  if (userId) {
    headers['X-User-Id'] = String(userId)
  }

  let response
  try {
    response = await fetch(url, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    })
  } catch {
    return {
      ok: false,
      status: 0,
      error: 'Impossible de joindre le serveur',
      field: null,
      data: null,
    }
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    let message = 'Une erreur est survenue'
    let field = null
    if (data && data.error) {
      message = data.error
    }
    if (data && data.field) {
      field = data.field
    }
    return {
      ok: false,
      status: response.status,
      error: message,
      field: field,
      data: data,
    }
  }

  return {
    ok: true,
    status: response.status,
    error: null,
    field: null,
    data: data,
  }
}
