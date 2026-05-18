import { loginService } from "../services/LoginService";
import { SET_USER } from "../../utils/actionConstants";
import { enqueueSnackbar } from "notistack";

// action
export function setUser(user) {
    return {
        type: SET_USER,    // ✅ use constant
        payload: user,
    };
}

export const startUserLogin = (userCredentials, redirect) => {
    return async () => {
        loginService(userCredentials)
            .then((res) => {
                const roles = res.data.roles;

                localStorage.setItem("token", res.data.jwtToken);
                localStorage.setItem("roles", roles);

                //MUI success message
                enqueueSnackbar("Login successful!", {
                    variant: "success",
                });

                redirect();
            })
            .catch((err) => {
                if (err && err.response && err.response.status === 401) {

                    //Show error using MUI Snackbar 
                    enqueueSnackbar(err.response.data.message, {
                        variant: "error",
                        autoHideDuration: 5000,
                        anchorOrigin: {
                            vertical: "top",
                            horizontal: "center",
                        },
                    });
                }
            });
    };
};
