# Profiles API

REST API на NestJS: регистрация, вход, свой профиль, список профилей, выход.

Стек: Node.js, TypeScript, NestJS, PostgreSQL, TypeORM, JWT + Passport.

## Запуск с нуля

Нужны Node.js 24 и Docker.

1. Поставь зависимости

   ```bash
   npm ci
   ```

2. Создай `.env`

   ```bash
   cp .env.example .env
   ```

   Заполни `DB_PASSWORD`, `JWT_ACCESS_SECRET` и `JWT_REFRESH_SECRET`. Секреты должны отличаться и быть не короче 32 символов, сгенерировать можно так:

   ```bash
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

API - http://localhost:3000, Swagger - http://localhost:3000/docs.

Если порт 5432 занят, поменяй `DB_PORT` в `.env` до шага 3.

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
- refresh приходит в HttpOnly cookie с `Path=/auth`, в базе лежит только sha256 от него
- refresh одноразовый, после обновления старый не работает
- один пользователь может войти с нескольких устройств, выход завершает только текущую сессию
- после удаления профиля access перестает работать сразу, после выхода - когда истечет

## Ошибки

Формат один для всех:

```json
{
  "statusCode": 400,
  "message": "Проверь данные запроса",
  "details": [{ "field": "age", "messages": ["Возраст от 1 до 120"] }],
  "path": "/auth/register",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

`details` есть только у ошибок валидации.

## Решения, которых нет в т/з

Про токены написано выше, остальное:

- refresh хэшируется sha256, а не bcrypt: по sha256 сессию можно найти одним запросом, а bcrypt смотрит только первые 72 байта, у JWT они почти одинаковые
- в refresh есть `jti`, иначе два токена, выданные в одну секунду, совпадут
- пароль меняется отдельным маршрутом со старым паролем, после смены завершаются все сессии
- логин и email без учета регистра, в базе хранятся в нижнем регистре
- в списке пользователей нет email, `login` ищет по части логина
- удаление мягкое, логин и email удаленного можно занять заново
- если база не ответила за `DB_STATEMENT_TIMEOUT_MS`, ответ 503
- логин 3-32 символа из `a-z`, `0-9`, `_`, пароль от 8 символов и не больше 72 байт, возраст 1-120, описание необязательное, до 1000 символов
- `limit` от 1 до 100, по умолчанию 20, `page` не больше 10000
- истекшие сессии из базы пока не удаляются, это можно сделать фоновой задачей

## Тесты

```bash
npm test
npm run test:e2e
```

Для e2e нужен запущенный Docker, база поднимается через Testcontainers.

## Остальные команды

```bash
npm run migration:revert
npm run lint
npm run typecheck
npm run format
```
