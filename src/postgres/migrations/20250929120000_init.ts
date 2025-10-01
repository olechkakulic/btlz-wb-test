import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    const hasSpreadsheets = await knex.schema.hasTable("spreadsheets");
    if (!hasSpreadsheets) {
        await knex.schema.createTable("spreadsheets", (table: Knex.TableBuilder) => {
            table.string("spreadsheet_id").primary();
        });
    }

    const hasTariffsRaw = await knex.schema.hasTable("tariffs_box_raw_daily");
    if (!hasTariffsRaw) {
        await knex.schema.createTable("tariffs_box_raw_daily", (table: Knex.TableBuilder) => {
            table.date("day").primary();
            table.jsonb("payload").notNullable();
            table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
        });
    }

    const hasTariffsCoeffs = await knex.schema.hasTable("tariffs_box_coeffs");
    if (!hasTariffsCoeffs) {
        await knex.schema.createTable("tariffs_box_coeffs", (table: Knex.TableBuilder) => {
            table.increments("id").primary();
            table.date("day").notNullable().index();
            table.decimal("coefficient", 10, 4).notNullable().index();
            table.jsonb("meta").notNullable();
        });
    }
}

export async function down(knex: Knex): Promise<void> {
    // Rollback only our tables. Keep spreadsheets since it may exist from template.
    const dropIfExists = async (name: string): Promise<void> => {
        const exists = await knex.schema.hasTable(name);
        if (exists) await knex.schema.dropTable(name);
    };
    await dropIfExists("tariffs_box_coeffs");
    await dropIfExists("tariffs_box_raw_daily");
}


