import amqp from "amqplib";

export async function clientConnect() {
  const conn = await amqp.connect("amqp://guest:guest@localhost:5672");
  const ch = await conn.createChannel();
  return ch;
}
