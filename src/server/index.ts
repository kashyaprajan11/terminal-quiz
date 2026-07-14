import amqp from "amqplib";

export type Room = {
  code: string;
  players: {
    id: string;
    name: string;
    replyQueue: string;
    isAdmin: boolean;
  }[];
  state: "lobby" | "active" | "ended";
};
type RoomUpdateOptions = {
  addPlayer?: {
    id: string;
    name: string;
    replyQueue: string;
    isAdmin: boolean;
  };
  removePlayerById?: string;
  state?: "lobby" | "active" | "ended";
};

function updateRoom(
  roomMap: Map<string, Room>,
  roomCode: string,
  options: RoomUpdateOptions,
): boolean {
  const room = roomMap.get(roomCode);
  if (!room) return false;
  if (options.addPlayer) {
    room.players.push({ ...options.addPlayer });
  }
  if (options.removePlayerById) {
    room.players = room.players.filter(
      (player) => player.id !== options.removePlayerById,
    );
  }
  if (options.state) {
    room.state = options.state;
  }
  return true;
}
const consumeMessage = async (
  channel: amqp.Channel,
  body: string | undefined,
) => {
  if (body === undefined) return;
  try {
    const msg = JSON.parse(body);
    const rooms: Map<string, Room> = new Map();
    switch (msg.type) {
      case "create_room": {
        console.log("Creating room...");
        const roomCode = `room.${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        await channel.assertExchange(roomCode, "fanout");
        updateRoom(rooms, roomCode, {
          addPlayer: {
            id: crypto.randomUUID(),
            name: msg.name,
            replyQueue: msg.replyTo,
            isAdmin: true,
          },
          state: "lobby",
        });
        await channel.sendToQueue(
          msg.replyTo,
          Buffer.from(
            JSON.stringify({ event: "room_created", code: roomCode }),
          ),
        );
        break;
      }
      case "join_room": {
        console.log("Joining room");
        const selectedRoom = rooms.get(msg.code);
        if (!selectedRoom) {
          await channel.sendToQueue(
            msg.replyTo,
            Buffer.from(
              JSON.stringify({
                event: "room_join_failure",
                message: "No room found",
              }),
            ),
          );
          return;
        }
        updateRoom(rooms, selectedRoom.code, {
          addPlayer: {
            id: crypto.randomUUID(),
            name: msg.name,
            replyQueue: msg.replyTo,
            isAdmin: false,
          },
        });

        await channel.sendToQueue(
          msg.replyTo,
          Buffer.from(
            JSON.stringify({
              event: "room_join_success",
              message: "Room joined successfully",
            }),
          ),
        );

        await channel.publish(
          selectedRoom.code,
          "",
          Buffer.from(
            JSON.stringify({
              event: "new_player_joined",
              message: "We have a new player",
              payload: { name: msg.name },
            }),
          ),
        );
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
  const conn = await amqp.connect("amqp://guest:guest@localhost:5672");
  const channel = await conn.createChannel();
  await channel.assertQueue("server.commands");
  await channel.consume(
    "server.commands",
    (msg) => consumeMessage(channel, msg?.content.toString()),
    { noAck: true },
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
