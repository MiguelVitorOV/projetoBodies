import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm"

export class CreateOrderItemTable1774440667800 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "order_item",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "uuid"
                    },
                    {
                        name: "quantity",
                        type: "integer"
                    },
                    {
                        name: "price",
                        type: "decimal",
                        precision: 10,
                        scale: 2
                    },
                    {
                        name: "orderId",
                        type: "uuid"
                    },
                    {
                        name: "variantId",
                        type: "uuid"
                    }
                ]
            }),
            true
        );

        // FK Order
        await queryRunner.createForeignKey(
            "order_item",
            new TableForeignKey({
                columnNames: ["orderId"],
                referencedTableName: "order",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE"
            })
        );

        // FK ProductVariant
        await queryRunner.createForeignKey(
            "order_item",
            new TableForeignKey({
                columnNames: ["variantId"],
                referencedTableName: "product_variant",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey("order_item", "FK_order_item_orderId_order_id");
        await queryRunner.dropForeignKey("order_item", "FK_order_item_variantId_product_variant_id");
        await queryRunner.dropTable("order_item");
    }
}