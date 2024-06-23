# wsnet-client

# Basic setup

## Client

```js
import Client from "WSNET_Framework/_client/index.js";

//create the conection
//websocket host | params
const API = new Client("ws:localhost:8080", { user: "xxx" });
//set listener for the echo request
API.onGet("get", (data) => {
  return data * 2;
});
//set listener for the say message
API.onSay("echo", (data) => {
  console.log(data);
});
//onopen
API.onopen = async () => {
  //post the echo command to the server
  API.say("echo", "echo 1");
  //log & get the value
  console.log(await API.get("get", 10));
};
```