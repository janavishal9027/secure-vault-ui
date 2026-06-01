import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { SnackbarProvider } from "notistack";
import store from "./components/store/store";
import { ThemeModeProvider } from "./components/theme/ThemeModeContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <ThemeModeProvider>
      <BrowserRouter>
        <SnackbarProvider
          maxSnack={3}
          autoHideDuration={3000}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <App />
        </SnackbarProvider>
      </BrowserRouter>
    </ThemeModeProvider>
  </Provider>,
);

reportWebVitals();
