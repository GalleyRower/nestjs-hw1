import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  AGE_MAX,
  AGE_MIN,
  DESCRIPTION_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  LOGIN_MAX_LENGTH,
  PASSWORD_HASH_LENGTH,
  USERS_EMAIL_UNIQUE_INDEX,
  USERS_LOGIN_UNIQUE_INDEX,
} from '../users.constants.js';

@Entity({ name: 'users' })
@Index(USERS_LOGIN_UNIQUE_INDEX, ['login'], {
  unique: true,
  where: 'deleted_at IS NULL',
})
@Index(USERS_EMAIL_UNIQUE_INDEX, ['email'], {
  unique: true,
  where: 'deleted_at IS NULL',
})
@Index('users_list_idx', ['createdAt', 'id'], { where: 'deleted_at IS NULL' })
@Check('users_login_lower_check', 'login = lower(login)')
@Check('users_email_lower_check', 'email = lower(email)')
@Check('users_age_check', `age BETWEEN ${AGE_MIN} AND ${AGE_MAX}`)
@Check('users_description_check', "description <> ''")
export class UserEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'users_pk' })
  id: string;

  @Column({ type: 'varchar', length: LOGIN_MAX_LENGTH })
  login: string;

  @Column({ type: 'varchar', length: EMAIL_MAX_LENGTH })
  email: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: PASSWORD_HASH_LENGTH,
    select: false,
  })
  passwordHash: string;

  @Column({ type: 'smallint' })
  age: number;

  @Column({ type: 'varchar', length: DESCRIPTION_MAX_LENGTH, nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;
}
