import { ApiProperty } from '@nestjs/swagger';

export class AccessTokenResponse {
  @ApiProperty({ description: 'Передавай в Authorization: Bearer' })
  access_token: string;
}
