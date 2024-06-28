# wsnet-client

## Basic setup

```js
import Client from "wsnet-client";

//create the conection
//websocket host | params (for backend auth)
const API = new Client("ws://localhost:8080", { user: "xxx" });
//set listener for the echo request
API.onGet("get", (data) => {
  return data * 2;
});
//set listener for the say message (it can return a promise too)
API.onSay("echo", async (data) => {
  console.log(data);
}/*replace (default:true)*/);
//onopen
API.onopen = async () => {
  //post the echo command to the server
  //no return
  API.say("echo", "echo 1");
  
  //log & get the value
  //promise<value> return
  console.log(await API.get("get", 10));
};
```

## you can await a client or use it in react too

[wsent-client-react](https://www.npmjs.com/package/wsnet-client-react)

```js
import Client, { waitForClient } from "wsnet-client";

const client =  new Client("ws://localhost:8080", { user: "xxx" })

//set the get and set handler bevor passing the client to the wait function

client.onGet("x", data => console.log(data))

client.onSay("y", data => console.log(data))

//argument: the client to wait
const API = await waitForClient(client);

console.log(await API.get("hello-world"))
```

## Serverside

[wsent-server](https://www.npmjs.com/package/wsnet-server)