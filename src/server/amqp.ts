import amqp, { Channel } from "amqplib";
import { ServerMessage } from "../messages";

export async function channelConnect() {
  const conn = await amqp.connect("amqp://guest:guest@localhost:5672");
  const channel = await conn.createChannel();
  await channel.assertQueue("server.commands");
  return channel;
}

export function sendTo(ch: Channel, queue: string, msg: ServerMessage) {
  ch.sendToQueue(queue, Buffer.from(JSON.stringify(msg)));
}

export function broadcast(ch: Channel, exchange: string, msg: ServerMessage) {
  ch.publish(exchange, "", Buffer.from(JSON.stringify(msg)));
}
