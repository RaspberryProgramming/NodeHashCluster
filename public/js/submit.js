let socket = io();

function submitHash(hash) {
  let validchars = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "0",
  ];
  for (let i in hash.value) {
    console.log(validchars.indexOf(hash.value[i]));
    if (validchars.indexOf(hash.value[i]) === -1) {
      return false;
    }
  }
  if (hash != "") {
    console.log(hash.value);
    socket.emit("hashSubmit", { hash: hash.value });

    return true;
  } else {
    return false;
  }
}
