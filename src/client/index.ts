import amqp from "amqplib";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  const conn = await amqp.connect("amqp://guest:guest@localhost:5672");
  const ch = await conn.createChannel();
  const q = await ch.assertQueue("", { exclusive: true });
  await ch.consume(
    q.queue,
    (message) => {
      if (message !== null) {
        const body = JSON.parse(message.content.toString());

        if (body.event === "room_created") {
          console.log(
            `Room Created. Share ${body.code} with your friends to join!`,
          );
          ch.assertExchange(body.code, "fanout");
          ch.bindQueue(q.queue, body.code, "");
        } else if (body.event === "room_join_failure") {
          console.log(`Error: ${body.message}`);
        } else if (body.event === "room_join_success") {
          console.log("Room joined successfully");
          ch.assertExchange(body.code, "fanout");
          ch.bindQueue(q.queue, body.code, "");
        } else if (body.event === "new_player_joined") {
          console.log(`${body.message}, Name: ${body.payload.name}`);
        }

        if (body.event === "total_players_in_room") {
          for (let player of body.players) {
            console.log(`Total Player:
              ${player.name}
              `);
          }
        }
      }
    },
    {
      noAck: true,
    },
  );
  rl.question(
    "Hello, Create room or join room? Press 1 for create and 2 for join\n",
    (answer: string | number) => {
      const choiceSelected = Number(answer);
      if (choiceSelected === 1) {
        // logic for creating new Room and making the user admin
        rl.question("What's your name?\n", async (adminName: string) => {
          console.log("Welcome ", adminName);
          await ch.sendToQueue(
            "server.commands",
            Buffer.from(
              JSON.stringify({
                type: "create_room",
                name: adminName,
                replyTo: q.queue,
              }),
            ),
          );
        });
      } else {
        // logic for joining new room, user needs to give code here
        rl.question("What's your name?\n", async (userName: string) => {
          console.log("Welcome ", userName);
          rl.question(
            "Please enter the room code you want to join\n",
            async (roomCode: string) => {
              await ch.sendToQueue(
                "server.commands",
                Buffer.from(
                  JSON.stringify({
                    type: "join_room",
                    name: userName,
                    replyTo: q.queue,
                    code: roomCode,
                  }),
                ),
              );
            },
          );
        });
      }
    },
  );
}

main().catch((err) => {
  console.error("Caught fatal error", err);
  process.exit(1);
});
