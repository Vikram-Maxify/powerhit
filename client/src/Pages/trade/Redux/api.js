import axios from "axios";
 
const api = axios.create({
    baseURL: "http://localhost:4000/api",
    // baseURL: "/api",
});


export default api;
export const host = "http://localhost:5007";
// export const host = "/";