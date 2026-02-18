import io from "socket.io-client";
import { socketURL } from "./backendServerBaseURL";

const noopSocket = { on: () => {}, emit: () => {}, off: () => {} };

export default class socketHelper {
  constructor() {
    if (socketURL && socketURL.includes("localhost")) {
      this.socket = noopSocket;
      return;
    }
    try {
      this.socket = io(socketURL, {
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 3,
        timeout: 5000,
        transports: ["websocket", "polling"],
        query: { type: "kiosk" },
      });
    } catch (e) {
      this.socket = noopSocket;
    }
  }
}
