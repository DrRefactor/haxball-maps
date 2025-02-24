(() => {
  // src/power.ts
  var room = HBInit({
    roomName: "Jeze",
    playerName: "",
    noPlayer: true,
    public: false,
    maxPlayers: 12,
    token: process?.env?.HEADLESS_TOKEN
  });
  var ballRadius = 10;
  var playerRadius = 15;
  var triggerDistance = ballRadius + playerRadius + 75;
  var triggerTouchTime = 80;
  var TEAM = {
    RED: 1,
    BLUE: 2,
    SPECTATOR: 3
  };
  var powerShotRatio = {
    [TEAM.RED]: 1.8,
    [TEAM.BLUE]: 1.8
  };
  var playerTouchTime = {};
  function pointDistance(p1, p2) {
    const d1 = p1.x - p2.x;
    const d2 = p1.y - p2.y;
    return Math.sqrt(d1 * d1 + d2 * d2);
  }
  function saveTouchTime() {
    room.getPlayerList().forEach((player) => {
      const distanceToBall = pointDistance(
        room.getPlayerDiscProperties(player.id),
        room.getDiscProperties(0)
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
        room.setPlayerAvatar(+playerId, "P");
      } else if (playerTouchTime2 > 0) {
        const a = Math.round(10 * playerTouchTime2 / triggerTouchTime);
        room.setPlayerAvatar(+playerId, "." + a);
      } else {
        room.setPlayerAvatar(+playerId, null);
      }
    });
  }
  function resetTouchTimes() {
    playerTouchTime = {};
    updateAvatars();
  }
  room.onPlayerBallKick = function(player) {
    const powerActive = playerTouchTime[player.id] >= triggerTouchTime;
    if (powerActive) {
      const ps = powerShotRatio[player.team];
      room.setDiscProperties(0, {
        xspeed: ps * (room.getDiscProperties(0)?.xspeed ?? 0),
        yspeed: ps * (room.getDiscProperties(0)?.yspeed ?? 0)
      });
      resetTouchTimes();
    }
  };
  room.onGameStop = function(byPlayer) {
    playerTouchTime = {};
  };
  room.onGameTick = function() {
    if (room.getPlayerList().filter((p) => p.team != 0).length > 0) {
      saveTouchTime();
    }
    updateAvatars();
  };
  room.onPlayerChat = function(player, message) {
    console.log(player, `message: "${message}"`);
    if (message.toLowerCase().startsWith("!reset")) {
      setTimeout(() => {
        room.setDiscProperties(0, {
          x: 0,
          y: 0
        });
      }, 1e3);
    }
    if (message.toLowerCase().startsWith("!power")) {
      const [_, teamIdString, powerString] = message.split(",");
      const power = Number.parseFloat(powerString);
      const team = Number.parseInt(teamIdString);
      if (!Number.isNaN(power) && !Number.isNaN(team)) {
        powerShotRatio[team] = power;
      }
    }
  };
  var _nextTeam = TEAM.RED;
  room.onPlayerJoin = function(player) {
    room.setPlayerAdmin(player.id, true);
    room.setPlayerTeam(player.id, _nextTeam);
    console.log(player);
    _nextTeam = _nextTeam === TEAM.RED ? TEAM.BLUE : TEAM.RED;
  };
  window.hbRoom = room;
})();
