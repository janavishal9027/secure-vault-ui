import axios from "axios";
import { authBaseUrl } from "../../utils/url";
import { authentication } from "../../utils/configEnv";

export const registerService = (user) => {
  return axios.post(
    `${authBaseUrl}${authentication}/api/user/public/signUp`,
    user
  );
};