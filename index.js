const app = require("express")();
var http = require("http").createServer(app);
const favicon = require("express-favicon");
const path = require("path");
const bodyParser = require("body-parser");
var io = require("socket.io")(http);
const { Sequelize, Model, DataTypes } = require("sequelize");
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "database.sqlite",
  logging: false,
});

const port = 3000;

//Preprocessors

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json());

// Setup Database
class logs extends Model {}
logs.init(
  {
    time: DataTypes.TIME,
    log: DataTypes.STRING,
  },
  { sequelize, modelName: "logs" }
);
class slaves extends Model {}
slaves.init(
  {
    avgspeed: DataTypes.DOUBLE,
    blocks: DataTypes.INTEGER,
    slaveid: {
      // needs to be unique
      type: DataTypes.INTEGER,
      unique: true,
    },
  },
  { sequelize, modelName: "slaves" }
);

class queue extends Model {}
queue.init(
  {
    hash: DataTypes.STRING,
    submitDate: DataTypes.INTEGER,
  },
  { sequelize, modelName: "queue" }
);

class finished extends Model {}
finished.init(
  {
    hash: DataTypes.STRING,
    plaintext: DataTypes.STRING,
    crackDate: DataTypes.INTEGER,
  },
  { sequelize, modelName: "finished" }
);
//TODO: Make settings table for sequelize
class settings extends Model {}
settings.init(
  {
    settingid: DataTypes.STRING,
    settingvalue: DataTypes.STRING,
    datatype: DataTypes.STRING,
  },
  { sequelize, modelName: "settings" }
);

settings.sync();
finished.sync();
queue.sync();
slaves.sync();
logs.sync();

// Needed functions

function generateAscii() {
  let output = [];
  for (let i = 32; i < 126; i++){
    output.push(String.fromCharCode(i));
  }
  return output;
}

async function log(info) {
  /**
   * receives a log, stores it to the database, and prints it to the display
   */
  let time = Date.now();
  let logText = `[${time}]: ${info}`;
  //database.logs.push(logText);
  const logdata = await logs.create({
    log: info,
    time: time,
  });
  console.log(logText);
}

function checkOldLoads() {
  for (let e in global.work.loads) {
    if (
      global.work.loads[e].time / 1000 + global.settings.loadTimeout <
      Date.now() / 1000
    ) {
      return global.work.loads[e];
    }
  }
  return false;
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

function isIdUnique(id) {
  return slaves.count({ where: { slaveid: id } }).then(count => {
    if (count != 0) {
      return false;
    }
    return true;
  });
}

async function loadtables() {
  let count = await settings.count().then(count => {
    return count;
  });

  if (count !== 0) {
    await settings.findAll().then(table => {
      for (let i in table) {
        if (table[i].datatype === "number") {
          global.settings[table[i].settingid] = parseInt(table[i].settingvalue);
        } else if (table[i].datatype === "string") {
          global.settings[table[i].settingid] = String(table[i].settingvalue);
        }
      }
    });
  } else {
    global.settings = {
      loadTimeout: 60, // Seconds
      blockSize: 131072, // size of each workload to send slaves
      start: 0,
      stop: 131072,
    };
    updatesettings();
  }
}

async function updatesettings() {
  for (i in global.settings) {
    if (
      (await settings.count({ where: { settingid: String(i) } }).then(count => {
        return count;
      })) === 0
    ) {
      settings.create({
        settingvalue: String(global.settings[i]),
        datatype: typeof global.settings[i],
        settingid: String(i),
      });
    } else {
      settings.update(
        {
          settingvalue: String(global.settings[i]),
          datatype: typeof global.settings[i],
        },
        { where: { settingid: String(i) } }
      );
    }
  }
}

global.settings = {};
global.work = {
  hash: "",
  currentCount: 0,
  loads: {},
  chars: generateAscii(),
  averageSpeed: 0,
};

loadtables();

//socket.io
io.on("connection", socket => {
  /**
   * Run when a new web client connects
   */
  //log("New User Connected");
  socket.emit("start", "");
  socket.on("sync", async function(msg) {
    let finishQueue = {};
    let hashQueue = [];
    await finished.findAll().then(hash => {
      for (let i in hash) {
        finishQueue[hash[i].hash] = hash[i].plaintext;
      }
    });
    await queue.findAll().then(hash => {
      for (let i in hash) {
        hashQueue.push(hash[i].hash);
      }
    });
    socket.emit("sync", { finishQueue: finishQueue, hashQueue: hashQueue });
  });
  socket.on("hashSubmit", async function(msg) {
    let count = await finished
      .count({ where: { hash: msg.hash } })
      .then(count => {
        return count;
      });
    console.log(count);
    if (count === 0) {
      if (global.work.hash === "") {
        console.log(msg);
        global.work.hash = msg.hash;
        queue.create({ hash: msg.hash, submitDate: Date.now() });
        io.emit("start", "");
      } else {
        // global.work.hashQueue.push(msg.hash);
        queue.create({ hash: msg.hash.toLowerCase(), submitDate: Date.now() });
      }
      log(`Hash ${msg.hash} enqueued`);
    }
  });
  socket.on("requestID", message => {
    let creating = true;
    while (creating) {
      let newid = Math.floor(Math.random() * 99999999) + 1;
      let slave = slaves.findAll({ where: { slaveid: newid } });
      if (isIdUnique(newid)) {
        slaves.create({ UUID: newid, blocks: 0, avgspeed: 0 });
        socket.emit("setid", { id: newid });
        creating = false;
      }
    }
  });
  socket.on("ping", async function(msg) {
    socket.emit("pingReply", {
      // Sends an init with previous ssids to the new client
      time: Date.getTime(),
    });
  });

  socket.on("finishedWork", async function(msg) {
    let newSpeed =
      global.settings.blockSize /
      (Date.now() / 1000 - global.work.loads[msg.start].time / 1000);
    global.work.currentCount += global.settings.blockSize;
    global.work.averageSpeed = (global.work.averageSpeed + newSpeed) / 2;
    delete global.work.loads[msg.start];

    if (msg.cracked !== false) {
      log(`Hash is ${msg.cracked}`);
      global.settings.start = 0;
      global.settings.stop = global.settings.blockSize - 1;
      //global.work.foundHashes[global.work.hash] = msg.cracked;
      finished.create({
        hash: global.work.hash,
        plaintext: msg.cracked,
        crackDate: Date.now(),
      });
      queue.destroy({ where: { hash: global.work.hash } });

      let payload = {};
      payload[global.work.hash] = msg.cracked;
      io.emit("foundHashes", { hashes: payload });
      if (
        await queue.count().then(count => {
          return count > 0;
        })
      ) {
        console.log("Here");

        global.work.hash = await queue.findOne().then(hash => {
          return hash.hash;
        });

        //global.work.hash = global.work.hashQueue.pop();
      } else {
        global.work.hash = "";
      }
    }
  });
  socket.on("requestWork", async function(msg) {
    if (global.work.hash === "") {
      if (
        await queue.count().then(count => {
          return count > 0;
        })
      ) {
        global.work.hash = await queue.findOne().then(one => {
          return one.hash;
        });
      } else {
        socket.emit("work", "nowork");
      }
    } else {
      let load = checkOldLoads();
      if (load !== false) {
        log("Resending old work");
        load.time = Date.now();
      } else {
        load = {
          hash: global.work.hash,
          start: global.settings.start,
          stop: global.settings.stop,
          time: Date.now(),
        };
        global.settings.start += global.settings.blockSize;
        global.settings.stop += global.settings.blockSize;
      }
      global.work.loads[load.start] = load;
      load.chars = global.work.chars;
      socket.emit("work", load);
    }
  });
});

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function update() {
  while (true) {
    await sleep(1000);
    let level = await getLevel(global.settings.start, global.work.chars.length);

    let speed = global.work.currentCount;
    global.work.currentCount = 0;

    let hash = global.work.hash;
    await io.emit("displayUpdate", {
      totalspeed: speed,
      level: level,
      curhash: hash,
    });
    updatesettings();
  }
}

update();

//Setting up each page

app.get("/", (req, res) => {
  /**
   * When a user connects, they are send the index.html file
   */
  res.sendFile(__dirname + "/public/html/index.html");
});

app.get("*.html", (req, res) => {
  /**
   * When a css file is requested, /public/css is searched
   */
  res.sendFile(__dirname + `/public/html/${req.path.split("/")[1]}`);
  console.log(`/public/html/${req.path.split("/")[1]}`);
});

app.get("*.css", (req, res) => {
  /**
   * When a css file is requested, /public/css is searched
   */
  res.sendFile(__dirname + `/public/css/${req.path.split("/")[1]}`);
  console.log(`/public/css/${req.path.split("/")[1]}`);
});

app.get("*.js", (req, res) => {
  /**
   * when a js file is requested, /public/scripts is searched
   */
  res.sendFile(__dirname + `/public/js/${req.path.split("/")[1]}`);
  console.log(`/public/js/${req.path.split("/")[1]}`);
});

app.use(favicon(__dirname + "/public/images/favicon.png")); // Send favicon when requested

app.use((req, res) => {
  /**
   * Used when requested webpage is not found.
   */
  res.status(404); // set page to 404
  log(
    // Log that a user requested invalid page
    `${req.body.host} connected to the server. They requested ${req.path}, but this page was unavailable.`
  );
  res.send("Error 404"); // Send Error 404 to user
});

http.listen(port, () => console.log(`Running on port ${port}.`));
