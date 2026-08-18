import * as readline from "node:readline/promises";
import { ClientMessage } from "../messages";

export async function askRoomIntent(
  rl: readline.Interface,
  queue: string,
): Promise<ClientMessage> {
  let choice = (
    await rl.question(
      "Hello, Press 1 to create a new room or press 2 to join a room?\n",
    )
  ).trim();
  while (choice !== "1" && choice !== "2") {
    choice = (
      await rl.question(
        "Hello, Press 1 to create a new room or press 2 to join a room?\n",
      )
    ).trim();
  }
  const name = (await rl.question("What's your name?\n")).trim();
  if (choice === "1") {
    console.log("Welcome, ", name);
    return { type: "create_room", name, replyTo: queue };
  }

  const code = (await rl.question("Room code?\n")).trim();
  return { type: "join_room", name, replyTo: queue, code };
}
