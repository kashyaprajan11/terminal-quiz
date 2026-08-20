import { Channel, ConsumeMessage } from "amqplib";
import { ClientMessage, ServerMessage } from "../messages";
import { ClientState } from "../types";

export async function clientHandler(
  ch: Channel,
  queue: string,
  message: ConsumeMessage | null,
  clientState: ClientState,
  startGame: () => Promise<void>,
) {
  if (message === null) {
    return;
  }
  const body = JSON.parse(message.content.toString()) as ServerMessage;
  if (body.type === "room_entered") {
    console.log(`Room Joined. Share ${body.code} with your friends to join!`);
    clientState.code = body.code;
    await subscribeToRoom(ch, queue, body.code);
  } else if (body.type === "room_join_failure") {
    console.log("Failed to join the room");
  }

  if (body.type === "total_players_in_room") {
    console.log("Player online: ");
    for (let player of body.players) {
      console.log(player.name);
    }
    clientState.numberOfPlayers = body.players.length;
    if (
      clientState.isAdmin &&
      body.players.length >= 2 &&
      !clientState.startQuestionAsked
    ) {
      clientState.startQuestionAsked = true;
      startGame();
    }
  }
}

export async function subscribeToRoom(
  ch: Channel,
  queue: string,
  exchange: string,
  key = "",
) {
  await ch.bindQueue(queue, exchange, key);
}

export function sendCommand(ch: Channel, cmd: ClientMessage) {
  ch.sendToQueue("server.commands", Buffer.from(JSON.stringify(cmd)));
}
