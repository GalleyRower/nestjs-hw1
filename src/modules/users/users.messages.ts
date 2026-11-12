import {
  USERS_EMAIL_UNIQUE_INDEX,
  USERS_LOGIN_UNIQUE_INDEX,
} from './users.constants.js';

export const USER_ERROR_MESSAGES = {
  loginTaken: 'Логин уже занят, выбери другой',
  emailTaken: 'Email уже занят, укажи другой',
} as const;

export const USER_UNIQUE_MESSAGES = {
  [USERS_LOGIN_UNIQUE_INDEX]: USER_ERROR_MESSAGES.loginTaken,
  [USERS_EMAIL_UNIQUE_INDEX]: USER_ERROR_MESSAGES.emailTaken,
};
