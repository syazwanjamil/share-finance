import { config } from "./config/env.js";
import { createApp } from "./app.js";

const app = createApp();

app.listen(config.PORT, () => {
  console.log(`ShareFinance API listening on http://localhost:${config.PORT} (${config.NODE_ENV})`);
});
