import {
  AGE_MAX,
  AGE_MIN,
  DESCRIPTION_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  LIMIT_MAX,
  LOGIN_MAX_LENGTH,
  LOGIN_MIN_LENGTH,
  PAGE_MAX,
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN_LENGTH,
  USERS_EMAIL_UNIQUE_INDEX,
  USERS_LOGIN_UNIQUE_INDEX,
} from './users.constants.js';

export const USER_VALIDATION_MESSAGES = {
  loginType: 'Логин должен быть строкой',
  loginLength: `Логин от ${LOGIN_MIN_LENGTH} до ${LOGIN_MAX_LENGTH} символов`,
  loginPattern: 'В логине можно латинские буквы, цифры и _',
  loginSearchLength: `Поиск по логину не длиннее ${LOGIN_MAX_LENGTH} символов`,
  email: 'Укажи коректный email',
  emailLength: `Email не длиннее ${EMAIL_MAX_LENGTH} символов`,
  passwordType: 'Пароль должен быть строкой',
  passwordMin: `Пароль не короче ${PASSWORD_MIN_LENGTH} символов`,
  passwordMax: `Пароль не длиннее ${PASSWORD_MAX_BYTES} байт`,
  ageInt: 'Возраст должен быть целым числом',
  ageRange: `Возраст от ${AGE_MIN} до ${AGE_MAX}`,
  descriptionType: 'Описание должно быть строкой',
  descriptionLength: `Описание не длиннее ${DESCRIPTION_MAX_LENGTH} символов`,
  page: `page - целое число от 1 до ${PAGE_MAX}`,
  limit: `limit - целое число от 1 до ${LIMIT_MAX}`,
} as const;

export const USER_ERROR_MESSAGES = {
  notFound: 'Профиль не найден',
  loginTaken: 'Логин уже занят, выбери другой',
  emailTaken: 'Email уже занят, укажи другой',
} as const;

export const USER_UNIQUE_MESSAGES = {
  [USERS_LOGIN_UNIQUE_INDEX]: USER_ERROR_MESSAGES.loginTaken,
  [USERS_EMAIL_UNIQUE_INDEX]: USER_ERROR_MESSAGES.emailTaken,
};
