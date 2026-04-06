# Firestore Security Rules

Below is an updated ruleset for the new task management system while preserving the existing collections already used in the project.

## Firestore rules

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function userDoc(uid) {
      return get(/databases/$(database)/documents/users/$(uid));
    }

    function isAdmin() {
      return signedIn() && userDoc(request.auth.uid).data.role == 'admin';
    }

    function isSelf(userId) {
      return signedIn() && request.auth.uid == userId;
    }

    function taskDoc(taskId) {
      return get(/databases/$(database)/documents/tasks/$(taskId));
    }

    function relatedTask(taskId) {
      let task = taskDoc(taskId).data;
      return signedIn() && (
        isAdmin() ||
        task.createdBy == request.auth.uid ||
        request.auth.uid in task.assigneeIds ||
        request.auth.uid in task.watcherIds
      );
    }

    function canCreateTask() {
      return signedIn();
    }

    function canUpdateTaskContent() {
      return signedIn() && (
        isAdmin() || resource.data.createdBy == request.auth.uid
      );
    }

    function canUpdateTaskStatus() {
      return signedIn() && (
        isAdmin() || request.auth.uid in resource.data.assigneeIds
      );
    }

    match /users/{userId} {
      allow read: if signedIn() && (isSelf(userId) || isAdmin());
      allow create: if signedIn() && isSelf(userId);
      allow update: if signedIn() && (isSelf(userId) || isAdmin());
      allow delete: if signedIn() && isAdmin();
    }

    match /tasks/{taskId} {
      allow read: if signedIn() && (
        isAdmin() ||
        resource.data.createdBy == request.auth.uid ||
        request.auth.uid in resource.data.assigneeIds ||
        request.auth.uid in resource.data.watcherIds
      );

      allow create: if canCreateTask() &&
        request.resource.data.createdBy == request.auth.uid;

      allow update: if canUpdateTaskContent() || canUpdateTaskStatus();
      allow delete: if signedIn() && isAdmin();
    }

    match /task_comments/{commentId} {
      allow read: if relatedTask(resource.data.taskId);
      allow create: if signedIn() && relatedTask(request.resource.data.taskId);
      allow update, delete: if signedIn() && (
        isAdmin() || resource.data.createdBy == request.auth.uid
      );
    }

    match /task_activities/{activityId} {
      allow read: if relatedTask(resource.data.taskId);
      allow create: if signedIn() && relatedTask(request.resource.data.taskId);
      allow update, delete: if signedIn() && isAdmin();
    }

    match /task_meta/{docId} {
      allow read: if signedIn();
      allow write: if signedIn() && isAdmin();
    }

    match /attendance/{recordId} {
      allow read: if signedIn() && (isAdmin() || resource.data.trainerId == request.auth.uid);
      allow create: if signedIn() && request.resource.data.trainerId == request.auth.uid;
      allow update: if signedIn() && (isAdmin() || (resource.data.trainerId == request.auth.uid && resource.data.status == 'pending'));
    }

    match /students/{studentId} {
      allow read, write: if signedIn() && isAdmin();
    }
  }
}
```

## Storage rules for task attachments

Apply this under Firebase Storage > Rules:

```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function signedIn() {
      return request.auth != null;
    }

    function userDoc(uid) {
      return firestore.get(/databases/(default)/documents/users/$(uid));
    }

    function isAdmin() {
      return signedIn() && userDoc(request.auth.uid).data.role == 'admin';
    }

    match /task-attachments/{taskId}/{allPaths=**} {
      allow read: if signedIn();
      allow write: if signedIn();
      allow delete: if signedIn() && isAdmin();
    }
  }
}
```

## Notes

- Admin can view and manage all tasks and users.
- Normal users can only read tasks related to them: creator, assignee, or watcher.
- Normal users can create tasks.
- Creator can edit task content.
- Assignee can update status.
- All comments and activities are restricted to related users only.

## Recommended indexes

Create these composite indexes if Firebase prompts for them:

- `tasks`: `createdBy ASC, updatedAt DESC`
- `tasks`: `assigneeIds ARRAY, updatedAt DESC`
- `tasks`: `watcherIds ARRAY, updatedAt DESC`
- `task_comments`: `taskId ASC, createdAt ASC`
- `task_activities`: `taskId ASC, createdAt DESC`
