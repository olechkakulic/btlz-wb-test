/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function seed(knex) {
    await knex("spreadsheets")
        .insert([{ spreadsheet_id: "1a0gukwVPTJjIH3J4K7mCEJGRGTwDa5f5avJoEN8qP5o" }])
        .onConflict(["spreadsheet_id"])
        .ignore();
}
