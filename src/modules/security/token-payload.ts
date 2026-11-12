import { z } from 'zod';
import { ACCESS_TOKEN_TYPE, REFRESH_TOKEN_TYPE } from './security.constants.js';

export const accessPayloadSchema = z.object({
  sub: z.uuid(),
  type: z.literal(ACCESS_TOKEN_TYPE),
});

export const refreshPayloadSchema = z.object({
  sub: z.uuid(),
  type: z.literal(REFRESH_TOKEN_TYPE),
  jti: z.uuid(),
});

export type AccessPayload = z.infer<typeof accessPayloadSchema>;
export type RefreshPayload = z.infer<typeof refreshPayloadSchema>;
