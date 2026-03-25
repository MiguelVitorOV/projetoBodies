import { MigrationInterface, QueryRunner, Table } from "typeorm"

export class CreateUserTable1774440497140 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "user",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "uuid"
                    },
                    {
                        name: "name",
                        type: "varchar",
                        isNullable: false
                    },
                    {
                        name: "phone",
                        type: "varchar"
                    },
                    {
                        name: "cpf",
                        type: "varchar"
                    },
                    {
                        name: "email",
                        type: "varchar",
                        isUnique: true
                    },
                    {
                        name: "password",
                        type: "varchar",
                        isNullable: false
                    },
                    {
                        name: "role",
                        type: "varchar",
                        default: "'cliente'"
                    }
                ]
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("user");
    }
}