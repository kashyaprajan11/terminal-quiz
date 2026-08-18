export type Player = {
  id: string;
  name: string;
  replyQueue: string;
  isAdmin: boolean;
};

export type Room = {
  code: string;
  players: Player[];
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

export function updateRoom(
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
