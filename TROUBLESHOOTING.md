# Troubleshooting - AI Planner

## TypeScript ошибки в ai-plan файлах

### Проблема
```
Property 'aIPlan' does not exist on type 'PrismaClient'
Property 'aIPlanMessage' does not exist on type 'PrismaClient'
Property 'aIPlanIteration' does not exist on type 'PrismaClient'
```

### Причина
Prisma Client еще не сгенерирован с новыми моделями из обновленной схемы.

### Решение

#### Шаг 1: Сгенерируйте Prisma Client
```bash
npx prisma generate
```

Эта команда:
- Читает `prisma/schema.prisma`
- Генерирует TypeScript типы для новых моделей
- Обновляет `generated/prisma/` директорию
- Создает типы для AIPlan, AIPlanMessage, AIPlanIteration

#### Шаг 2: Создайте миграцию базы данных
```bash
npx prisma migrate dev --name add_ai_planner
```

Эта команда:
- Создает SQL миграцию для новых таблиц
- Применяет миграцию к базе данных
- Автоматически запускает `prisma generate`

#### Шаг 3: Перезапустите TypeScript сервер в VS Code
1. Откройте Command Palette (Cmd/Ctrl + Shift + P)
2. Выберите "TypeScript: Restart TS Server"

Или просто перезапустите VS Code.

#### Шаг 4: Перезапустите dev сервер
```bash
# Остановите текущий сервер (Ctrl+C)
# Запустите заново
npm run dev
```

### Проверка
После выполнения этих шагов:
- ✅ TypeScript ошибки должны исчезнуть
- ✅ Автодополнение для новых моделей должно работать
- ✅ API endpoints должны компилироваться без ошибок

## Другие возможные проблемы

### База данных не запущена
```
Error: Can't reach database server
```

**Решение:**
```bash
# Запустите Docker контейнер с MySQL
docker-compose up -d
```

### Неверный DATABASE_URL
```
Error: Invalid DATABASE_URL
```

**Решение:**
Проверьте `.env` файл:
```env
DATABASE_URL="mysql://planner_user:planner_password@localhost:3307/planner_ai"
```

### OpenAI API ключ не найден
```
Error: OPENAI_API_KEY не настроен
```

**Решение:**
Добавьте ключ в `.env`:
```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### Ошибка при генерации плана
```
Error: OpenAI API error: 401 Unauthorized
```

**Возможные причины:**
1. Неверный API ключ
2. Истек срок действия ключа
3. Недостаточно средств на аккаунте OpenAI

**Решение:**
1. Проверьте ключ на https://platform.openai.com/api-keys
2. Проверьте баланс на https://platform.openai.com/account/billing
3. Обновите ключ в `.env`

### Медленная генерация (>30 секунд)
```
Timeout или очень долгое ожидание
```

**Причины:**
- GPT-4 может быть медленным при больших запросах
- Высокая нагрузка на OpenAI API

**Решение:**
1. Используйте GPT-3.5-turbo для более быстрых ответов:
   ```typescript
   // В lib/ai-planner.ts
   model: "gpt-3.5-turbo"
   ```
2. Сократите описание проекта
3. Попробуйте позже

### Ошибки миграции
```
Error: Migration failed
```

**Решение:**
```bash
# Сбросьте базу данных (ВНИМАНИЕ: удалит все данные!)
npx prisma migrate reset

# Или примените миграции заново
npx prisma migrate deploy
```

### Конфликт портов
```
Error: Port 3000 is already in use
```

**Решение:**
```bash
# Найдите процесс на порту 3000
lsof -i :3000

# Убейте процесс
kill -9 <PID>

# Или используйте другой порт
PORT=3001 npm run dev
```

## Полезные команды

### Проверка статуса Prisma
```bash
npx prisma validate
```

### Просмотр сгенерированного SQL
```bash
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
```

### Открыть Prisma Studio
```bash
npx prisma studio
```

### Проверка подключения к БД
```bash
npx prisma db pull
```

### Форматирование схемы
```bash
npx prisma format
```

## Логи и отладка

### Включить подробные логи Prisma
```typescript
// В lib/prisma.ts
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
```

### Логи OpenAI запросов
Добавьте в `lib/ai-planner.ts`:
```typescript
console.log('OpenAI Request:', {
  model,
  messages,
  temperature,
});
```

### Проверка переменных окружения
```bash
# В терминале
echo $OPENAI_API_KEY
echo $DATABASE_URL
```

## Получение помощи

Если проблема не решена:

1. Проверьте логи в терминале
2. Откройте DevTools в браузере (F12) → Console
3. Проверьте Network tab для API запросов
4. Посмотрите `docs/AI_PLANNER_SETUP.md` для подробной документации

## Контрольный чеклист

Перед запуском AI Planner убедитесь:

- [ ] База данных запущена (`docker-compose up -d`)
- [ ] `.env` файл создан и заполнен
- [ ] `OPENAI_API_KEY` добавлен в `.env`
- [ ] `npx prisma generate` выполнен
- [ ] `npx prisma migrate dev` выполнен
- [ ] Dev сервер перезапущен
- [ ] TypeScript сервер перезапущен в VS Code
- [ ] Нет ошибок компиляции
- [ ] Можете войти в систему как тимлид или админ
