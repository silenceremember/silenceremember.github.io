# 🚀 Инструкция по деплою на GitHub Pages

## Проблема
На https://silenceremember.github.io/ загружались старые JS-файлы с устаревшими хешами, что приводило к ошибке `NS_ERROR_CORRUPTED_CONTENT`.

## Что исправлено

### 1. ✅ Навигация (уже в репозитории)
- Пункт "ГЛАВНАЯ" теперь правильно отображается активным при URL `/`
- Исправлено в `src/js/layout/LayoutManager.js` и `src/js/utils/Navigation.js`

### 2. ✅ Файл _redirects
- Удалено проблемное правило `/*    /404.html   404`
- GitHub Pages не поддерживает этот формат (это для Netlify)
- GitHub Pages автоматически обрабатывает 404.html

### 3. ✅ Проект пересобран
- Все файлы в `dist/` обновлены
- Новые хеши JS-файлов соответствуют ссылкам в HTML

## Как задеплоить

### Вариант 1: Использование gh-pages ветки (Рекомендуется)

```bash
# 1. Установите пакет gh-pages (если еще не установлен)
npm install --save-dev gh-pages

# 2. Добавьте скрипт в package.json:
# "deploy": "npm run build && gh-pages -d dist"

# 3. Запустите деплой:
npm run deploy
```

### Вариант 2: Ручной деплой

```bash
# 1. Перейдите в папку dist
cd dist

# 2. Инициализируйте git (если еще не инициализирован)
git init

# 3. Добавьте все файлы
git add .

# 4. Создайте коммит
git commit -m "Deploy updated site with navigation fixes"

# 5. Добавьте remote (замените на свой URL)
git remote add origin https://github.com/silenceremember/silenceremember.github.io.git

# 6. Пуш в ветку gh-pages
git push -f origin master:gh-pages

# 7. Вернитесь в корень проекта
cd ..
```

### Вариант 3: GitHub Actions (Автоматизация)

Создайте файл `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ master ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci --legacy-peer-deps
        
      - name: Build
        run: npm run build
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Затем в настройках GitHub репозитория:
1. Settings → Pages
2. Source: GitHub Actions

## Следующие шаги

1. **Закоммитьте изменения в master:**
   ```bash
   git push origin master
   ```

2. **Выберите один из вариантов деплоя выше**

3. **Проверьте сайт:**
   - Откройте https://silenceremember.github.io/
   - Проверьте консоль браузера (F12) - не должно быть ошибок
   - Проверьте, что кнопка "ГЛАВНАЯ" активна при URL `/`

## Проверка после деплоя

Откройте консоль разработчика (F12) на https://silenceremember.github.io/ и проверьте:

✅ Должны загружаться файлы с новыми хешами:
- `utils-DlWg-x2O.js`
- `layout-B_i5Hhw_.js`
- `page-base-page-CIE4_cKR.js`
- `main-BhL54QIo.js`

❌ Не должно быть ошибок:
- `NS_ERROR_CORRUPTED_CONTENT`
- `disallowed MIME type`

## Кеширование

Если после деплоя видите старую версию:
1. Очистите кеш браузера (Ctrl+Shift+Delete)
2. Откройте в режиме инкогнито
3. Жесткая перезагрузка (Ctrl+F5 или Ctrl+Shift+R)

---

**Примечание:** Папка `dist/` находится в `.gitignore` и не коммитится в master ветку. Это правильно - она используется только для деплоя.

