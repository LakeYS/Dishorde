import net from "net";
import EventEmitter from "events";

/**
 * Line-ending matcher regex.
 */
const lineMarker = /(.+)(\n|\r\n)/g;

/**
 * Filter for non-alphanumeric characters that we sometimes see from the game (such as password error responses).
 */
const sanitizeMessageFilter = /[A-Za-z0-9 ,:*]+/;

/**
 * The string we expect from the game that indicates a password prompt.
 */
const passwordPrompt = "Please enter password:";

/**
 * String from the game indicating a failed password attempt.
 */
const passwordPromptFail = "Password incorrect, please enter password:";

/**
 * String from the game indicating a successful login. It can be one of these depending on the server's config.
 * (if no password is configured, we don't see 'Logon successful', etc.)
 */
const passwordPromptSuccess = [
  "*** Connected with 7DTD server",
  "Logon successful"
];

class SevenDaysClient extends EventEmitter {
  netClient = new net.Socket();

  connected = false;
  messageBuffer = "";

  #processBuffer() {
    const lines = this.messageBuffer.match(lineMarker);

    if(!lines) return;

    let newBuffer = "";
    // Loop through lines in the buffer. Send complete lines and leave the rest.
    lines.forEach((value) => {
      const match = value.match(lineMarker);
      
      // If this value does not contain the line ending, it is an incomplete line. Send back to the buffer.
      if(!match) {
        newBuffer = value;
        return;
      }

      this.emit("data", value);
      this.messageBuffer = newBuffer;
    });
  }

  constructor() {
    super();

    this.netClient.on("error", (error) => {
      this.connected = false;
      this.emit("error", error);
    });

    this.netClient.on("close", () => {
      this.connected = false;
      this.emit("close");
    });

    this.netClient.on("data", (data) => {
      const text = data.toString();
      
      if(!this.connected) {
        const textMatch = text.match(sanitizeMessageFilter);
  
        if(textMatch == null || textMatch.length === 0) {
          return;
        }
  
        const plain = textMatch[0];

        if(plain === passwordPrompt) {
          this.netClient.write(this.password + "\n");
        }

        if(plain === passwordPromptFail) {
          this.netClient.end();
          this.emit("error", new Error("The password specified in config does not match the one on the server. Please double-check it and try again."));
        }

        for (const password of passwordPromptSuccess) {
          if(plain === password) {
            this.connected = true;
            this.emit("ready");
            break;
          }
        }

        // Take no other action until we have provided a password.
        return;
      }

      // Receive and process data. Oftentimes these will be incomplete lines, so processBuffer will break it down line-by-line.
      this.messageBuffer = this.messageBuffer + data.toString();
      this.#processBuffer();
    })
  }

  /**
   * Connect to the game using the given params.
   * @param {object} params 
   */
  connect(params) {
    if(typeof params.host !== "string") {
      throw new Error("Missing IP.");
    }
  
    if(typeof params.port !== "number") {
      throw new Error("Missing IP.");
    }

    if(typeof params.password !== "string") {
      throw new Error("Missing password.");
    }

    this.password = params.password;
  
    this.netClient.connect(params.port, params.host);
  }

  /**
   * 
   * @param {string} command 
   * @param {(error: Error) => void} callback 
   */
  exec(command, callback) {
    this.netClient.write(`${command}\n`, (err) => callback(err));
  }

  end() {
    this.netClient.end();
  }
}

export default SevenDaysClient;
