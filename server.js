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

const distPath = path.join(root, "dist");

app.use(express.static(distPath));

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

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Credit Empire API listening on port ${PORT}`);
});
