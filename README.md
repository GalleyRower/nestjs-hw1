# Profiles API

REST API на NestJS: регистрация и вход, свой профиль, список пользователей, обновление и удаление профиля, выход.

Стек: Node.js, TypeScript, NestJS, PostgreSQL, TypeORM, JWT + Passport.

## Запуск с нуля

Нужны Node.js 24 и Docker.

1. Поставь зависимости

   ```bash
   npm ci
   ```

2. Создай `.env` и заполни `DB_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`. Секреты разные и не короче 32 символов

   ```bash
   cp .env.example .env
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. Подними базу

   ```bash
   docker compose up -d --wait
   ```

4. Накати миграции

   ```bash
   npm run migration:run
   ```

5. Запусти приложение

   ```bash
   npm run start:dev
   ```

API - http://localhost:3000, Swagger - http://localhost:3000/docs. Если порт 5432 занят, поменяй `DB_PORT` в `.env` до шага 3.

## Маршруты

| Метод  | Путь                 | Что делает                           | Доступ         |
| ------ | -------------------- | ------------------------------------ | -------------- |
| POST   | /auth/register       | регистрация                          | все            |
| POST   | /auth/login          | вход по логину и паролю              | все            |
| POST   | /auth/refresh        | новая пара токенов                   | refresh cookie |
| POST   | /auth/logout         | выход, удаляет refresh               | refresh cookie |
| GET    | /profile/my          | свой профиль                         | access         |
| PATCH  | /profile/my          | обновить свой профиль                | access         |
| PATCH  | /profile/my/password | сменить пароль, завершает все сессии | access         |
| DELETE | /profile/my          | удалить свой профиль                 | access         |
| GET    | /users               | список, `page`, `limit`, `login`     | access         |

## Токены

- access приходит в теле ответа, передается в `Authorization: Bearer <token>`
- refresh приходит в HttpOnly cookie с `Path=/auth`, в базе лежит только его sha256
- refresh одноразовый, после обновления старый не работает
- выход завершает только текущую сессию, смена пароля и удаление - все
- после удаления профиля access перестает работать сразу, после выхода - когда истечет

## Ошибки

Формат один для всех, `details` есть только у ошибок валидации:

```json
{
  "statusCode": 400,
  "message": "Проверь данные запроса",
  "details": [{ "field": "age", "messages": ["Возраст от 1 до 120"] }],
  "path": "/auth/register",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

## Решения, которых нет в т/з

- refresh хэшируется sha256, а не bcrypt: по такому хэшу сессия находится одним запросом. К тому же bcrypt смотрит только первые 72 байта, а у токенов одного пользователя они совпадают
- пароль меняется отдельным маршрутом и только со старым паролем
- логин и email без учета регистра, в базе хранятся в нижнем регистре
- в списке нет email, `login` ищет по части логина
- логин и email удаленного пользователя можно занять заново
- если база не ответила за `DB_STATEMENT_TIMEOUT_MS`, ответ 503
- истекшие сессии из базы пока не удаляются

## Команды

```bash
npm test
npm run test:e2e          # нужен запущенный Docker, база поднимается через Testcontainers
npm run lint
npm run typecheck
npm run format
npm run migration:revert
```
