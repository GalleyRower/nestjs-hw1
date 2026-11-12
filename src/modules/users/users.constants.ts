export const LOGIN_MIN_LENGTH = 3;
export const LOGIN_MAX_LENGTH = 32;
export const LOGIN_PATTERN = /^[a-z0-9_]+$/;

export const EMAIL_MAX_LENGTH = 254;

export const PASSWORD_MIN_LENGTH = 8;
// bcrypt учитывает только первые 72 байта
export const PASSWORD_MAX_BYTES = 72;
export const PASSWORD_HASH_LENGTH = 60;

export const AGE_MIN = 1;
export const AGE_MAX = 120;

export const DESCRIPTION_MAX_LENGTH = 1000;

export const USERS_LOGIN_UNIQUE_INDEX = 'users_login_active_uq';
export const USERS_EMAIL_UNIQUE_INDEX = 'users_email_active_uq';
