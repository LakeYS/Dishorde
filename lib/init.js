import {request} from "https";
import {createServer} from "net";
import semver from "semver-compare";

class DishordeInitializer {
  constructor(packageData, config, configPrivate) {
    // # Version Check # //
    if(config["disable-version-check"]) {
      return;
    }

    var options = {
      host: "api.github.com",
      path: `/repos/${configPrivate.githubAuthor}/${configPrivate.githubName}/releases/latest`,
      method: "GET",
      headers: {"user-agent":configPrivate.githubName}
    };

    var input = "";
    var req = request(options, (res) => {
      res.on("data", (data) => {
        input = input + data; // Combine the data
      });
      res.on("error", (err) => {
        console.log(err);
      });
      res.on("uncaughtException", (err) => {
        console.log(err);
      });

      // Note that if there is an error while parsing the JSON data, the bot will crash.
      res.on("end", () => {
        if(typeof input !== "undefined") {
          this.parseVersion(JSON.parse(input.toString()), semver, packageData, configPrivate);
        }
        else {
          console.log(input); // Log the input on error
          console.log("WARNING: Unable to parse version data.");
        }
      });
    });

    req.end();
    process.nextTick(() => {
      req.on("error", (err) => {
        console.log(err);
        console.log("ERROR: Unable to query version data.");
      });
    });

    if(config["allow-multiple-instances"] !== true && typeof configPrivate.socketPort !== "undefined") {
      var server  = createServer()
        .on("error", (error) => {
          if(error.code === "EADDRINUSE") {
            console.error("\x1b[31mERROR: It appears that there is another instance of Dishorde already running. Please make sure only one instance of this application is running at a time.\n\nTo bypass this, enable \"allow-multiple-instances\" in the config.");
            process.exit();
          }
          else {
            console.warn(`WARNING: An unknown error has occurred. (${error.message})`);
          }
        });

      server.listen(configPrivate.socketPort);
    }
  }

  parseVersion(json, semver, pjson, configPrivate) {
    if(typeof json.tag_name === "undefined") {
      console.log(json);
      console.warn("WARNING: Unable to parse version data.");
    }
    else {
      const release = json.tag_name.replace("v",""); // Mark the release
  
      // Compare this build's version to the latest release.
      var releaseRelative = semver(pjson.version, release);
  
      if(releaseRelative === 1) {
        console.log(`********\nNOTICE: You are currently running\x1b[1m v${pjson.version}\x1b[0m. This build is considered unstable.\nCheck here for the latest stable versions of this script:\n\x1b[1m https://github.com/${configPrivate.githubAuthor}/${configPrivate.githubName}/releases \x1b[0m\n********`);
      }
  
      if(releaseRelative === -1) {
        console.log(`********\nNOTICE: You are currently running\x1b[1m v${pjson.version}\x1b[0m. A newer version is available.\nCheck here for the latest version of this script:\n\x1b[1m https://github.com/${configPrivate.githubAuthor}/${configPrivate.githubName}/releases \x1b[0m\n********`);
      }
    }
  }
}

export default DishordeInitializer;
