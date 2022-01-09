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

    this.lastLog = null;
    this.logDuplicates = 0;
  }

  log(msg, parent) {
    // Spam handling - Display (x[num of logs]) instead of repeating the line.
    if(this.lastLog === msg) {
      this.logDuplicates++;

      return parent(`(x${this.logDuplicates+1})`);
    }

    // If we just finished logging duplicates, append them to the file.
    var fileMsg = `${msg}\n`;
    if(this.logDuplicates > 0) {
      fileMsg = `(x${this.logDuplicates+1})\n`;
    }
    this.lastLog = msg;
    this.logDuplicates = 0;

    // Append logs to file
    fs.appendFile("./console.log", fileMsg, (err) => {
      if(err) {
        return parent(err);
      }
    });

    return parent(msg);
  }
}

module.exports = Logger;