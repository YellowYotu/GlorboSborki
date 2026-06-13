# Glorbo v1.0.0 — Closed Test

## GitHub Releases версия

- Firebase Storage больше НЕ используется.
- Файлы сборок загружаются в GitHub Releases через Vercel API.
- Firestore остаётся для users/messages/localBuilds/serverBuilds/buildRequests.
- Лимит файла на сайте: 1 GB.
- Разрешены только .zip, .rar, .7z.
- Темы, кастом, чат, аккаунты и заявки оставлены.

## Vercel Environment Variables

Project → Settings → Environment Variables:

```text
GITHUB_TOKEN=github_pat_...
GITHUB_OWNER=YellowYotu
GITHUB_REPO=GlorboSborki
```

GitHub token classic scopes:
```text
repo
workflow
```

## Важно

Код отправляет файлы через `/api/upload-build` в GitHub Releases.
Если очень большой файл не грузится, это может быть лимит Vercel на размер запроса, не ошибка сайта.

## Firebase

Нужен только Firestore. Firebase Storage можно не включать.

## Firestore test rules

```txt
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```


Upload limit changed to 100 MB to avoid Vercel 413.