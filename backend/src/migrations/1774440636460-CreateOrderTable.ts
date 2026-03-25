import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm"

export class CreateOrderTable1774440636460 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "order",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "uuid"
                    },
                    {
                        name: "status",
                        type: "varchar"
                    },
                    {
                        name: "total",
                        type: "decimal",
                        precision: 10,
                        scale: 2
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "userId",
                        type: "uuid"
                    }
                ]
            }),
            true
        );

        await queryRunner.createForeignKey(
            "order",
            new TableForeignKey({
                columnNames: ["userId"],
                referencedTableName: "user",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey("order", "FK_order_userId_user_id");
        await queryRunner.dropTable("order");
    }
}