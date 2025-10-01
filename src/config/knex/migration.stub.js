/** @param {import("knex").Knex} knex */
export async function up(knex) {
    return knex.schema;
}

/** @param {import("knex").Knex} knex */
export async function down(knex) {
    return knex.schema;
}
