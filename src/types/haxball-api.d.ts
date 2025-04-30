type RoomInit = {
  roomName: string;
  playerName: string;
  maxPlayers: number;
  public: boolean;
  noPlayer: boolean;
  password?: string;
  geo?: { code: string; lat: number; lon: number };
  token?: string;
};

type Room = {
  sendAnnouncement(
    message: string,
    targetId?: number,
    color?: number,
    style?: string,
    sound?: number
  );
  sendChat: (message: string, targetId?: number) => void;
  setPlayerAdmin: (playerID: number, admin: boolean) => void;
  setPlayerTeam: (playerID: number, team: number) => void;
  kickPlayer: (playerID: number, reason: string, ban: boolean) => void;
  clearBan: (playerId: number) => void;
  clearBans: () => void;
  setScoreLimit: (limit: number) => void;
  setTimeLimit: (limit: number) => void;
  setCustomStadium: (stadium: string) => void;
  setDefaultStadium: (stadium: string) => void;
  setTeamsLock: (locked: boolean) => void;
  setTeamColors: (
    team: number,
    angle: number,
    textColor: number,
    colors: number[]
  ) => void;
  setPlayerAvatar: (playerID: number, avatar: string | null) => void;
  getPlayerAvatar: (playerID: number) => string | null;
  startGame: () => void;
  stopGame: () => void;
  pauseGame: (pause: boolean) => void;
  setKickRateLimit: (min: number, rate: number, burst: number) => void;
  getPlayerList: () => Player[];
  getScores: () => Scores | null;
  isGamePaused: () => boolean;
  getBallPosition: () => { x: number; y: number } | null;
  getPlayerDiscProperties: (playerID: number) => DiscProperties | null;
  getDiscProperties: (discId: number) => DiscProperties | null;
  setDiscProperties: (
    discId: number,
    properties: Partial<DiscProperties>
  ) => void;
  startRecording: () => void;
  stopRecording: () => Uint8Array;
  onPlayerJoin?: (player: Player) => void;
  onPlayerLeave?: (player: Player) => void;
  onPlayerChat?: (player: Player, message: string) => boolean | void;
  onPlayerBallKick?: (player: Player) => void;
  onTeamGoal?: (team: number) => void;
  onGameStart?: (byPlayer: Player | null) => void;
  onGameStop?: (byPlayer: Player | null) => void;
  onPlayerAdminChange?: (
    changedPlayer: Player,
    byPlayer: Player | null
  ) => void;
  onPlayerTeamChange?: (changedPlayer: Player, byPlayer: Player | null) => void;
  onPlayerKicked?: (
    kickedPlayer: Player,
    reason: string,
    ban: boolean,
    byPlayer: Player | null
  ) => void;
  onGameTick?: () => void;
  onRoomLink?: (url: string) => void;
};

export type PlayerId = number;

type Player = {
  id: PlayerId;
  name: string;
  team: number;
  admin: boolean;
  position?: { x: number; y: number };
};

type Scores = {
  red: number;
  blue: number;
  time: number;
  scoreLimit: number;
  timeLimit: number;
  teamsLocked: boolean;
};

type DiscProperties = {
  x: number;
  y: number;
  xspeed: number;
  yspeed: number;
  xgravity: number;
  ygravity: number;
  radius: number;
  bCoeff: number;
  invMass: number;
  damping: number;
  color: number;
};

declare global {
  function HBInit(config: RoomInit): Room;
}
