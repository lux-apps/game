import * as actions from '../actions';

const initialState = {
  connected: false,
  networkId: undefined
}

const networkReducer = function(state = initialState, action) {
  switch(action.type) {
    case actions.CONNECT_WALLET:
      return { ...state, connected: true }

    case actions.SET_NETWORK_ID:
      return { ...state, networkId: action.id }

    default:
      return state;
  }
}

export default networkReducer
