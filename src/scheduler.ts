import knex from "#postgres/knex.js";
import { fetchWbBoxTariffs, extractCoefficients } from "#services/wbTariffs.js";
import { exportToSheets } from "#services/sheets.js";

function todayStr() {
    const d = new Date();
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export async function runOnce(params: {
    wbToken?: string;
    sheetsAuth?: { clientEmail?: string; privateKey?: string };
    sheetTitle: string;
}) {
    if (!params.wbToken) {
        console.warn("WB token is not provided; skipping fetch");
        return;
    }
    const day = todayStr();
    const payload = await fetchWbBoxTariffs(params.wbToken, day);

    await knex("tariffs_box_raw_daily")
        .insert({ day, payload })
        .onConflict(["day"]).merge({ payload, updated_at: knex.fn.now() });

    const coeffs = extractCoefficients(payload, day);
    if (coeffs.length > 0) {
        await knex.transaction(async (trx) => {
            await trx("tariffs_box_coeffs").where({ day }).del();
            await trx("tariffs_box_coeffs").insert(coeffs.map((c) => ({ day: c.day, coefficient: c.coefficient, meta: c.meta })));
        });
    }

    const spreadsheets = await knex("spreadsheets").select("spreadsheet_id");
    const spreadsheetIds = spreadsheets.map((s) => s.spreadsheet_id);

    if (params.sheetsAuth?.clientEmail && params.sheetsAuth?.privateKey && spreadsheetIds.length > 0) {
        const rows = (await knex("tariffs_box_coeffs").where({ day }).orderBy("coefficient", "asc")).map((r) => ({
            coefficient: Number(r.coefficient),
            meta: r.meta,
        }));
        await exportToSheets({
            spreadsheetIds,
            sheetTitle: params.sheetTitle,
            rows,
            auth: { clientEmail: params.sheetsAuth.clientEmail, privateKey: params.sheetsAuth.privateKey },
        });
    }
}

export function startHourly(params: Parameters<typeof runOnce>[0]) {
    // run at start
    runOnce(params).catch((e) => console.error("Scheduler first run error", e));
    // then every hour
    const hourMs = 60 * 60 * 1000;
    setInterval(() => {
        runOnce(params).catch((e) => console.error("Scheduler run error", e));
    }, hourMs);
}


