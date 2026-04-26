# Firebase Security Rules & Configuration

Here are the rules to configure in your Firebase Console for the Painting Works Management App.

## Firestore Security Rules
Go to **Firestore Database** > **Rules** and paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is signed in
    function isSignedIn() {
      return request.auth != null;
    }

    // Helper to check if user is part of the work (if implementing teams)
    // function isPainterOfWork(workId) {
    //   return request.auth.uid in get(/databases/$(database)/documents/works/$(workId)).data.painters;
    // }

    // Works Collection
    match /works/{workId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn();
      allow delete: if false;

      // Daily Logs Subcollection
      match /daily_logs/{logId} {
        allow read, write: if isSignedIn();
      }
    }

    // Photos Collection
    match /photos/{photoId} {
      allow read, create: if isSignedIn();
    }
  }
}
```

## Storage Security Rules
Go to **Storage** > **Rules** and paste this:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Firestore Indexes
The queries used in `DashboardScreen` (`orderBy('createdAt', 'desc')`) might require a composite index if you add more `where` clauses.
For now, the single field index on `createdAt` is automatically created by Firestore.
