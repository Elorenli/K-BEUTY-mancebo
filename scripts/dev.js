import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const commands = [
  ["API", [fileURLToPath(new URL("../server/index.js", import.meta.url))]],
  ["Vite", [fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url)), "--host", "127.0.0.1"]],
];
const children = commands.map(([name, args]) => {
  const child = spawn(process.execPath, args, { stdio: "inherit", env: process.env });
  child.on("error", (error) => {
    console.error(`${name} no pudo iniciarse: ${error.message}`);
    shutdown(1);
  });
  child.on("exit", (code) => {
    if (!stopping && code !== 0) shutdown(code ?? 1);
  });
  return child;
});
let stopping = false;

function shutdown(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null && !child.killed) child.kill();
  }
  process.exitCode = exitCode;
}

process.once("SIGINT", () => shutdown());
process.once("SIGTERM", () => shutdown());
