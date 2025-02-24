(() => {
  // src/constants.ts
  var ballRadius = 10;
  var playerRadius = 15;

  // src/utils/geometry.ts
  function discsDistance(p1, p2) {
    const d1 = p1.x - p2.x;
    const d2 = p1.y - p2.y;
    return Math.sqrt(d1 * d1 + d2 * d2);
  }

  // src/power.ts
  var triggerDistance = ballRadius + playerRadius + 75;
  var triggerTouchTime = 80;
  var powerShotRatio = {
    [1 /* RED */]: 1.8,
    [2 /* BLUE */]: 1.8
  };
  var powerPlugin = (room2) => {
    let playerTouchTime = {};
    function saveTouchTime() {
      room2.getPlayerList().forEach((player) => {
        const distanceToBall = discsDistance(
          room2.getPlayerDiscProperties(player.id),
          room2.getDiscProperties(0)
        );
        const touches = distanceToBall < triggerDistance;
        if (touches) {
          playerTouchTime[player.id] = playerTouchTime[player.id] || 0;
          playerTouchTime[player.id]++;
        } else {
          playerTouchTime[player.id] = 0;
        }
      });
    }
    function updateAvatars() {
      Object.entries(playerTouchTime).forEach(([playerId, playerTouchTime2]) => {
        if (playerTouchTime2 >= triggerTouchTime) {
          room2.setPlayerAvatar(+playerId, "P");
        } else if (playerTouchTime2 > 0) {
          const a = Math.round(10 * playerTouchTime2 / triggerTouchTime);
          room2.setPlayerAvatar(+playerId, "." + a);
        } else {
          room2.setPlayerAvatar(+playerId, null);
        }
      });
    }
    function resetTouchTimes() {
      playerTouchTime = {};
      updateAvatars();
    }
    return {
      onPlayerBallKick: function(player) {
        const powerActive = playerTouchTime[player.id] >= triggerTouchTime;
        if (powerActive) {
          const ps = powerShotRatio[player.team];
          room2.setDiscProperties(0, {
            xspeed: ps * (room2.getDiscProperties(0)?.xspeed ?? 0),
            yspeed: ps * (room2.getDiscProperties(0)?.yspeed ?? 0)
          });
          resetTouchTimes();
        }
      },
      onGameStop: function(byPlayer) {
        playerTouchTime = {};
      },
      onGameTick: function() {
        if (room2.getPlayerList().filter((p) => p.team != 0).length > 0) {
          saveTouchTime();
        }
        updateAvatars();
      },
      onPlayerChat: function(player, message) {
        if (message.toLowerCase().startsWith("!power")) {
          const [_, teamIdString, powerString] = message.split(",");
          const power = Number.parseFloat(powerString);
          const team = Number.parseInt(teamIdString);
          if (!Number.isNaN(power) && !Number.isNaN(team)) {
            powerShotRatio[team] = power;
            room2.sendAnnouncement(
              `Power of team ${team} set to ${power}`,
              player.id
            );
          } else {
            room2.sendAnnouncement(
              `Incorrect power settings, command syntax: !power,<team_id>,<power_value>`,
              player.id
            );
          }
        }
      }
    };
  };

  // src/reset.ts
  var resetPlugin = (room2) => {
    return {
      onPlayerChat: function(player, message) {
        if (message.toLowerCase().startsWith("!reset")) {
          setTimeout(() => {
            room2.setDiscProperties(0, {
              x: 0,
              y: 0
            });
          }, 1e3);
        }
      }
    };
  };

  // src/teamBalance.ts
  var balanceVals = {
    [1 /* RED */]: 1,
    [2 /* BLUE */]: -1
  };
  var teamBalancePlugin = (room2) => {
    return {
      onPlayerJoin: function(player) {
        const balance = room2.getPlayerList().reduce(
          (result, player2) => result + (balanceVals[player2.team] ?? 0),
          0
        );
        const playerTeam = balance > 0 ? 2 /* BLUE */ : 1 /* RED */;
        room2.setPlayerAdmin(player.id, true);
        room2.setPlayerTeam(player.id, playerTeam);
      }
    };
  };

  // src/utils/plugin.ts
  function applyPlugin(room2, pluginConfig) {
    for (const key in pluginConfig) {
      const defaultFunction = room2[key];
      room2[key] = function(...args) {
        defaultFunction?.(...args);
        pluginConfig[key](...args);
      };
    }
  }
  function applyPlugins(room2, ...plugins) {
    plugins.forEach((plugin) => applyPlugin(room2, plugin(room2)));
  }

  // src/index.ts
  var room = HBInit({
    roomName: "Jeze",
    playerName: "",
    noPlayer: true,
    public: false,
    maxPlayers: 12,
    token: window.process?.env?.HEADLESS_TOKEN
  });
  applyPlugins(room, powerPlugin, resetPlugin, teamBalancePlugin);
  window.hbRoom = room;
})();
