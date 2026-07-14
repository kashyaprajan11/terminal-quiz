import amqp from "amqplib";

export type Room = {
  code: string;
  players: {
    name: string;
    replyQueue: string;
    isAdmin: boolean;
  };
  state: "lobby";
};

const consumeMessage = async (
  channel: amqp.Channel,
  body: string | undefined,
) => {
  if (body === undefined) return;
  try {
    const msg = JSON.parse(body);
    const rooms: Map<string, Room> = new Map();
    switch (msg.type) {
      case "create_room":
        console.log("Creating room...");
        const roomCode = `room.${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        await channel.assertExchange(roomCode, "fanout");
        rooms.set(roomCode, {
          code: roomCode,
          players: { name: msg.name, replyQueue: msg.replyTo, isAdmin: true },
          state: "lobby",
        });
        await channel.sendToQueue(
          msg.replyTo,
          Buffer.from(
            JSON.stringify({ event: "room_created", code: roomCode }),
          ),
        );
        break;
      case "join_room":
        console.log("Room joined");
        break;
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
