const fs = require("fs");

class Logger {
  constructor() {
    fs.writeFile("./console.log", "", () => { console.log("Logs initialized"); });

    var parentLog = console.log;
    var parentWarn = console.warn;
    var parentError = console.error;
    console.log = (msg) => { this.log(msg, parentLog); };
    console.warn = (msg) => { this.log(msg, parentWarn); };
    console.error = (msg) => { this.log(msg, parentError); };
  }

  log(msg, parent) {
    fs.appendFile("./console.log", msg, (err) => {
      if(err) {
        return parent(err);
      }
    });

    return parent(msg);
  }
}

module.exports = Logger;