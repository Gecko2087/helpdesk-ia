import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => {
  console.log(`HelpDesk IA API escuchando en http://localhost:${env.port}`);
});
