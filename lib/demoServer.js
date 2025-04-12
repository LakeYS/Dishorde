import EventEmitter from "events";

class DemoClient extends EventEmitter {
  constructor() {
    super();

    this.on("ready", () => {
      console.log("Demo client ready");
    });
  }

  connect() {
    this.emit("ready");
  }

  exec(command, callback) {
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
  }
}

export default DemoClient;
