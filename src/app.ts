import { migrate, seed } from "#postgres/knex.js";
import env from "#config/env/env.js";
import { startHourly } from "#scheduler.js";

await migrate.latest();
await seed.run();

startHourly({
    wbToken: process.env.WB_API_TOKEN,
    sheetsAuth: { clientEmail: process.env.GS_CLIENT_EMAIL, privateKey: process.env.GS_PRIVATE_KEY },
    sheetTitle: "stocks_coefs",
});

console.log("Service started: scheduler initialized");