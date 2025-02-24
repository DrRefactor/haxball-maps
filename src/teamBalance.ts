import { TEAM } from "./constants";
import { Plugin } from "./utils/plugin";

const balanceVals = {
  [TEAM.RED]: 1,
  [TEAM.BLUE]: -1,
};

export const teamBalancePlugin: Plugin = room => {
  return {
    onPlayerJoin: function (player) {
      const balance = room
        .getPlayerList()
        .reduce(
          (result, player) => result + (balanceVals[player.team] ?? 0),
          0
        );
      const playerTeam = balance > 0 ? TEAM.BLUE : TEAM.RED;
      room.setPlayerAdmin(player.id, true);
      room.setPlayerTeam(player.id, playerTeam);
    },
  };
};
