import React, { PropTypes, Component } from 'react'
import TextField from 'material-ui/TextField'
import {List, ListItem} from 'material-ui/List';
import Paper from 'material-ui/Paper';
import FloatingActionButton from 'material-ui/FloatingActionButton'
import SocialLocationCity from 'material-ui/svg-icons/social/location-city'
import Spiner from './Spiner';
import AddressDialog from '../AddressField/AddressDialog'

import { MODES, ADDRESS_PARTITIONALS } from './constants'
import {
  prepareDefaultValue,
  filteredList
} from './utils'

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
      textValue: value ? prepareDefaultValue(value, { ...ADDRESS_PARTITIONALS }) : '',
      isVisible: false,
      fetchingError: null,
      openAddressDialog: false,
      addressSubstring: null,
      houseSubstring: null,
      filteredHouses: [],
      filteredRooms: []
    }
  }

  _hideDropdown = () => this.setState({ isVisible: false })

  _filterOfHouses = (value) => this.setState({filteredHouses: filteredList(this.state.houses, value)})

  _filterOfRooms = (value) => this.setState({filteredRooms: filteredList(this.state.rooms, value)})

  _openAddressDialog = () => this.setState({ openAddressDialog: true })

  _closeAddressDialog = () => this.setState({ openAddressDialog: false })

  _handlePopupKeyUp = (e) => e.keyCode==27 && this._closeAddressDialog()

  _handleErrorReceived = (message) => this.setState({fetchingError: message, isVisible: true, isLoading: false})

  _loadAddresses = (query) => {
    const { fetchAddresses } = this.props;
    this.setState({ isLoading: true })

    fetchAddresses(query)
      .then(addresses => {
        if (addresses.error) {
          this._handleErrorReceived(addresses.error)
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

  _handleAddressSelect = (addr) => {
    this.refs.fiasTextField.focus()

    this.setState({
      textValue: `${addr.title}, `,
      addressSubstring: `${addr.title},`,
      mode: MODES.SELECTING_HOUSE
    })

    this._loadHouses(addr.aoguid)
  }

  _loadHouses = (aoguid) => {
    const { fetchHouses } = this.props;
    this.setState({ isLoading: true })

    fetchHouses(aoguid)
      .then(json => {
        if (json.error) {
          this._handleErrorReceived(json.error)
        } else {
          if (json.houses.length === 1) {
            this._handleHouseSelect(json.houses[0])
          }

          this.setState({
            addrObj: json.addr_obj,
            houses: json.houses,
            filteredHouses: json.houses,
            fetchingError: null,
            isVisible: true,
            isLoading: false,
            mode: MODES.SELECTING_HOUSE
          })
        }
      })
  }

  _handleHouseSelect = (house) => {
    const { addressSubstring } = this.state
    this.refs.fiasTextField.focus()

    this.setState({
      houseSubstring: `${house.title},`,
      addrObj: { ...this.state.addrObj, ...house.original },
      textValue: `${addressSubstring} ${house.title}, `,
      isVisible: false,
      mode: MODES.SELECTING_APPARTMENT
    })

    this._loadRooms(house.original.houseguid)
  }

  _loadRooms = (houseguid) => {
    const { fetchRooms } = this.props

    fetchRooms(houseguid)
      .then(rooms => {
        if (rooms.error) {
          this._handleErrorReceived(rooms.error)
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
    this.refs.fiasTextField.focus()

    this.setState({
      addrObj: { ...this.state.addrObj, ...room.original },
      textValue: `${addressSubstring} ${houseSubstring} ${room.title}`,
      isVisible: false
    })
  }

  _handleSwitchingToPreviousMode = (e) => {
    const {
      addressSubstring,
      houseSubstring,
      textValue
    } = this.state

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

    if (textValue.length > value.length) {
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
        this.AddressRequestTimeout = setTimeout(
          this._loadAddresses,
          timeout || 500,
          value
        )
        break
    }
  }

  _handleSubmit = (e) => {
    e.preventDefault()

    const value = Object.keys(ADDRESS_PARTITIONALS).reduce((result, name) => {
      const { value } = e.target.elements.namedItem(name)
      result[name] = value ? value : null
      return result
    },{})

    const valueStr = prepareDefaultValue(value, { ...ADDRESS_PARTITIONALS })

    this.setState({
      addrObj: { ...this.state.addrObj, ...value },
      textValue: valueStr,
      addressSubstring: valueStr,
      houseSubstring: null,
      openAddressDialog: false,
      isVisible: false
    })
  }

  _listItems = (list, handler, showAddressButton = false) => {
    const { textValue } = this.state
    const mappedArr = list.map((el, index) => (
      <ListItem
        key={index}
        onClick={() => handler(el)}
        primaryText={el.title}
      />
    ))

    if (list.length <= 5 && textValue.length > 0 && showAddressButton) {
      mappedArr.push(this._listItemWithAddressDialogButton())
    }

    return mappedArr
  }

  _listItemsSwitcher = () => {
    const {
      addresses,
      filteredHouses,
      filteredRooms,
      fetchingError,
      mode
    } = this.state

    if (fetchingError) {
      return <ListItem disabled={true} primaryText={`${fetchingError}`} />
    }

    if (mode === MODES.SELECTING_ADDRESS) {
      return this._listItems(addresses, this._handleAddressSelect)
    }

    if (mode === MODES.SELECTING_HOUSE) {
      return this._listItems(filteredHouses.slice(0, 9), this._handleHouseSelect, true)
    }

    if (mode === MODES.SELECTING_APPARTMENT) {
      return this._listItems(filteredRooms.slice(0, 9), this._handleRoomSelect, true)
    }
  }

  _openAddressDialogButton = () => (
    <FloatingActionButton
      mini={true}
      onClick={this._openAddressDialog}
      secondary={true}
      tabIndex={-1}
    >
      <SocialLocationCity/>
    </FloatingActionButton>
  )

  _listItemWithAddressDialogButton = () => (
    <ListItem
      disabled={true}
      primaryText='Адрес отсутствует в базе ФИАС. Нажмите кнопку и введите адрес вручную'
      rightAvatar={this._openAddressDialogButton()}
    />
  )

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
          disablingNotEmptyFields={true}
          addressPartitionals={ADDRESS_PARTITIONALS}
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
                onClick={() => this._hideDropdown()}
              ></div>
              <Paper
                className='c-fiac__paper'
              >
                {
                  isLoading ? (
                    <Spiner />
                  ) : (
                    <List>{this._listItemsSwitcher()}</List>
                  )
                }
              </Paper>
            </div>
          )
        }
      </div>
    )
  }
}``

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
