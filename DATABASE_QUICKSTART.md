# Быстрый старт с MySQL в Docker

## Запуск базы данных

```bash
# 1. Запустить MySQL контейнер
docker-compose up -d

# 2. Синхронизировать схему с базой данных
npx prisma db push

# 3. (Опционально) Открыть Prisma Studio для просмотра данных
npx prisma studio
```

## Проверка статуса

```bash
# Проверить, что контейнер запущен
docker-compose ps

# Посмотреть логи MySQL
docker-compose logs mysql
```

## Остановка базы данных

```bash
# Остановить контейнер (данные сохраняются)
docker-compose down

# Остановить и удалить все данные
docker-compose down -v
```

## Подключение

- **Host**: localhost
- **Port**: 3307
- **Database**: planner_ai
- **User**: planner_user
- **Password**: planner_password

## Строка подключения

```
mysql://planner_user:planner_password@localhost:3307/planner_ai
```

## Troubleshooting

### Порт 3307 занят

Измените порт в `docker-compose.yml`:
```yaml
ports:
  - "3308:3306"  # Используйте другой порт
```

И обновите `DATABASE_URL` в `.env.local`:
```
DATABASE_URL="mysql://planner_user:planner_password@localhost:3308/planner_ai"
```

### Сброс базы данных

```bash
docker-compose down -v
docker-compose up -d
sleep 5
npx prisma db push
```

## Полная документация

Смотрите [DATABASE_SETUP.md](docs/DATABASE_SETUP.md) для подробной информации.
