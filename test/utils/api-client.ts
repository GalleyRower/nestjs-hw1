import { randomBytes } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';

export interface ApiResponse<T> {
  status: number;
  body: T;
  cookie: string;
  setCookie: string;
}

type Method = 'get' | 'post' | 'patch' | 'delete';

export interface RequestOptions {
  body?: object;
  token?: string;
  cookie?: string;
}

export interface ErrorBody {
  statusCode: number;
  message: string;
  details?: { field: string; messages: string[] }[];
  path: string;
  timestamp: string;
}

export interface ProfileBody {
  id: string;
  login: string;
  email: string;
  age: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UsersPageBody {
  items: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
}

export interface Session {
  login: string;
  token: string;
  cookie: string;
}

export const PASSWORD = 'password-1';

export const uniqueLogin = (prefix = 'user') =>
  `${prefix}_${randomBytes(5).toString('hex')}`;

export const registerBody = (login = uniqueLogin()) => ({
  login,
  email: `${login}@example.com`,
  password: PASSWORD,
  age: 25,
  description: 'Учусь писать бэкенд',
});

export class ApiClient {
  constructor(private readonly app: INestApplication<App>) {}

  async request<T>(
    method: Method,
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    let test = request(this.app.getHttpServer())[method](path);
    if (options.token) {
      test = test.set('Authorization', `Bearer ${options.token}`);
    }
    if (options.cookie) {
      test = test.set('Cookie', options.cookie);
    }
    if (options.body !== undefined) {
      test = test.send(options.body);
    }
    const response = await test;
    const setCookie = response.get('Set-Cookie')?.[0] ?? '';
    return {
      status: response.status,
      body: response.body as T,
      setCookie,
      cookie: setCookie.split(';')[0] ?? '',
    };
  }

  login(login: string, password = PASSWORD) {
    return this.request<{ access_token: string }>('post', '/auth/login', {
      body: { login, password },
    });
  }

  refresh(cookie?: string) {
    return this.request<{ access_token: string }>('post', '/auth/refresh', {
      cookie,
    });
  }

  profile(token?: string) {
    return this.request<ProfileBody>('get', '/profile/my', { token });
  }

  async signUp(login = uniqueLogin()): Promise<Session> {
    const response = await this.request<{ access_token: string }>(
      'post',
      '/auth/register',
      { body: registerBody(login) },
    );
    expect(response.status).toBe(201);
    return {
      login,
      token: response.body.access_token,
      cookie: response.cookie,
    };
  }
}
