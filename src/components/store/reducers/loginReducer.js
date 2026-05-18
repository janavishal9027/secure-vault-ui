import { SET_USER, REFRESH } from "../../utils/actionConstants";

const INITIAL_STATE = {
  user: {},
};

export const loginReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case SET_USER: {
            return { ...state, user: action.payload }
        }
        case REFRESH: {
            return INITIAL_STATE
        }
        default: {
            return INITIAL_STATE
        }
    }
}