import { google } from "googleapis";

export type SheetsAuthConfig = {
    clientEmail: string;
    privateKey: string;
};

export type ExportRow = {
    coefficient: number;
    meta: Record<string, unknown>;
};

export async function exportToSheets(params: {
    spreadsheetIds: string[];
    sheetTitle: string; // e.g., stocks_coefs
    rows: ExportRow[]; // already sorted ASC by coefficient
    auth: SheetsAuthConfig;
}) {
    if (params.spreadsheetIds.length === 0) return;
    const jwt = new google.auth.JWT(
        params.auth.clientEmail,
        undefined,
        params.auth.privateKey.replace(/\\n/g, "\n"),
        ["https://www.googleapis.com/auth/spreadsheets"]
    );
    const sheets = google.sheets({ version: "v4", auth: jwt });

    const values = [["coefficient", "meta_json"], ...params.rows.map((r) => [r.coefficient, JSON.stringify(r.meta)])];

    for (const spreadsheetId of params.spreadsheetIds) {
        const range = `${params.sheetTitle}!A1:B${values.length}`;
        await sheets.spreadsheets.values.clear({ spreadsheetId, range });
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: "RAW",
            requestBody: { values },
        });
    }
}


