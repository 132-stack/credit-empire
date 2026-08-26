const KEY="credit_empire_save_v1";
const TOKEN_KEY="credit_empire_token";
export function saveGame(game){ localStorage.setItem(KEY,JSON.stringify(game)); }
export function loadGame(){ try { const x=localStorage.getItem(KEY); return x?JSON.parse(x):null } catch { return null } }
export function clearGame(){ localStorage.removeItem(KEY); }
export function getSession(){try{return JSON.parse(localStorage.getItem("credit_empire_user"))||null}catch{return null}}
export function getToken(){return localStorage.getItem(TOKEN_KEY)}
export function clearSession(){localStorage.removeItem(TOKEN_KEY);localStorage.removeItem("credit_empire_user")}
async function request(path,options={}){const response=await fetch(path,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});const data=await response.json();if(!response.ok)throw new Error(data.error||"Request failed");return data}
export async function register(username,password){const data=await request("/api/auth/register",{method:"POST",body:JSON.stringify({username,password})});localStorage.setItem(TOKEN_KEY,data.token);localStorage.setItem("credit_empire_user",JSON.stringify(data.user));return data.user}
export async function login(username,password){const data=await request("/api/auth/login",{method:"POST",body:JSON.stringify({username,password})});localStorage.setItem(TOKEN_KEY,data.token);localStorage.setItem("credit_empire_user",JSON.stringify(data.user));return data.user}
export async function loadCloudGame(){const data=await request("/api/game",{headers:{Authorization:`Bearer ${getToken()}`}});return data.game}
export async function saveCloudGame(game){if(getToken())await request("/api/game",{method:"PUT",headers:{Authorization:`Bearer ${getToken()}`},body:JSON.stringify({game})})}
export async function transferCredits(username,amount){return request("/api/transfers",{method:"POST",headers:{Authorization:`Bearer ${getToken()}`},body:JSON.stringify({username,amount})})}
