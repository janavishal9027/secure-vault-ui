import { registerService } from "../services/RegisterService";

export function createUser(user) {
  return {
    type: "CREATE_USER",
    payload: user,
  };
}

export const register = (userDetails) => {
  return async (dispatch) => {
    try {
      const response = await registerService(userDetails);

      dispatch(createUser(response.data));

      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || "Registration failed";

      return { success: false, message: errorMessage };
    }
  };
};
