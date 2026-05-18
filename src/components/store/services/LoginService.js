import { authentication } from "../../utils/configEnv";
import axios from "axios";
import { authBaseUrl } from "../../utils/url";

export const loginService = async (credentials) => {
    return axios.post(
      `${authBaseUrl}${authentication}/api/user/public/login`,
      credentials
    );
};
