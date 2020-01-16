
let Sha256 = require('./sha256');
var us = require('microtime');

let time1 = us.now();
Sha256.hash("Hello World");
let time2 = us.now();

console.log(time1);
console.log(time2);
console.log(time2-time1);
