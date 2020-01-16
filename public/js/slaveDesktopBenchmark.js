const Sha256 = require("../downloadfiles/sha256");
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;

function benchmark(chars, start, stop) {
  let time1 = Date.now();
  let text = "";

  for (let i = start; i < stop; i++) {
    text = numToTextCode(chars, i);
    Sha256.hash(text);
  }
  let time2 = Date.now();
  return time2 - time1;
}

function numToTextCode(chars, num) {
  //let chars.length = chars.length;
  let level = getLevel(num, chars.length);
  let line = ""; // clear the line
  num -= getLevelSize(level - 1, chars.length);
  // The new code is generated
  do {
    // The code is determined by the remainder of the new text code and the size of chars array
    charLoc = num % chars.length;

    line += chars[charLoc]; // The first character is copied to the line

    // The division of the textcode and chars array size is stored. This moves us to the next char in the charcode
    num = Math.floor(num / chars.length);
  } while (num > 0); // Once tempTextCode is 0 or less, there aren't any more characters in the char code

  let startchar = chars[0];
  while (line.length < level) {
    // If the
    line += startchar;
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
function getLevel(id, arraySize) {
  id++;
  let level = 0;
  let beggining = 0;
  while (beggining < id) {
    beggining = 0;
    for (let i = 1; i <= level; i++) {
      beggining = arraySize ** i + beggining;
    }
    level++;
  }
  return level - 1;
}

let chars = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

let count = 256000;

if (cluster.isMaster) {
  // Fork workers.
  let dead = 0;
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  let time = 0;
  function messageHandler(msg) {
    if (msg.time) {
      console.log(msg.time);
      time += msg.time;
    }
  }

  for (const id in cluster.workers) {
    cluster.workers[id].on("message", messageHandler);
  }
  cluster.on("exit", (worker, code, signal) => {
    dead += 1;
    if (dead === 8) {
      time = time / (1000 * numCPUs);
      console.log(`Average Time: ${time} Seconds`);
      console.log(`Speed: ${Math.floor((count * numCPUs) / time)} Hash/Second`);
    }
  });
} else {
  let time = benchmark(chars, 0, count);
  process.send({ time: time });
  process.kill(process.pid);
}
