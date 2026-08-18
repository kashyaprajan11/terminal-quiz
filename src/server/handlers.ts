import { Channel } from "amqplib";
import { Room, updateRoom } from "./rooms";
import { ClientMessage } from "../messages";
import { sendTo, broadcast } from "./amqp";

export async function handleCreateRoom(
  channel: Channel,
  rooms: Map<string, Room>,
  msg: ClientMessage,
) {
  try {
    const roomCode = `room.${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    await channel.assertExchange(roomCode, "fanout");
    const room: Room = {
      code: roomCode,
      players: [
        {
          id: crypto.randomUUID(),
          name: msg.name,
          replyQueue: msg.replyTo,
          isAdmin: true,
        },
      ],
      state: "lobby",
    };
    rooms.set(roomCode, room);
    sendTo(channel, msg.replyTo, {
      type: "room_entered",
      code: roomCode,
      isAdmin: true,
    });
    broadcast(channel, roomCode, {
      type: "total_players_in_room",
      players: room.players,
    });
  } catch (err) {
    console.error("Error while creating room", err);
  }
}

export async function handleJoinRoom(
  channel: Channel,
  rooms: Map<string, Room>,
  msg: ClientMessage,
) {
  try {
    if (msg.type !== "join_room") return;
    const selectedRoom = rooms.get(msg.code);
    if (!selectedRoom) {
      sendTo(channel, msg.replyTo, {
        type: "room_join_failure",
        error: "No room found",
      });
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
    sendTo(channel, msg.replyTo, {
      type: "room_entered",
      code: selectedRoom.code,
      isAdmin: false,
    });
    broadcast(channel, selectedRoom.code, {
      type: "total_players_in_room",
      players: selectedRoom.players,
    });
  } catch (err) {
    console.error("Error while joining room", err);
  }
}
