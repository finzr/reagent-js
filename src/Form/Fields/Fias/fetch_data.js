export function fetchAddresses(url,  headers={}, query) {
  return fetch(`${url}${query}`, {
    headers,
    credentials: 'same-origin'
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
