# Glorbo v1.0.0 — Closed Test

## Что починено

- Полный проект заново, без старого hotfix-мусора.
- `index.html` подключает правильный файл: `app.js`.
- Логин и регистрация снова работают через Firestore.
- Firebase Authentication НЕ нужен.
- Никнейм + пароль сохраняются в `users/{nicknameLowerCase}`.
- Старые аккаунты читаются.
- `YellowYotu` автоматически получает роль `Creator`.
- Если у `YellowYotu` в Firestore нет роли, сайт сам допишет `role: "Creator"` при входе/restore.
- Нет падения `charAt`, если ник пустой/старый session object кривой.
- Личные сборки видны только владельцу.
- Серверные сборки видны всем.
- Заявки на серверные сборки видны только Creator.
- Чат realtime.
- Сборки/requets/messages обновляются через `onSnapshot`.
- Лимит файла: 1 GB.
- Разрешены только `.zip`, `.rar`, `.7z`.
- Версия: `v1.0.0 — Closed Test`.
- Языки: русский/английский.

## Что включить в Firebase

Нужны только:

1. Firestore Database
2. Storage

Firebase Authentication не нужен.

## Firestore test rules

Firebase Console → Firestore Database → Rules:

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

## Storage test rules

Firebase Console → Storage → Rules:

```txt
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

## Важно

Это тестовые правила. Они открытые. Для закрытого теста нормально, но для публичного сайта надо закрывать.

## Если загрузка падает CORS/403

Почти всегда это не CORS, а Storage rules не опубликованы или Storage не включен.

Проверь:
- Storage включен.
- Storage rules опубликованы.
- В `app.js` `storageBucket` совпадает с Firebase Project settings.
- Если в настройках Firebase указан другой bucket, замени его в `app.js`.

Сейчас стоит:

```js
storageBucket: "glorbosborki.firebasestorage.app"
```

Если у тебя в Firebase написано `glorbosborki.appspot.com`, замени на него.


## Темы и кастом

Добавлены обратно красивые темы:
- Dark
- Orange
- Violet
- Ocean
- Forest
- Sunset
- Ice
- Light

Добавлена кастом-вкладка:
- цвет фона страницы;
- цвет сайдбара;
- цвет карточек;
- цвет полей;
- цвет текста;
- цвет акцента;
- включение/выключение обводки;
- цвет обводки;
- толщина обводки;
- скругление карточек;
- скругление кнопок;
- скругление полей.
