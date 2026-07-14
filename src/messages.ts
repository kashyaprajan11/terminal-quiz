export interface CreateRoom {
  type: "create_room";
  name: string;
  replyTo: string;
}

export interface JoinRoom {
  type: "join_room";
  code: string;
  name: string;
  replyTo: string;
}

export interface RoomCreated {
  type: "room_created";
  code: string;
  name: string;
  replyTo: string;
}

export interface ErrorMessage {
  type: "error_message";
  error: string;
}

export interface RoomUpdate {
  type: "room_update";
  players: string[];
  admin: string;
}

export type ClientMessage = CreateRoom | JoinRoom;
export type ServerMessage = RoomCreated | ErrorMessage | RoomUpdate;
