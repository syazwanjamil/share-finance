import { BrowserRouter } from "react-router-dom";
import { AppDataProvider } from "./state/AppDataContext";
import { AppRoutes } from "./routes";

function App() {
  return (
    <BrowserRouter>
      <AppDataProvider>
        <AppRoutes />
      </AppDataProvider>
    </BrowserRouter>
  );
}

export default App;
