import * as readline from "node:readline/promises";
import { clientConnect } from "./amqp";
import { clientHandler, sendCommand } from "./handlers";
import { askRoomIntent } from "./ui";
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  const ch = await clientConnect();
  const q = await ch.assertQueue("", { exclusive: true });
  await ch.consume(q.queue, (message) => clientHandler(ch, q.queue, message), {
    noAck: true,
  });
  try {
    const cmd = await askRoomIntent(rl, q.queue);
    sendCommand(ch, cmd);
  } catch (err) {
    console.log("Error encountered while reading input", err);
  }
}

main().catch((err) => {
  console.error("Caught fatal error", err);
  process.exit(1);
});
