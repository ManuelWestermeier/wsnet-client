const random = (): string => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32 + "";

function randomBytes(l: number): string {
    let rand = "";
    for (let index = 0; index < l; index++) {
        rand += random()[5];
    }
    return rand;
}

interface ClientOptions {
    url: string;
    params?: any;
}

interface ClientObj {
    on: {
        get: Record<string, (data?: any) => any>;
        say: Record<string, Array<(data?: any) => void>>;
    };
    getPromises: Record<string, (data?: any) => void>;
}

class Client {
    #rawSocket: WebSocket;
    #obj: ClientObj = {
        on: {
            get: {},
            say: {}
        },
        getPromises: {}
    };

    constructor(url: string, params?: any) {
        this.#rawSocket = new WebSocket(url);

        this.#rawSocket.onclose = (event: CloseEvent) => {
            this.onclose(event);
        };

        this.#rawSocket.onerror = (event: Event) => {
            this.onerror(event);
        };

        this.#rawSocket.onopen = () => {
            if (params) {
                this.#send("params", false, params, false);
            }
            this.onopen();
        };

        this.#rawSocket.onmessage = (event: MessageEvent) => {
            this.#onmessage(event);
        };
    }

    getState(): number {
        return this.#rawSocket.readyState;
    }

    close(): void {
        this.#rawSocket.close();
    }

    // Normal listeners

    onSay(key: string, handler: (data?: any) => void, replace = true): void {
        if (replace || !this.#obj.on.say[key]) {
            this.#obj.on.say[key] = [handler];
        } else {
            this.#obj.on.say[key].push(handler);
        }
    }

    onGet(key: string, handler: (data?: any) => any): void {
        this.#obj.on.get[key] = handler;
    }

    // Normal methods

    say(key: string, data: any): void {
        this.#send("say", key, data, false);
    }

    get(key: string, data: any): Promise<any> {
        const id = randomBytes(8);

        return new Promise((resolve) => {
            this.#obj.getPromises[id] = (res: any) => {
                delete this.#obj.getPromises[id];
                resolve(res);
            };

            this.#send("get", key, data, id);
        });
    }

    // Send and onmessage

    #onmessage({ data }: MessageEvent): void {
        try {
            const parsedData = JSON.parse(data);

            // onSay
            if (parsedData?.method === "say" && parsedData?.key) {
                if (this.#obj.on.say?.[parsedData.key]) {
                    this.#obj.on.say[parsedData.key].forEach(fn => fn(parsedData?.cont));
                }
            }
            // onGet
            else if (parsedData?.method === "get" && parsedData?.key && parsedData?.id) {
                const sendBack = (cont: any) => {
                    this.#send("getback", false, cont, parsedData.id);
                };

                if (!this.#obj.on.get[parsedData?.key]) {
                    return sendBack("not found");
                }

                const res = this.#obj.on.get[parsedData?.key](parsedData?.cont);

                if (res instanceof Promise) {
                    res.then(sendBack);
                } else {
                    sendBack(res);
                }
            }
            // For getting data back
            else if (parsedData?.method === "getback" && parsedData?.id) {
                if (this.#obj.getPromises?.[parsedData.id]) {
                    this.#obj.getPromises?.[parsedData.id]?.(parsedData?.cont);
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    #send(method: string, key: string | false, cont: any, id: string | false): void {
        const data: any = {
            method,
            cont
        };

        if (key) data.key = key;
        if (id) data.id = id;

        this.#rawSocket.send(JSON.stringify(data));
    }

    // Other handlers

    onclose(event: CloseEvent): void { }
    onopen(): void { }
    onerror(event: Event): void { }
    onend(): void { }
}

export default Client;

export function waitForClient(client = new Client("ws://example.com")): Promise<boolean> {
    return new Promise(resolve => {
        client.onopen = () => resolve(true);
        client.onclose = () => resolve(false);
    });
}