import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.dirname(fileURLToPath(import.meta.url));
fs.mkdirSync(path.join(root,"data"),{recursive:true});
const db=new Database(path.join(root,"data","credit-empire.db"));
const JWT_SECRET=process.env.JWT_SECRET||"credit-empire-local-development-secret";
const app=express();
app.use(cors());
app.use(express.json({limit:"1mb"}));

db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  game_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

function tokenFor(user){return jwt.sign({id:user.id,username:user.username},JWT_SECRET,{expiresIn:"30d"})}
function auth(req,res,next){
  try{const header=req.headers.authorization||"";const token=header.startsWith("Bearer ")?header.slice(7):"";req.user=jwt.verify(token,JWT_SECRET);next()}
  catch{return res.status(401).json({error:"Please log in again."})}
}
function validUsername(value){return typeof value==="string"&&/^[a-zA-Z0-9_]{3,24}$/.test(value)}

app.post("/api/auth/register",async(req,res)=>{
  const {username,password}=req.body||{};
  if(!validUsername(username))return res.status(400).json({error:"Username must be 3-24 letters, numbers, or underscores."});
  if(typeof password!=="string"||password.length<6)return res.status(400).json({error:"Password must be at least 6 characters."});
  try{
    const hash=await bcrypt.hash(password,12);
    const result=db.prepare("INSERT INTO users (username,password_hash) VALUES (?,?)").run(username,hash);
    const user={id:Number(result.lastInsertRowid),username};
    res.status(201).json({user,token:tokenFor(user)});
  }catch(error){res.status(error.code==="SQLITE_CONSTRAINT_UNIQUE"?409:500).json({error:error.code==="SQLITE_CONSTRAINT_UNIQUE"?"That username is already taken.":"Could not create account."})}
});

app.post("/api/auth/login",async(req,res)=>{
  const {username,password}=req.body||{};
  const user=db.prepare("SELECT * FROM users WHERE username=?").get(username||"");
  if(!user||!(await bcrypt.compare(password||"",user.password_hash)))return res.status(401).json({error:"Invalid username or password."});
  const safe={id:user.id,username:user.username};res.json({user:safe,token:tokenFor(safe)});
});

app.get("/api/game",auth,(req,res)=>{
  const user=db.prepare("SELECT game_json FROM users WHERE id=?").get(req.user.id);
  res.json({game:user?.game_json?JSON.parse(user.game_json):null});
});
app.put("/api/game",auth,(req,res)=>{
  if(!req.body?.game)return res.status(400).json({error:"Game data is required."});
  db.prepare("UPDATE users SET game_json=? WHERE id=?").run(JSON.stringify(req.body.game),req.user.id);
  res.json({ok:true});
});

app.post("/api/transfers",auth,(req,res)=>{
  const recipientUsername=typeof req.body?.username==="string"?req.body.username.trim():"";
  const amount=Number(req.body?.amount);
  if(!validUsername(recipientUsername))return res.status(400).json({error:"Enter a valid recipient username."});
  if(!Number.isFinite(amount)||amount<=0||Math.round(amount*100)/100!==amount)return res.status(400).json({error:"Enter a positive amount with up to 2 decimals."});

  try{
    const transfer=db.transaction(()=>{
      const sender=db.prepare("SELECT id,username,game_json FROM users WHERE id=?").get(req.user.id);
      const recipient=db.prepare("SELECT id,username,game_json FROM users WHERE username=?").get(recipientUsername);
      if(!recipient)return {error:"That player does not exist.",status:404};
      if(recipient.id===sender.id)return {error:"You cannot transfer Credits to yourself.",status:400};
      if(!sender.game_json)return {error:"Start your game before sending Credits.",status:400};
      if(!recipient.game_json)return {error:"That player has not started a game yet.",status:400};

      const senderGame=JSON.parse(sender.game_json);
      const recipientGame=JSON.parse(recipient.game_json);
      if(Number(senderGame.credits)<amount)return {error:"You do not have enough Credits.",status:400};
      senderGame.credits=Number((Number(senderGame.credits)-amount).toFixed(2));
      recipientGame.credits=Number((Number(recipientGame.credits)+amount).toFixed(2));
      db.prepare("UPDATE users SET game_json=? WHERE id=?").run(JSON.stringify(senderGame),sender.id);
      db.prepare("UPDATE users SET game_json=? WHERE id=?").run(JSON.stringify(recipientGame),recipient.id);
      return {ok:true,recipient:recipient.username,amount,game:senderGame};
    })();
    if(transfer.error)return res.status(transfer.status).json({error:transfer.error});
    res.json(transfer);
  }catch(error){res.status(400).json({error:"Could not complete the transfer."})}
});

const dist=path.join(root,"dist");
app.use(express.static(dist));
app.get(/^(?!\/api).*/,(_,res)=>res.sendFile(path.join(dist,"index.html")));

const port=process.env.PORT||3001;
app.listen(port,()=>console.log(`Credit Empire listening on port ${port}`));

