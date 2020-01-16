let socket = io();
socket.on("sync", msg => {
  let hashes = document.getElementById("foundHashes");
  let queue = document.getElementById("queue");
  for (let i in msg.finishQueue) {
    hashes.innerHTML += `<tr><td>${i}</td><td>${msg.finishQueue[i]}</td></tr>`;
  }
  for (let i in msg.hashQueue) {
    queue.innerHTML += `<tr><td>${msg.hashQueue[i]}</td></tr>`;
  }
});

socket.on("displayUpdate", msg => {
  let totalspeed = document.getElementById("totalspeed");
  let currlev = document.getElementById("currlev");
  let curhash = document.getElementById("curhash");
  if (curhash.innerHTML !== msg.curhash) {
    curhash.innerHTML = msg.curhash;
    socket.emit("sync", "");
  }
  spd.innerHTML = msg.totalspeed;
  currlev.innerHTML = msg.level;
});
