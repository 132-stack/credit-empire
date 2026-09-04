const KEY_PREFIX="credit_empire_save_v2_";
const TOKEN_KEY="credit_empire_token";
function accountKey(){
	const user=getSession();
	return user?.id!=null?`${KEY_PREFIX}${user.id}`:user?.username?`${KEY_PREFIX}${encodeURIComponent(user.username.toLowerCase())}`:null;
}
export function saveGame(game){ const key=accountKey(); if(key)localStorage.setItem(key,JSON.stringify(game)); }
export function loadGame(){ try { const key=accountKey(); const x=key&&localStorage.getItem(key); return x?JSON.parse(x):null } catch { return null } }
export function clearGame(){ const key=accountKey(); if(key)localStorage.removeItem(key); }
export function getSession(){try{return JSON.parse(localStorage.getItem("credit_empire_user"))||null}catch{return null}}
export function getToken(){return localStorage.getItem(TOKEN_KEY)}
export function clearSession(){localStorage.removeItem(TOKEN_KEY);localStorage.removeItem("credit_empire_user")}
async function request(path,options={}){const response=await fetch(path,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});const data=await response.json();if(!response.ok){const error=new Error(data.error||"Request failed");error.status=response.status;throw error}return data}
export async function register(username,password){const data=await request("/api/auth/register",{method:"POST",body:JSON.stringify({username,password})});localStorage.setItem(TOKEN_KEY,data.token);localStorage.setItem("credit_empire_user",JSON.stringify(data.user));return data.user}
export async function login(username,password){const data=await request("/api/auth/login",{method:"POST",body:JSON.stringify({username,password})});localStorage.setItem(TOKEN_KEY,data.token);localStorage.setItem("credit_empire_user",JSON.stringify(data.user));return data.user}
export async function loadCloudGame(){
	const token=getToken();
	if(!token)throw new Error("Please log in again.");
	try{
		const data=await request("/api/game",{headers:{Authorization:`Bearer ${token}`}});
		return token===getToken()?(data.game||loadGame()):null;
	}catch(error){
		if(error.status===401)throw error;
		const backup=loadGame();
		if(backup)return backup;
		throw error;
	}
}
export async function saveCloudGame(game){
	const token=getToken();
	if(token)await request("/api/game",{method:"PUT",headers:{Authorization:`Bearer ${token}`},body:JSON.stringify({game})});
}
export async function transferCredits(username,amount){return request("/api/transfers",{method:"POST",headers:{Authorization:`Bearer ${getToken()}`},body:JSON.stringify({username,amount})})}
