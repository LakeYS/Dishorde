const EventEmitter = require("events");
class DemoClient extends EventEmitter {}

const Client = new DemoClient();
exports.client = Client;

Client.connect = () => {
  Client.emit("ready");
};

Client.on("ready", () => {
  console.log("Demo client ready");
});
Client.emit("ready");

Client.exec = (command, callback) => {
  var response = "";
  if(command === "gettime") {
    response = "Day 1, 07:00\n6 days to next horde.";
  }
  else if(command === "version") {
    response = "Game version: Alpha 21.2 (b30) Compatibility Version: Alpha 21.2";
  }
  else if(command === "lp") {
    response = "Total of 0 in the game";
  }

  callback(void 0, response);
};
