import React, {Component, PropTypes} from 'react'
import { Form } from '../src'
import AceEditor from 'react-ace'
import 'brace/mode/json';

import 'brace/theme/monokai';
const def = (
`{
  "type": "object",
  "properties": {
    "test": {
      "type": "string",
      "title": "Test"
    }
  }
}`
)
class App extends Component {
  getChildContext() {

  }

  static childContextTypes = {
    MultiSelectField: PropTypes.shape({
      text: PropTypes.strins,
      searchFieldHintText: PropTypes.string,
      emptyText: PropTypes.string,
      hasMoreText: PropTypes.string,
      foundedText: PropTypes.string
    })
  }

  render() {
    const items = getBigDict()
    return (
      <Form
        schema={{
          type: 'object',
          properties: {
            text: {
              type: 'string',
              title: 'String'
            },
            date: {
              type: 'date',
              title: 'date'
            },
            // text2: {
            //   type: 'string',
            //   title: 'String'
            // },
            select: {
              type: 'select',
              title: 'test',
              multiple: true,
              items
            },
            fias: {
              type: 'fias',
              title: 'Адрес',
              fetchAddresses: fetchAddresses,
              fetchHouses: fetchHouses,
              fetchRooms: fetchRooms
            }
          },
          //required: ['fias', 'text']
        }}
        onSubmit={data => console.log('res:', data)}
      />
    )
  }
}

function fetchAddresses(query) {
  return fetch(`http://192.168.33.48:8060/lookup/search?query=${query}`)
    .then(response => response.json())
    .catch(() => { return { error: 'Ошибка получения адресов' } })
}

function fetchHouses(id) {
  return fetch(`http://192.168.33.48:8060/lookup/houses_and_address_structure?aoguid=${id}`)
    .then(response => response.json())
    .catch(() => { return { error: 'Ошибка получения номеров домов' } })
}

function fetchRooms(id) {
  return fetch(`http://192.168.33.48:8060/lookup/rooms?houseguid=${id}`)
    .then(response => response.json())
    .catch(() => { return { error: 'Ошибка получения квартир и помещений' } })
}

function getBigDict() {
  let dict = []
  for (let i=0; i < 300; i++) {
    dict.push({
      id: i,
      title: `example №${i}`,
      description: Date.now()
    })
  }
  return dict
}
export default App
