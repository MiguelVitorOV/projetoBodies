import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm"

export class CreateProductVariantTable1774440606448 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "product_variant",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "uuid"
                    },
                    {
                        name: "color",
                        type: "varchar"
                    },
                    {
                        name: "size",
                        type: "varchar"
                    },
                    {
                        name: "stockQuantity",
                        type: "integer",
                        default: 0
                    },
                    {
                        name: "productId",
                        type: "uuid"
                    }
                ]
            }),
            true
        );

        await queryRunner.createForeignKey(
            "product_variant",
            new TableForeignKey({
                columnNames: ["productId"],
                referencedTableName: "product",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey("product_variant", "FK_product_variant_productId_product_id");
        await queryRunner.dropTable("product_variant");
    }
}