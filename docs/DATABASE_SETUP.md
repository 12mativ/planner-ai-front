# Настройка базы данных для Planner AI

## Проблема с in-memory хранилищем

In-memory хранилище (массивы в памяти) имеет следующие проблемы:
- Данные теряются при перезапуске сервера
- Hot reload в dev режиме сбрасывает данные
- Невозможно масштабировать на несколько серверов
- Нет персистентности данных

## Решение: Prisma + MySQL (Docker)

### Шаг 1: Установка зависимостей

```bash
npm install prisma @prisma/client
npm install -D prisma
```

### Шаг 2: Запуск MySQL через Docker

Проект уже настроен с Docker Compose для MySQL. Просто запустите:

```bash
docker-compose up -d
```

Это запустит MySQL контейнер со следующими параметрами:
- **База данных**: `planner_ai`
- **Пользователь**: `planner_user`
- **Пароль**: `planner_password`
- **Порт**: `3306`
- **Root пароль**: `rootpassword`

Проверить статус контейнера:

```bash
docker-compose ps
```

Остановить базу данных:

```bash
docker-compose down
```

Остановить и удалить данные:

```bash
docker-compose down -v
```

### Шаг 3: Настройка переменных окружения

Файл `.env.local` уже настроен с правильной строкой подключения:

```env
# Database (MySQL via Docker)
DATABASE_URL="mysql://planner_user:planner_password@localhost:3306/planner_ai"

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production
```

### Шаг 4: Схема базы данных

Файл `prisma/schema.prisma` уже настроен для MySQL:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      String   @default("user") // "admin", "team_lead", "user"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  ledTeams     Team[]       @relation("TeamLead")
  memberships  TeamMember[]
}

model Team {
  id          String   @id @default(cuid())
  name        String
  description String   @default("")
  leadId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  lead    User         @relation("TeamLead", fields: [leadId], references: [id], onDelete: Cascade)
  members TeamMember[]
}

model TeamMember {
  id        String   @id @default(cuid())
  teamId    String
  userId    String
  createdAt DateTime @default(now())

  // Relations
  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
}
```

### Шаг 5: Создание миграции

После запуска Docker контейнера, создайте таблицы в базе данных:

```bash
npx prisma migrate dev --name init
```

Это создаст базу данных и таблицы.

### Шаг 6: Генерация Prisma Client

```bash
npx prisma generate
```

### Шаг 7: Prisma Client уже настроен

Файл `lib/prisma.ts` уже создан:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Шаг 8: Prisma Studio (опционально)

Для визуального просмотра данных:

```bash
npx prisma studio
```

Откроется веб-интерфейс на http://localhost:5555

## Полезные команды Docker

### Просмотр логов MySQL:

```bash
docker-compose logs mysql
```

### Подключение к MySQL через CLI:

```bash
docker exec -it planner-ai-mysql mysql -u planner_user -pplanner_password planner_ai
```

### Резервное копирование базы данных:

```bash
docker exec planner-ai-mysql mysqldump -u planner_user -pplanner_password planner_ai > backup.sql
```

### Восстановление из резервной копии:

```bash
docker exec -i planner-ai-mysql mysql -u planner_user -pplanner_password planner_ai < backup.sql
```

## Быстрый старт

1. Запустите MySQL:
   ```bash
   docker-compose up -d
   ```

2. Примените миграции:
   ```bash
   npx prisma migrate dev
   ```

3. Запустите приложение:
   ```bash
   npm run dev
   ```

## Преимущества использования MySQL в Docker

✅ Данные сохраняются между перезапусками
✅ Работает с hot reload
✅ Изолированная среда разработки
✅ Легко переключаться между проектами
✅ Не нужно устанавливать MySQL локально
✅ Одинаковая версия БД у всех разработчиков
✅ Поддержка транзакций
✅ Индексы для быстрых запросов
✅ Миграции для версионирования схемы

## Переход на production

Для production рекомендуется использовать облачные сервисы:
- [PlanetScale](https://planetscale.com) - MySQL-совместимая БД
- [AWS RDS](https://aws.amazon.com/rds/) - MySQL
- [Google Cloud SQL](https://cloud.google.com/sql) - MySQL
- [Azure Database for MySQL](https://azure.microsoft.com/services/mysql/)

Просто обновите `DATABASE_URL` в переменных окружения production сервера.

## Troubleshooting

### Ошибка подключения к базе данных

Убедитесь, что Docker контейнер запущен:
```bash
docker-compose ps
```

### Порт 3306 уже занят

Если у вас уже установлен MySQL локально, измените порт в `docker-compose.yml`:
```yaml
ports:
  - "3307:3306"  # Используйте 3307 вместо 3306
```

И обновите `DATABASE_URL`:
```env
DATABASE_URL="mysql://planner_user:planner_password@localhost:3307/planner_ai"
```

### Сброс базы данных

Если нужно полностью сбросить базу данных:
```bash
docker-compose down -v
docker-compose up -d
npx prisma migrate dev
```
