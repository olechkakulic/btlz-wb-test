# WB Tariffs Box: сервис сбора и экспорта тарифов

## Описание
Сервис ежечасно получает тарифы WB для коробов (`GET https://common-api.wildberries.ru/api/v1/tariffs/box?date=YYYY-MM-DD`),
сохраняет дневной срез в PostgreSQL и регулярно экспортирует актуальные коэффициенты в Google Sheets (лист `stocks_coefs`) по списку `spreadsheet_id`.

# WB Tariffs Box — сбор и экспорт тарифов WB (обновлённый README)

## Описание
Сервис ежечасно запрашивает тарифы Wildberries для коробов:
`GET https://common-api.wildberries.ru/api/v1/tariffs/box?date=YYYY-MM-DD`,  
сохраняет дневной срез в PostgreSQL и экспортирует актуальные коэффициенты в Google Sheets (лист `stocks_coefs`) по списку `spreadsheet_id`.

---

# Быстрый старт — теперь через `.env`

Теперь для запуска достаточно создать файл `.env` в корне репозитория и положить в него все секреты/настройки. `docker compose` автоматически подхватывает `.env`.

Создайте `.env`

Пример содержимого `.env` (скопируйте, подставьте свои значения):

```env
# WB API
WB_API_TOKEN=your_wb_api_token_here

# Google Service Account (дать роли Editor на листы)
GS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com

# Приватный ключ сервис-аккаунта.
# Рекомендуемый способ: заменить переводы строк на \n и заключить значение в кавычки.
# Пример (обратите внимание на \n внутри): 
GS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkq...\n...rest of key...\n-----END PRIVATE KEY-----\n"

# Postgres (по умолчанию контейнерные значения)
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
APP_PORT=5001

## Настройка Google Sheets
1) Создайте 1..N таблиц, в каждой добавьте лист `stocks_coefs`.
2) Дайте доступ Editor сервис-аккаунту: `GS_CLIENT_EMAIL`.
3) Добавьте `spreadsheet_id` в сид `src/postgres/seeds/spreadsheets.js` (или сделайте INSERT в таблицу `spreadsheets`).
```
## Запуск
```bash
docker compose up --build
```
В вашей таблицы должны появиться необходимые данные. 
## Проверка
- Логи приложения:
```bash
docker compose logs app | tail -n 200
```
Ожидаем строку: `Service started: scheduler initialized`.

