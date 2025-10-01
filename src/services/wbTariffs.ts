import dotenv from "dotenv";
import https from "https";

dotenv.config();

export type WbBoxTariffsResponse = unknown; // TODO: refine based on real schema

const WB_TARIFFS_URL = "https://common-api.wildberries.ru/api/v1/tariffs/box";

export async function fetchWbBoxTariffs(apiToken: string, date: string): Promise<WbBoxTariffsResponse> {
    const url = new URL(WB_TARIFFS_URL);
    url.searchParams.set("date", date);

    const doRequest = async (attempt: number): Promise<WbBoxTariffsResponse> => {
        return await new Promise((resolve, reject) => {
            const req = https.request(
                url,
                {
                    method: "GET",
                    headers: {
                        Authorization: apiToken,
                    },
                },
                (res) => {
                    let data = "";
                    res.setEncoding("utf8");
                    res.on("data", (chunk) => (data += chunk));
                    res.on("end", async () => {
                        const status = res.statusCode ?? 0;
                        if (status === 429 && attempt < 5) {
                            const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                            setTimeout(() => {
                                doRequest(attempt + 1).then(resolve).catch(reject);
                            }, delay);
                            return;
                        }
                        if (status >= 200 && status < 300) {
                            try {
                                const json = JSON.parse(data);
                                resolve(json);
                            } catch (e) {
                                reject(e);
                            }
                        } else {
                            reject(new Error(`WB response status ${status}: ${data}`));
                        }
                    });
                }
            );
            req.on("error", reject);
            req.end();
        });
    };

    return doRequest(0);
}

export type CoefficientRow = {
    day: string; // YYYY-MM-DD
    coefficient: number;
    meta: Record<string, unknown>;
};

export function extractCoefficients(payload: WbBoxTariffsResponse, day: string): CoefficientRow[] {
    try {
        const obj = payload as any;
        const warehouses: any[] = obj?.response?.data?.warehouseList ?? [];

        const toNumber = (v: any): number | null => {
            if (v == null) return null;
            if (typeof v === "number") return v;
            if (typeof v === "string") {
                if (v.trim() === "-") return null;
                const normalized = v.replace(",", ".").trim();
                const n = Number(normalized);
                return Number.isFinite(n) ? n : null;
            }
            return null;
        };

        const rows: CoefficientRow[] = [];
        for (const w of warehouses) {
            const coef = toNumber(w?.boxDeliveryCoefExpr) ?? toNumber(w?.boxStorageCoefExpr) ?? toNumber(w?.boxDeliveryMarketplaceCoefExpr);
            if (coef == null) continue;
            rows.push({
                day,
                coefficient: coef,
                meta: {
                    geoName: w?.geoName,
                    warehouseName: w?.warehouseName,
                    boxStorageBase: w?.boxStorageBase,
                    boxDeliveryBase: w?.boxDeliveryBase,
                    boxStorageLiter: w?.boxStorageLiter,
                    boxDeliveryLiter: w?.boxDeliveryLiter,
                    boxStorageCoefExpr: w?.boxStorageCoefExpr,
                    boxDeliveryCoefExpr: w?.boxDeliveryCoefExpr,
                    boxDeliveryMarketplaceBase: w?.boxDeliveryMarketplaceBase,
                    boxDeliveryMarketplaceLiter: w?.boxDeliveryMarketplaceLiter,
                    boxDeliveryMarketplaceCoefExpr: w?.boxDeliveryMarketplaceCoefExpr,
                },
            });
        }
        return rows;
    } catch {
        return [];
    }
}


