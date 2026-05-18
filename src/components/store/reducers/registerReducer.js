import { CREATE_USER, REFRESH } from "../../utils/actionConstants";

const INITIAL_STATE = {
  user: {},
};

export const registerReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case CREATE_USER: {
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

