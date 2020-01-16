function wordlistGenV2(chars, block, numofBlocks = 1) {
  let tempTextCode = 0; // Used to store the block number temporarily
  let data = []; // used to store the whole of the wordlist
  let line = ""; // Used to temporarily store the current line of the wordlist
  let charLoc = 0; // Stores the which char in the chars array to use
  let textCode; // Stores the "code" which will translate to one word in the wordlist
  let blockSize; // Determines how many words there will be in this block

  for (let size = 0; size < numofBlocks; size++) {
    textCode = 0;
    blockSize = chars.length ** block;
    while (textCode < blockSize) {
      // While we have not reached the blockSize

      // Bring tempTextCode to the next code
      tempTextCode = textCode++;
      line = ""; // clear the line

      // The new code is generated
      do {
        // The code is determined by the remainder of the new text code and the size of chars array
        charLoc = String(Math.floor(tempTextCode) % chars.length);

        line += chars[charLoc]; // The first character is copied to the line

        // The division of the textcode and chars array size is stored. This moves us to the next char in the charcode
        tempTextCode = Math.floor(tempTextCode / chars.length);
      } while (tempTextCode > 0); // Once tempTextCode is 0 or less, there aren't any more characters in the char code

      while (line.length < block) {
        // If the
        line += chars[0];
      }

      data.push(line);
    }
    block++;
  }

  return data;
}

function testHashV2(hashToCrack, chars, start, stop) {
  let text = "";
  let hash = "";
  for (let i = start; i < stop; i++) {
    text = numToTextCode(chars, i);
    hash = Sha256.hash(text);
    if (hashToCrack === hash) {
      return text;
    }
  }
  return false;
}

function testHash(hashToCrack, chars, start, stop) {
  let wordlist = wordlistGenV3(chars, start, stop);
  let i = 0;
  let word = "";
  let hash = "";
  while (hash != hashToCrack && i < wordlist.length) {
    word = wordlist[i++];
    hash = Sha256.hash(word);
  }
  if (hash === hashToCrack) {
    console.log(word);
    return word;
  } else {
    return false;
  }
}
function wordlistGenV3(chars, start, stop) {
  let wordlist = [];
  for (let i = start; i < stop; i++) {
    wordlist.push(numToTextCode(chars, i));
  }
  return wordlist;
}

function numToTextCode(chars, num) {
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

function sha256hash(plainText) {
  var md = forge.md.md5.create();
  md.start();
  md.update(plainText, "utf8");
  var hashText = md.digest().toHex();
  return hashText;
}

function onwork(time, size) {
  let speed = document.getElementById("hashspeed");
  let count = document.getElementById("hashcount");
  count.innerHTML = parseInt(count.innerHTML) + size;
  speed.innerHTML = `${Math.floor(size / time)} hash/sec`;
}

var socket = io();

socket.on("start", function(data) {
  let templateText = `<h1>Script loaded</h1>
    <div class='statbox'>
        <div class='stat-title'> Your Speed: </div>
        <div id='hashspeed'>0 hash/sec (This includes time to make wordlist)</div>
    </div>
    <div class='statbox'>
        <div class='stat-title'>Hashes tested</div>
        <div id='hashcount'>0</div>
    </div>`;
  let div = document.getElementById("status");
  div.innerHTML = templateText;

  let id = localStorage.getItem("slaveid");
  if (id === null) {
    socket.emit("requestID", "");
  } else {
    socket.emit("requestWork", "");
  }
});

socket.on("setid", msg => {
  localStorage.setItem("slaveid", msg.id);
  socket.emit("requestWork", "");
});

socket.on("work", msg => {
  if (msg === "nowork") {
    console.log("No Work, finito");
  } else {
    //console.log(`Received work at ${msg.start}`);
    let range = msg.stop - msg.start;
    let size = range / 4;
    let time1 = Date.now() / 1000;
    let output = testHashV2(msg.hash, msg.chars, msg.start, msg.stop);
    /*let output = testHash(msg.hash, msg.chars, msg.start, msg.stop-size*3);
    output = testHash(msg.hash, msg.chars, msg.start+size, msg.stop-size*2);
    output = testHash(msg.hash, msg.chars, msg.start+size*2, msg.stop-size);
    output = testHash(msg.hash, msg.chars, msg.start+size*3, msg.stop);*/
    let time2 = Date.now() / 1000;
    socket.emit("finishedWork", {
      cracked: output,
      hash: msg.hash,
      start: msg.start,
      stop: msg.stop,
      slaveid: localStorage.getItem("slaveid"),
    });
    if (output !== false) {
    } else {
      console.log(output);
    }

    onwork(time2 - time1, msg.stop - msg.start);

    socket.emit("requestWork", "");
  }
});
