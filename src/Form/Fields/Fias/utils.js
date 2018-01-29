export function prepareDefaultValue (value, addrParts) {
  delete addrParts.zip

  return Object.keys(addrParts).reduce((arr, key) => {
    return arr.concat(value[key])
  }, []).filter(element => element !== null).join(', ')
}

export function filteredList(list, value) {
  return list.filter(el => el.title.includes(ejectLastElementOfString(value)))
}

export function ejectLastElementOfString (value) {
  return value.split(',').slice(-1)[0].trim()
}
