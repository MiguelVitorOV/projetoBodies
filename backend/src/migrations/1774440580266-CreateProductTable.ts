import { MigrationInterface, QueryRunner, Table } from "typeorm"

export class CreateProductTable1774440580266 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "product",
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
                        name: "description",
                        type: "varchar"
                    },
                    {
                        name: "price",
                        type: "decimal",
                        precision: 10,
                        scale: 2
                    },
                    {
                        name: "imageUrl",
                        type: "varchar"
                    },
                    {
                        name: "discount",
                        type: "decimal",
                        precision: 5,
                        scale: 2,
                        default: "0"
                    }
                ]
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("product");
    }
}