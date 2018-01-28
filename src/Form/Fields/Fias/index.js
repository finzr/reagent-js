import React, { PropTypes, Component } from 'react'
import TextField from 'material-ui/TextField'
import {List, ListItem} from 'material-ui/List';
import Paper from 'material-ui/Paper';
import FloatingActionButton from 'material-ui/FloatingActionButton'
import SocialLocationCity from 'material-ui/svg-icons/social/location-city'
import Spiner from './Spiner';
import AddressDialog from '../AddressField/AddressDialog'

import { MODES } from './constants'

import './style.less'

class Fias extends Component {
  constructor(props) {
    super(props)
    const { value } = props;

    this.state = {
      mode: MODES.SELECTING_ADDRESS,
      isLoading: false,
      addrObj: value || {},
      addresses: [],
      houses: [],
      rooms: [],
      textValue: value ? this._prepareDefaultValue(value) : '',
      isVisible: false,
      fetchingError: null,
      openAddressDialog: false,
      addressSubstring: null,
      houseSubstring: null,
      roomSubstring: null,
      filteredHouses: [],
      filteredRooms: []
    }
  }

  _prepareDefaultValue = (value) => {
    const arr = new Array()
    let addrParts = { ...addressPartitionals }
    delete addrParts.zip

    Object.keys(addrParts).map(k => {
      if (value[k]) {
        arr.push(value[k])
      }
    })

    return arr.join(', ')
  }

  _hideAddressDropdown = () => this.setState({ isVisible: false })

  _handleAddressSelect = (addr) => {
    this.refs.fiasTextField.focus()

    this.setState({
      textValue: addr.title + ', ',
      addressSubstring: addr.title + ',',
      mode: MODES.SELECTING_HOUSE
    })

    this._loadHouses(addr.aoguid)
  }

  _loadAddresses = (query) => {
    const { fetchAddresses } = this.props;
    this.setState({ isLoading: true })

    fetchAddresses(query)
      .then(addresses => {
        if (addresses.error) {
          this.setState({
            fetchingError: addresses.error,
            isVisible: true,
            isLoading: false
          })
        } else {
          if (addresses.length === 1) {
            this._handleAddressSelect(addresses[0])
          }

          this.setState({
            addresses,
            fetchingError: null,
            isVisible: true,
            isLoading: false
          })
        }
      })
  }

  _loadHouses = (aoguid) => {
    const { fetchHouses } = this.props;
    this.setState({ isLoading: true })

    fetchHouses(aoguid)
      .then(json => {
        if (json.error) {
          this.setState({
            fetchingError: json.error,
            isVisible: true,
            isLoading: false
          })
        } else {
          this.setState({
            addrObj: json.addr_obj,
            houses: json.houses,
            filteredHouses: json.houses,
            fetchingError: null,
            isVisible: true,
            isLoading: false,
            mode: MODES.SELECTING_HOUSE
          })

          if (json.houses.length === 1) {
            this._handleHouseSelect(json.houses[0])
          }
        }
      })
  }

  _handleHouseSelect = (house) => {
    const { addressSubstring } = this.state

    this.setState({
      houseSubstring: house.title + ',',
      addrObj: { ...this.state.addrObj, ...house.original },
      textValue: `${addressSubstring} ${house.title}, `,
      isVisible: false,
      mode: MODES.SELECTING_APPARTMENT
    })

    this._loadRooms(house.original.houseguid)
    this.refs.fiasTextField.focus()
  }

  _loadRooms = (houseguid) => {
    const { fetchRooms } = this.props

    fetchRooms(houseguid)
      .then(rooms => {
        if (rooms.error) {
          this.setState({
            fetchingError: rooms.error,
            isVisible: true,
            isLoading: false
          })
        } else {
          if (rooms.length === 1) {
            this._handleRoomSelect(rooms[0])
          }

          this.setState({
            rooms,
            filteredRooms: rooms,
            fetchingError: null,
            isVisible: true,
            isLoading: false
          })
        }
      })
  }

  _handleRoomSelect = (room) => {
    const { addressSubstring, houseSubstring } = this.state

    this.setState({
      roomSubstring: room.title,
      addrObj: { ...this.state.addrObj, ...room.original },
      textValue: `${addressSubstring} ${houseSubstring} ${room.title}`,
      isVisible: false
    })

    this.refs.fiasTextField.focus()
  }

  _ejectAppartmentFromAddressString = (value) => {
    const arr = value.split(',')

    this.setState({
      addrObj: {
        ...this.state.addrObj,
        appartment: arr[arr.length - 1].trim()
      }
    })
  }

  _ejectHouseFromAddressString = (value) => {
     const arr = value.split(',')
      return arr[arr.length - 1].trim()
  }

  _handleSwitchingToPreviousMode = (e) => {
    const { addressSubstring, houseSubstring, roomSubstring, textValue } = this.state
    const value = e.target.value

    if (addressSubstring && (addressSubstring.length > value.length)) {
      this.setState({
        mode: MODES.SELECTING_ADDRESS,
        houseSubstring: null
      })
    }

    if (houseSubstring && ((addressSubstring + houseSubstring).length > value.length)) {
      this.setState({
        mode: MODES.SELECTING_HOUSE,
        isVisible: true
      })
    }

    if (roomSubstring && (textValue.length > value.length)) {
      this.setState({
        isVisible: true
      })
    }
  }

  _handleChange = (e) => {
    const { timeout } = this.props
    const { mode } = this.state
    const value = e.target.value

    clearTimeout(this.AddressRequestTimeout)

    this._handleSwitchingToPreviousMode(e)

    this.setState({ textValue: value })

    switch(mode) {
      case MODES.SELECTING_HOUSE:
        this._filterOfHouses(value)
        break
      case MODES.SELECTING_APPARTMENT:
        this._filterOfRooms(value)
        break
      default:
        this.AddressRequestTimeout = setTimeout(this._loadAddresses, timeout || 500, value)
        break
    }
  }

  _filterOfHouses = (value) => {
    const { houses } = this.state
    const ejectedValue = this._ejectHouseFromAddressString(value)
    const filteredHouses = houses.filter(house => house.title.includes(ejectedValue))

    this.setState({filteredHouses})
  }

  _filterOfRooms = (value) => {
    const { rooms } = this.state
    const ejectedValue = this._ejectHouseFromAddressString(value)
    const filteredRooms = rooms.filter(room => room.title.includes(ejectedValue))

    this.setState({filteredRooms})
  }

  _formatAddressString = (address) => {
    if (!address) return null
    const appendStringToAddress = (addrStr, string, prefix) => {
      if (string) {
        return `${addrStr}${addrStr ? ', ' : ''}${prefix || ''}${string}`
      } else {
        return addrStr
      }
    }
    return Object.keys(addressPartitionals).reduce((addrStr, key) => (
      appendStringToAddress(addrStr, address[key])
    ), '')
  }

  _openAddressDialog = () => this.setState({ openAddressDialog: true })

  _closeAddressDialog = () => this.setState({ openAddressDialog: false })

  _handlePopupKeyUp = (e) => e.keyCode==27 && this._closeAddressDialog()

  _handleSubmit = (e) => {
    e.preventDefault()
    const arr = new Array()

    const value = Object.keys(addressPartitionals).reduce((result, name) => {
      const { value } = e.target.elements.namedItem(name)

      result[name] = value ? value : null

      if (value) {
        arr.push(`${addressPartitionals[name]} ${value}`)
      }

      return result
    },{})

    this.setState({
      addrObj: { ...this.state.addrObj, ...value },
      textValue: arr.join(', '),
      addressSubstring: arr.join(', '),
      houseSubstring: null,
      openAddressDialog: false,
      isVisible: false
    })
  }

  _listItemWithAddressDialogButton = () =>
    <ListItem
      disabled={true}
      primaryText='Адрес отсутствует в базе ФИАС. Нажмите кнопку и введите адрес вручную'
      rightAvatar={this._openAddressDialogButton()}
    />

  _listItems = () => {
    const {
      addresses,
      filteredHouses,
      filteredRooms,
      fetchingError,
      mode,
      textValue
    } = this.state
    const items = new Array()

    if (fetchingError) {
      return <ListItem disabled={true} primaryText={`${fetchingError}`} />
    }

    switch(mode) {
      case MODES.SELECTING_ADDRESS:
        if (addresses.length === 0 && textValue.length > 0) {
          items.push(this._listItemWithAddressDialogButton())
        }

        addresses.map((address, index) => {
          items.push(
            <ListItem
              key={index}
              onClick={() =>this._handleAddressSelect(address)}
              primaryText={address.title}
            />
          )
        })
        break
      case MODES.SELECTING_HOUSE:
        filteredHouses.slice(0, 9).map((house, index) => {
          items.push(
            <ListItem
              key={index}
              onClick={() =>this._handleHouseSelect(house)}
              primaryText={`${house.title}`}
            />
          )
        })

        if (filteredHouses.length <= 5 && textValue.length > 0) {
          items.push(this._listItemWithAddressDialogButton())
        }
        break
      case MODES.SELECTING_APPARTMENT:
        filteredRooms.slice(0, 9).map((room, index) => {
          items.push(
            <ListItem
              key={index}
              onClick={() =>this._handleRoomSelect(room)}
              primaryText={`${room.title}`}
            />
          )
        })

        if (filteredRooms.length <= 5 && textValue.length > 0) {
          items.push(this._listItemWithAddressDialogButton())
        }
        break
      default:
        break
    }

    return items
  }

  _openAddressDialogButton = () =>
    (<FloatingActionButton
      mini={true}
      onClick={this._openAddressDialog}
      secondary={true}
      tabIndex={-1}
    >
      <SocialLocationCity/>
    </FloatingActionButton>)

  render() {
    const { title, required, name } = this.props;
    const {
      isVisible,
      isLoading,
      addrObj,
      openAddressDialog
    } = this.state;

    return (
      <div>
        <input
          key={name}
          type='hidden'
          name={name}
          value={JSON.stringify(addrObj)}
        />
        <AddressDialog
          open={openAddressDialog}
          title={title}
          value={addrObj}
          addressPartitionals={addressPartitionals}
          onClose={this._closeAddressDialog}
          onSubmit={ this._handleSubmit }
          onKeyUp={ this._handlePopupKeyUp }
        />
        <TextField
          ref='fiasTextField'
          floatingLabelText={title}
          style={ { zIndex: 3 } }
          onChange={this._handleChange}
          required={required}
          value={ this.state.textValue }
          fullWidth={true}
        />
        {
          isVisible && (
            <div className='c-fiac__main-block'>
              <div
                className='c-fiac__paper-background'
                onClick={() => this._hideAddressDropdown()}
              ></div>
              <Paper
                className='c-fiac__paper'
              >
                {
                  isLoading ? (
                    <Spiner />
                  ) : (
                    <List>{this._listItems()}</List>
                  )
                }
              </Paper>
            </div>
          )
        }
      </div>
    )
  }
}

const addressPartitionals = {
  zip: 'Индекс',
  region: 'Регион',
  sub_region: 'Район',
  city: 'Город',
  settlement: 'Населенный пункт',
  street: 'Улица',
  house: 'Дом',
  building: 'Корпус',
  structure: 'Строение',
  appartment: 'Помещение'
}

Fias.propTypes = {
  title: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  fetchAddresses: PropTypes.func.isRequired,
  fetchHouses: PropTypes.func.isRequired,
  fetchRooms: PropTypes.func.isRequired,
  value: PropTypes.object,
  required: PropTypes.bool,
  timeout: PropTypes.number
}

export default Fias;
