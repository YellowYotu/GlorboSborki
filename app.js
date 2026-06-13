
// Drop-in hotfix for Glorbo

function safeAvatar(name){
  const n = (name || "Guest").trim();
  return n.length ? n.charAt(0).toUpperCase() : "?";
}

function applyUser(user){
  const nickname = user?.nickname || "Guest";
  const role = (user?.role)
    || (nickname.toLowerCase() === "yellowyotu" ? "Creator" : "Player");

  const u=document.querySelector(".username-text");
  const a=document.querySelector(".user-avatar");
  const r=document.querySelector(".acc-role");
  const n=document.querySelector(".acc-name");

  if(u){u.textContent=nickname;}
  if(a){a.textContent=safeAvatar(nickname);}
  if(r){r.textContent=role;}
  if(n){n.textContent=nickname;}
}

async function registerUser(db, nickname, password, setDoc, doc, serverTimestamp){
  const role =
    nickname.toLowerCase()==="yellowyotu"
      ? "Creator"
      : "Player";

  await setDoc(
    doc(db,"users",nickname.toLowerCase()),
    {
      nickname,
      password,
      role,
      createdAt: serverTimestamp()
    }
  );
}

const STORAGE_BUCKET = "glorbosborki.appspot.com";

// Firebase Storage rules:
// allow read, write: if true;
