# WB Tariffs Box: сервис сбора и экспорта тарифов

## Описание
Сервис ежечасно получает тарифы WB для коробов (`GET https://common-api.wildberries.ru/api/v1/tariffs/box?date=YYYY-MM-DD`),
сохраняет дневной срез в PostgreSQL и регулярно экспортирует актуальные коэффициенты в Google Sheets (лист `stocks_coefs`) по списку `spreadsheet_id`.

## Запуск одной командой
```bash
docker compose up --build
```
По умолчанию берутся значения:
- БД: `POSTGRES_HOST=postgres`, `POSTGRES_PORT=5432`, `POSTGRES_DB=postgres`, `POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=postgres`
- Приложение: `APP_PORT=5000`
- Интеграции (опционально): `WB_API_TOKEN`, `GS_CLIENT_EMAIL`, `GS_PRIVATE_KEY`

Без секретов контейнеры поднимаются и миграции/сиды выполняются. Чтобы сервис реально тянул тарифы и писал в таблицы — передайте секреты.

### Полный запуск с секретами (без .env)
```bash
WB_API_TOKEN=... \
GS_CLIENT_EMAIL=... \
GS_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n' \
docker compose up --build
```

## Настройка Google Sheets
1) Создайте 1..N таблиц, в каждой добавьте лист `stocks_coefs`.
2) Дайте доступ Editor сервис-аккаунту: `GS_CLIENT_EMAIL`.
3) Добавьте `spreadsheet_id` в сид `src/postgres/seeds/spreadsheets.js` (или сделайте INSERT в таблицу `spreadsheets`).

## Проверка
- Логи приложения:
```bash
docker compose logs app | tail -n 200
```
Ожидаем строку: `Service started: scheduler initialized`.

- Одноразовый прогон (не ждать час):
```bash
docker compose exec app node -e "(async()=>{const {runOnce}=await import('/app/dist/scheduler.js'); await runOnce({ wbToken: process.env.WB_API_TOKEN, sheetsAuth: { clientEmail: process.env.GS_CLIENT_EMAIL, privateKey: process.env.GS_PRIVATE_KEY }, sheetTitle: 'stocks_coefs' }); console.log('manual runOnce finished');})().catch(e=>{console.error(e); process.exit(1);});"
```

- БД:
```bash
docker exec postgres psql -U postgres -d postgres -c "SELECT day, COUNT(*) FROM tariffs_box_coeffs GROUP BY day ORDER BY day DESC LIMIT 1;"
```

## Структура данных
- `tariffs_box_raw_daily(day, payload jsonb)` — сырые данные WB за день
- `tariffs_box_coeffs(id, day, coefficient numeric, meta jsonb)` — плоская витрина коэффициентов

## Конфигурация
- Чувствительных данных в репозитории нет. Для примера используйте `example.env`.
- Локальный `.env` не коммитить.

## Разработка (опционально)
- Локальный dev без Docker требует `tsx`:
```bash
npm i -D tsx
npm run dev
```
