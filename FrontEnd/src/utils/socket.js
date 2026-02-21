// import { BASE_URL } from "./constants";
// import io from "socket.io-client"
// export const createSocketConnection = () => {
    
//   return io(BASE_URL);
// };

import io from "socket.io-client";
import { BASE_URL } from "./constants";

export const createSocketConnection = () => {
  if (location.hostname === "localhost") {
    return io(BASE_URL);
  } else {
    return io("/", { path: "/api/socket.io" });
  }
};