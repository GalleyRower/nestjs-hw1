import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersAndSessions1794509767318 implements MigrationInterface {
  name = 'CreateUsersAndSessions1794509767318';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "login" character varying(32) NOT NULL, "email" character varying(254) NOT NULL, "password_hash" character varying(60) NOT NULL, "age" smallint NOT NULL, "description" character varying(1000), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "users_description_check" CHECK (description <> ''), CONSTRAINT "users_age_check" CHECK (age BETWEEN 1 AND 120), CONSTRAINT "users_email_lower_check" CHECK (email = lower(email)), CONSTRAINT "users_login_lower_check" CHECK (login = lower(login)), CONSTRAINT "users_pk" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "users_list_idx" ON "users"  ("created_at", "id") WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "users_email_active_uq" ON "users"  ("email") WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "users_login_active_uq" ON "users"  ("login") WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_sessions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "token_hash" character(64) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "refresh_sessions_token_hash_uq" UNIQUE ("token_hash"), CONSTRAINT "refresh_sessions_pk" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "refresh_sessions_user_idx" ON "refresh_sessions"  ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_sessions" DROP CONSTRAINT "refresh_sessions_user_fk"`,
    );
    await queryRunner.query(`DROP INDEX "public"."refresh_sessions_user_idx"`);
    await queryRunner.query(`DROP TABLE "refresh_sessions"`);
    await queryRunner.query(`DROP INDEX "public"."users_login_active_uq"`);
    await queryRunner.query(`DROP INDEX "public"."users_email_active_uq"`);
    await queryRunner.query(`DROP INDEX "public"."users_list_idx"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
