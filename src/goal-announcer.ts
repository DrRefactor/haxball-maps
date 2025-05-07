import { Player } from "./types/haxball-api";
import { Plugin } from "./utils/plugin";

export const goalAnnouncerPlugin: Plugin = room => {
  let kickedBy: Player = null;
  return {
    onPlayerBallKick: function (player) {
      kickedBy = player;
    },
    onTeamGoal(team) {
      if (!kickedBy) {
        return;
      }
      if (kickedBy.team !== team) {
        room.sendAnnouncement(`${kickedBy.name} scores an own goal`, undefined, 0xff0000, "bold", 2);
      } else {
        room.sendAnnouncement(`${kickedBy.name} scores`, undefined, 0x00ff00, "bold", 2);
      }
    },
  };
};
