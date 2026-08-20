import * as readline from "node:readline/promises";
import { clientConnect } from "./amqp";
import { clientHandler, sendCommand } from "./handlers";
import { askRoomIntent, startGameTriggerQuestion } from "./ui";
import { ClientState } from "../types";
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  const ch = await clientConnect();
  const q = await ch.assertQueue("", { exclusive: true });
  const clientState: ClientState = {
    isAdmin: false,
    numberOfPlayers: 1,
    startQuestionAsked: false,
    code: "",
  };

  async function startGame() {
    if (await startGameTriggerQuestion(rl, clientState.numberOfPlayers)) {
      sendCommand(ch, {
        type: "start_game",
        code: clientState.code,
        replyTo: q.queue,
      });
    }
  }
  await ch.consume(
    q.queue,
    (message) => clientHandler(ch, q.queue, message, clientState, startGame),
    {
      noAck: true,
    },
  );

  const cmd = await askRoomIntent(rl, q.queue, clientState);
  sendCommand(ch, cmd);
}

main().catch((err) => {
  console.error("Caught fatal error", err);
  process.exit(1);
});
