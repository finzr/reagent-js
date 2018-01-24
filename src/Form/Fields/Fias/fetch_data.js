export function fetchAddresses(url,  headerOptions={}, query) {
  const headers = Object.assign({
    'Content-Type': 'application/json'
  }, headerOptions)
  return fetch(`${url}`, {
    headers,
    credentials: 'same-origin',
    method: 'POST',
    body: JSON.stringify({ query: query })
  }).then(response => response.json())
    .catch(() => { return { error: 'Ошибка получения адресов' } })
}

export function fetchHouses(url, headers={}, id) {
  return fetch(`${url}${id}`, {
    headers,
    credentials: 'same-origin'
  }).then(response => response.json())
    .catch(() => { return { error: 'Ошибка получения номеров домов' } })
}
