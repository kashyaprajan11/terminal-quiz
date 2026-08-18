import amqp from "amqplib";
import { Room, updateRoom } from "./rooms";
import { channelConnect, sendTo, broadcast } from "./amqp";
import { ClientMessage } from "../messages";
import { handleCreateRoom, handleJoinRoom } from "./handlers";

const consumeMessage = async (
  channel: amqp.Channel,
  body: string | undefined,
  rooms: Map<string, Room>,
) => {
  if (body === undefined) return;
  try {
    const msg = JSON.parse(body) as ClientMessage;

    switch (msg.type) {
      case "create_room": {
        handleCreateRoom(channel, rooms, msg);
        break;
      }
      case "join_room": {
        handleJoinRoom(channel, rooms, msg);
        break;
      }
      default:
        console.log("Default hit");
    }
  } catch (err) {
    console.log("Error parsing data", err);
  }
};

async function main() {
  const channel = await channelConnect();
  const rooms: Map<string, Room> = new Map();
  await channel.consume(
    "server.commands",
    (msg) => consumeMessage(channel, msg?.content.toString(), rooms),
    { noAck: true },
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
