const KEY_PREFIX="credit_empire_save_v2_";
const TOKEN_KEY="credit_empire_token";
const USER_KEY="credit_empire_user";

function accountKey(){
	const user=getSession();
	return Number.isInteger(user?.id)&&user.id>0?`${KEY_PREFIX}${user.id}`:null;
}

export function saveGame(game){
	const key=accountKey();
	if(key)localStorage.setItem(key,JSON.stringify(game));
}

export function loadGame(){
	try{
		const key=accountKey();
		const saved=key&&localStorage.getItem(key);
		return saved?JSON.parse(saved):null;
	}catch{return null}
}

export function clearGame(){
	const key=accountKey();
	if(key)localStorage.removeItem(key);
}

export function getSession(){
	try{
		const user=JSON.parse(localStorage.getItem(USER_KEY));
		return Number.isInteger(user?.id)&&user.id>0&&typeof user.username==="string"?user:null;
	}catch{return null}
}

export function getToken(){return localStorage.getItem(TOKEN_KEY)}
export function clearSession(){localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(USER_KEY)}

function tokenMatchesUser(token,user){
	try{
		const payload=token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/");
		const claims=JSON.parse(atob(payload));
		return claims.id===user?.id;
	}catch{return false}
}

async function request(path,options={}){
	const response=await fetch(path,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});
	const data=await response.json();
	if(!response.ok){
		const error=new Error(data.error||"Request failed");
		error.status=response.status;
		throw error;
	}
	return data;
}

function saveAuth(data){
	localStorage.setItem(TOKEN_KEY,data.token);
	localStorage.setItem(USER_KEY,JSON.stringify(data.user));
	return data.user;
}

export async function register(username,password){
	const data=await request("/api/auth/register",{method:"POST",body:JSON.stringify({username,password})});
	return saveAuth(data);
}

export async function login(username,password){
	const data=await request("/api/auth/login",{method:"POST",body:JSON.stringify({username,password})});
	return saveAuth(data);
}

export async function restoreSession(){
	const token=getToken();
	if(!token)throw new Error("Please log in again.");
	let data;
	try{
		data=await request("/api/auth/me",{headers:{Authorization:`Bearer ${token}`}});
	}catch(error){
		if(error.status===401)throw error;
		const session=getSession();
		if(tokenMatchesUser(token,session))return session;
		throw error;
	}
	if(token!==getToken())return null;
	localStorage.setItem(USER_KEY,JSON.stringify(data.user));
	return data.user;
}

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
	if(!token)throw new Error("Please log in again.");
	await request("/api/game",{method:"PUT",headers:{Authorization:`Bearer ${token}`},body:JSON.stringify({game})});
}

export async function transferCredits(username,amount){
	const token=getToken();
	if(!token)throw new Error("Please log in again.");
	return request("/api/transfers",{method:"POST",headers:{Authorization:`Bearer ${token}`},body:JSON.stringify({username,amount})});
}
