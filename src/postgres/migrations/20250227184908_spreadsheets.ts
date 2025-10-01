import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("spreadsheets", (table: Knex.TableBuilder) => {
        table.string("spreadsheet_id").primary();
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("spreadsheets");
}


