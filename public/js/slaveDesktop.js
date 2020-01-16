let io = require("socket.io-client");
let Sha256 = require("../downloadfiles/sha256");
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;

global.count = 0;

function onwork(time, size) {
  console.log(`${Math.floor(size / time)} hash/sec`);
}

function testHashV2(hashToCrack, chars, start, stop) {
  let text = "";
  for (let i = start; i < stop; i++) {
    text = numToTextCode(chars, i);
    if (hashToCrack === Sha256.hash(text)) {
      return text;
    }
  }
  return false;
}

function numToTextCode(chars, num) {
  let level = getLevel(num, chars.length);
  let line = ""; // clear the line
  num -= getLevelSize(level - 1, chars.length);
  // The new code is generated
  do {
    // The code is determined by the remainder of the new text code and the size of chars array
    charLoc = String(Math.floor(num) % chars.length);

    line += chars[charLoc]; // The first character is copied to the line

    // The division of the textcode and chars array size is stored. This moves us to the next char in the charcode
    num = Math.floor(num / chars.length);
  } while (num > 0); // Once tempTextCode is 0 or less, there aren't any more characters in the char code

  while (line.length < level) {
    // If the
    line += chars[0];
  }
  return line;
}

function getLevelSize(level, arraySize) {
  let size = 0;
  for (let i = 1; i <= level; i++) {
    size = arraySize ** i + size;
    //console.log(`${level}:${beggining}`);
  }
  return size;
}
function iscracked() {
  for (let i in global.workloads) {
    if (global.workloads[i] !== false) {
      return global.workloads[i];
    }
    return false;
  }
}
function getLevel(id, arraySize) {
  id++;
  let level = 0;
  let beggining = 0;
  while (beggining < id) {
    beggining = 0;
    for (let i = 1; i <= level; i++) {
      beggining = arraySize ** i + beggining;
      //console.log(`${level}:${beggining}`);
    }
    level++;
    //console.log(`${level}:${beggining}`);
  }
  if (beggining === 0) {
    return level;
  } else {
    return level - 1;
  }
}

if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  function messageHandler(msg) {
    global.output = msg.output;
    global.finished += 1;

    if (global.finished === numCPUs) {
      global.finished = 0;
      let time2 = Date.now() / 1000;
      socket.emit("finishedWork", {
        cracked: msg.output,
        hash: global.hash,
        start: global.start,
        stop: global.stop,
        slaveid: null,
      });
      onwork(time2 - global.time1, global.range);

      socket.emit("requestWork", "");
    }
  }

  for (const id in cluster.workers) {
    cluster.workers[id].on("message", messageHandler);
  }

  let socket = io.connect("http://localhost:3000", { reconnect: false });
  socket.on("connect", function() {
    console.log("connected to localhost:3000");
  });

  socket.on("start", function(data) {
    console.log("Starting");

    socket.emit("requestWork", "");
  });

  socket.on("work", msg => {
    if (msg === "nowork") {
      console.log("No Work, finito");
    } else {
      //console.log(`Received work at ${msg.start}`);
      global.hash = msg.hash;
      global.start = msg.start;
      global.stop = msg.stop;
      global.time1 = Date.now() / 1000;
      global.finished = 0;
      global.range = msg.stop - msg.start;
      let size = global.range / numCPUs;
      let count = 0;

      for (const id in cluster.workers) {
        cluster.workers[id].send({
          hash: msg.hash,
          chars: msg.chars,
          start: msg.start + size * count,
          stop: msg.stop - size * (numCPUs - 1 - count),
        });
        count++;
      }
      //testHashV2(msg.hash, msg.chars, msg.start, msg.stop);

      /*testHashV2(msg.hash, msg.chars, msg.start, msg.stop - size * 3);
    testHashV2(msg.hash, msg.chars, msg.start + size, msg.stop - size * 2);
    testHashV2(msg.hash, msg.chars, msg.start + size * 2, msg.stop - size);
    testHashV2(msg.hash, msg.chars, msg.start + size * 3, msg.stop);*/
    }
  });
} else {
  //testHashV2(msg.hash, msg.chars, msg.start, msg.stop);
  process.on("message", msg => {
    if (msg.hash) {
      let output = testHashV2(msg.hash, msg.chars, msg.start, msg.stop);
      process.send({
        output: output,
      });
    }
  });
}
