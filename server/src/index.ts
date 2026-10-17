import express, { type NextFunction, type Request, type Response } from "express";
import path from "node:path";
import fs from "node:fs";
import { router } from "./routes";

const app = express();
app.use(express.json());
app.use("/api", router);

// En producción (npm run build && npm start) se sirve el frontend compilado.
const clientDir = path.resolve("dist/client");
if (fs.existsSync(clientDir)) app.use(express.static(clientDir));

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  if (!res.headersSent) res.status(500).json({ error: "Error interno del servidor" });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`API escuchando en http://localhost:${port}`));
