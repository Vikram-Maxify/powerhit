import { io } from "socket.io-client";

export const socket = io("http://localhost:5007", {
  withCredentials: true,
  autoConnect: true,
});