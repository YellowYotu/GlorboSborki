Glorbo v1.0.0 - Closed Test

Files:
- index.html
- style.css
- app.js

Firebase collections used:
- users
- localBuilds
- buildRequests
- serverBuilds
- messages

Firebase Storage paths:
- builds/private/{userId}/...
- builds/requests/{userId}/...

Important:
This version uses nickname + password stored in Firestore with SHA-256 hash.
For a real public site, Firebase Authentication is safer.

For quick testing, Firebase rules can be open, but do not keep them open forever.

Firestore test rules:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}

Storage test rules:
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
