var random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32 + "";

function randomBytes(l) {
    var rand = "";
    for (let index = 0; index < l; index++) {
        rand += random()[5];
    }
    return rand;
}

class Client {

    #rawSocket = false

    #obj = {
        on: {
            get: {},
            say: {}
        },
        getPromises: {}
    }

    constructor(url, params) {

        this.#rawSocket = new WebSocket(url)

        this.#rawSocket.onclose = code => {
            this.onclose(code)
        }

        this.#rawSocket.onerror = err => {
            this.onerror(err)
        }

        this.#rawSocket.onopen = () => {
            if (params)
                this.#send("params", false, params, false)
            this.onopen()
        }

        this.#rawSocket.onmessage = chunk => {
            this.#onmessage(chunk)
        }

    }

    getState() { return this.#rawSocket.readyState; }

    close() { this.#rawSocket.close() }

    //noraml listeners

    onSay(key, handler, replace = true) {

        if (replace || !this.#obj.on.say[key])
            this.#obj.on.say[key] = [handler];
        else this.#obj.on.say[key].push(handler);

    }

    onGet(key, handler) {

        this.#obj.on.get[key] = handler;

    }

    //Normal Methodas

    say(key, data) {

        this.#send("say", key, data, false);

    }

    get(key, data) {

        var id = randomBytes(8);

        return new Promise((reslove) => {

            this.#obj.getPromises[id] = res => {
                delete this.#obj.getPromises[id];
                reslove(res);
            };

            this.#send("get", key, data, id)

        })

    }

    //Send and Onmessage

    #onmessage({ data }) {

        try {

            var data = JSON.parse(data);

            //onSay
            if (data?.method == "say" && data?.key) {
                if (this.#obj.on.say?.[data.key])
                    this.#obj.on.say[data.key].forEach(fn => fn(data?.cont))
            }
            //onGet
            else if (data?.method == "get" && data?.key && data?.id) {

                const sendBack = cont => {
                    this.#send("getback", false, cont, data.id)
                }

                if (!this.#obj.on.get[data?.key])
                    return sendBack("not found")

                var res = this.#obj.on.get[data?.key](data?.cont)

                if (res instanceof Promise) {
                    res.then(res => sendBack(res))
                } else {
                    sendBack(res)
                }

            }
            //For getting data Back
            else if (data?.method == "getback" && data?.id) {
                if (this.#obj.getPromises?.[data.id])
                    this.#obj.getPromises?.[data.id]?.(data?.cont);
            }

        } catch (error) { console.log(error) }

    }

    #send(method, key, cont, id) {

        var data = {
            method,
            cont
        }

        if (key) data.key = key
        if (id) data.id = id;

        this.#rawSocket.send(JSON.stringify(data))

    }

    //Other Handlers

    onclose() { }
    onopen() { }
    onerror() { }
    onend() { }

}

export default Client;

export function waitForClient(client = new Client()) {
    return new Promise(res => {
        client.onopen = () => res(true)
        client.onclose = () => res(false)
    })
}