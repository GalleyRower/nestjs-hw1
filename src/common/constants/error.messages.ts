export const COMMON_ERROR_MESSAGES = {
  validation: 'Проверь данные запроса',
  unknownField: 'Такого поля нет',
  unreadable: 'Не удалось прочитать запрос, проверь формат JSON',
  tooLarge: 'Запрос слишком большой',
  emptyBody: 'Передай хотя бы одно поле для обновления',
  invalidData: 'В запросе недопустимое значение, проверь данные',
  conflict: 'Такая запись уже существует',
  databaseTimeout: 'Сервис не успел обработать запрос, попробуй позже',
  internal: 'Что-то пошло не так, попробуй позже',
} as const;
