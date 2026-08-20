import { Player } from "./server/rooms";

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

export interface StartGame {
  type: "start_game";
  code: string;
  replyTo: string;
}

export interface RoomEntered {
  type: "room_entered";
  code: string;
  isAdmin: boolean;
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

export interface TotalPlayersInRoom {
  type: "total_players_in_room";
  players: Player[];
}

export interface RoomJoinFailure {
  type: "room_join_failure";
  error: string;
}

export type ClientMessage = CreateRoom | JoinRoom | StartGame;
export type ServerMessage =
  | RoomEntered
  | ErrorMessage
  | RoomUpdate
  | TotalPlayersInRoom
  | RoomJoinFailure;
