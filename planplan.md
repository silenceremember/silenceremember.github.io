# ПЛАН ГЛОБАЛЬНОГО РЕФАКТОРИНГА - МАКСИМАЛЬНАЯ ДЕТАЛИЗАЦИЯ

## ЭТАП 0: ПОДГОТОВКА И РЕОРГАНИЗАЦИЯ ДАННЫХ

### 0.1. Анализ и перемещение данных из src/data в public/data

**Проблема**: Дублирование данных в `src/data/` и `public/data/`

**Решение**:

1. Сравнить содержимое файлов в обеих папках:

   - `src/data/community.json` vs `public/data/community.json`
   - `src/data/cv.json` vs `public/data/cv.json`
   - `src/data/projects.json` vs `public/data/projects.json`
   - `src/data/research.json` vs `public/data/research.json`

2. Определить актуальную версию каждого файла (по дате изменения или содержимому)
3. Скопировать актуальные версии в `public/data/` (Vite автоматически копирует public в dist)
4. Удалить папку `src/data/` полностью
5. Проверить все импорты в коде - они должны использовать `/data/` (Vite берет из public)

**Файлы для проверки импортов**:

- `src/js/pages/index.js` - строка 15: `loadData('/data/projects.json')`
- `src/js/pages/projects.js` - строка 48: `loadData('/data/projects.json')`
- `src/js/pages/cv.js` - строки 185, 198: `loadData('/data/cv.json')`, `loadData('/data/community.json')`
- `src/js/pages/research.js` - строка 37: `loadData('/data/research.json')`
- `src/js/pages/community.js` - строка 144: `loadData('/data/community.json')`

**Результат**: Все данные только в `public/data/`, все импорты используют `/data/`

### 0.2. Реорганизация статических файлов

**Проблема**: Неправильное расположение статических файлов

**Шаги**:

1. **Favicon**:

   - Текущее: `src/favicon.svg`
   - Целевое: `public/favicon.svg`
   - Действие: Переместить файл
   - Обновить пути в HTML: проверить все `<link rel="icon">` теги

2. **PDF.js библиотека**:

   - Текущее: `src/public/pdfjs/`
   - Целевое: `public/pdfjs/`
   - Действие: Переместить всю папку `src/public/pdfjs/` → `public/pdfjs/`
   - Обновить пути в HTML файлах, где используется pdfjs
   - Проверить `src/404.html` и другие страницы на наличие ссылок на pdfjs

3. **Проверка других статических файлов**:

   - Убедиться, что `robots.txt`, `sitemap.xml`, `_headers` находятся в `public/`
   - Все статические файлы должны быть в `public/`, а не в `src/`

**Результат**: Все статические файлы в `public/`, пути обновлены

## ЭТАП 1: СОЗДАНИЕ НОВЫХ УТИЛИТ И МЕНЕДЖЕРОВ

### 1.1. Создать `src/js/utils/DateFormatter.js`

**Назначение**: Централизованное форматирование дат и периодов

**Класс**: `DateFormatter`

**Методы**:

- `static formatPeriod(period)` - форматирует период (start — end (duration))
- `static formatDate(date)` - форматирует дату в различные форматы
- `static getYearFromDate(date)` - извлекает год из объекта даты

**Источники дублирования**:

- `src/js/pages/cv.js` - функция `formatPeriod()` (строка 209)
- `src/js/pages/research.js` - функции `getYearFromDate()` (строка 48), `formatDate()` (строка 64)

**Действия**:

1. Создать файл `src/js/utils/DateFormatter.js`
2. Реализовать класс с методами
3. Добавить JSDoc комментарии для всех методов
4. Экспортировать класс как named export

### 1.2. Создать `src/js/utils/StatusMapper.js`

**Назначение**: Маппинг статусов и типов на русский язык

**Класс**: `StatusMapper`

**Методы**:

- `static getStatusText(status)` - получает текст статуса на русском
- `static getTypeText(type)` - получает текст типа на русском

**Источники дублирования**:

- `src/js/pages/research.js` - функции `getStatusText()` (строка 89), `getTypeText()` (строка 101)

**Действия**:

1. Создать файл `src/js/utils/StatusMapper.js`
2. Реализовать класс с методами
3. Добавить JSDoc комментарии
4. Экспортировать класс как named export

### 1.3. Создать `src/js/managers/SlideAnimationManager.js`

**Назначение**: Управление анимациями слайдов на главной странице

**Класс**: `SlideAnimationManager`

**Методы**:

- `constructor(slidesContainer)` - принимает контейнер слайдов
- `initializeFirstSlideAnimation()` - инициализирует анимацию первого слайда
- `setupSlideAnimations()` - настраивает анимации при переключении слайдов
- `animateSlideContent(slide)` - анимирует содержимое конкретного слайда
- `hideSlideElementsBeforeAnimation(slide)` - скрывает элементы перед анимацией
- `restartAnimationsOnModeChange()` - перезапускает анимации при смене режима

**Источники дублирования**:

- `src/js/pages/index.js` - все функции анимации слайдов (строки 310-907)

**Действия**:

1. Создать файл `src/js/managers/SlideAnimationManager.js`
2. Вынести всю логику анимации слайдов из `index.js`
3. Использовать `AnimationUtils` для анимаций
4. Добавить JSDoc комментарии

### 1.4. Создать `src/js/managers/ProjectFiltersManager.js`

**Назначение**: Управление фильтрами проектов

**Класс**: `ProjectFiltersManager`

**Методы**:

- `constructor(projects, allProjectCards)` - принимает проекты и карточки
- `init()` - инициализирует фильтры
- `toggleFilter(type, value, button)` - переключает фильтр
- `applyFilters()` - применяет активные фильтры
- `clearAllFilters()` - очищает все фильтры
- `updateFilterCounts(projects)` - обновляет счетчики в фильтрах
- `initFilterButtons()` - инициализирует кнопки фильтров
- `initYearDropdown()` - инициализирует dropdown года

**Источники дублирования**:

- `src/js/pages/projects.js` - все функции фильтрации (строки 188-733)

**Действия**:

1. Создать файл `src/js/managers/ProjectFiltersManager.js`
2. Вынести всю логику фильтрации из `projects.js`
3. Использовать `CardFactory` для создания карточек
4. Добавить JSDoc комментарии

### 1.5. Создать `src/js/managers/ProjectGroupingManager.js`

**Назначение**: Группировка и отображение проектов по категориям

**Класс**: `ProjectGroupingManager`

**Методы**:

- `constructor(projects, allProjectCards)` - принимает проекты и карточки
- `renderGroupedProjects()` - отображает проекты с группировкой
- `toggleSectionExpansion(category, button)` - переключает развернутость раздела
- `createSection(category, projects, sectionTitles)` - создает секцию проектов

**Источники дублирования**:

- `src/js/pages/projects.js` - функции группировки (строки 1137-1465)

**Действия**:

1. Создать файл `src/js/managers/ProjectGroupingManager.js`
2. Вынести логику группировки из `projects.js`
3. Использовать `AnimationUtils` для анимаций
4. Добавить JSDoc комментарии

### 1.6. Создать `src/js/managers/CVAnimationManager.js`

**Назначение**: Управление анимациями CV страницы

**Класс**: `CVAnimationManager`

**Методы**:

- `initializeAnimations()` - инициализирует все анимации CV
- `animateCVSection(section, options)` - анимирует секцию CV
- `animateCVHeader(headerSection)` - анимирует заголовок CV
- `hideAllCVElementsImmediately()` - скрывает все элементы сразу

**Источники дублирования**:

- `src/js/pages/cv.js` - все функции анимации (строки 116-1061)

**Действия**:

1. Создать файл `src/js/managers/CVAnimationManager.js`
2. Вынести логику анимации из `cv.js`
3. Использовать `AnimationUtils` для анимаций
4. Добавить JSDoc комментарии

### 1.7. Создать `src/js/managers/CommunityAnimationManager.js`

**Назначение**: Управление анимациями страницы сообщества

**Класс**: `CommunityAnimationManager`

**Методы**:

- `initializeAnimations()` - инициализирует все анимации
- `hideAllCommunityElementsImmediately()` - скрывает все элементы сразу

**Источники дублирования**:

- `src/js/pages/community.js` - функции анимации (строки 111-719)

**Действия**:

1. Создать файл `src/js/managers/CommunityAnimationManager.js`
2. Вынести логику анимации из `community.js`
3. Использовать `AnimationUtils` для анимаций
4. Добавить JSDoc комментарии

## ЭТАП 2: РЕФАКТОРИНГ УТИЛИТ (PASCALCASE И СТРУКТУРА)

### 2.1. Переименовать `src/js/utils/animations.js` → `src/js/utils/AnimationUtils.js`

**Действия**:

1. Создать новый файл `src/js/utils/AnimationUtils.js`
2. Скопировать содержимое из `animations.js`
3. Обновить все импорты в проекте:

   - `src/js/pages/index.js`
   - `src/js/pages/projects.js`
   - `src/js/pages/cv.js`
   - `src/js/pages/research.js`
   - `src/js/pages/community.js`
   - `src/js/pages/NotFoundPage.js`
   - `src/js/services/LoadingIndicatorService.js`

4. Удалить старый файл `animations.js`

### 2.2. Переименовать `src/js/utils/data-loader.js` → `src/js/utils/DataLoader.js`

**Действия**:

1. Создать новый файл `src/js/utils/DataLoader.js`
2. Скопировать содержимое из `data-loader.js`
3. Обновить все импорты:

   - `src/js/pages/index.js`
   - `src/js/pages/projects.js`
   - `src/js/pages/cv.js`
   - `src/js/pages/research.js`
   - `src/js/pages/community.js`

4. Удалить старый файл `data-loader.js`

### 2.3. Переименовать `src/js/utils/debounce.js` → `src/js/utils/DebounceUtils.js`

**Действия**:

1. Создать новый файл `src/js/utils/DebounceUtils.js`
2. Скопировать содержимое из `debounce.js`
3. Обновить все импорты:

   - `src/js/main.js`

4. Удалить старый файл `debounce.js`

### 2.4. Переименовать `src/js/utils/dom-helpers.js` → `src/js/utils/DomHelpers.js`

**Действия**:

1. Создать новый файл `src/js/utils/DomHelpers.js`
2. Скопировать содержимое из `dom-helpers.js`
3. Обновить все импорты:

   - `src/js/pages/NotFoundPage.js`

4. Удалить старый файл `dom-helpers.js`

### 2.5. Переименовать `src/js/utils/role-mapper.js` → `src/js/utils/RoleMapper.js`

**Действия**:

1. Создать новый файл `src/js/utils/RoleMapper.js`
2. Скопировать содержимое из `role-mapper.js`
3. Обновить все импорты:

   - `src/js/pages/index.js`
   - `src/js/pages/projects.js`
   - `src/js/factories/CardFactory.js`

4. Удалить старый файл `role-mapper.js`

### 2.6. Создать `src/js/utils/index.js` для централизованного экспорта

**Содержимое**:

```javascript
export { DateFormatter } from './DateFormatter.js';
export { StatusMapper } from './StatusMapper.js';
export { RoleMapper } from './RoleMapper.js';
export { PageReadyManager } from './page-ready.js';
export { NavigationHelper, MenuButtonScrollHandler } from './navigation.js';
export * from './AnimationUtils.js';
export * from './DataLoader.js';
export * from './DebounceUtils.js';
export * from './DomHelpers.js';
```

## ЭТАП 3: РЕФАКТОРИНГ СЕРВИСОВ (PASCALCASE)

### 3.1. Переименовать `src/js/services/background-image-service.js` → `src/js/services/BackgroundImageService.js`

**Действия**:

1. Создать новый файл `src/js/services/BackgroundImageService.js`
2. Скопировать содержимое из `background-image-service.js`
3. Обновить все импорты:

   - `src/js/pages/index.js` (если используется)

4. Удалить старый файл `background-image-service.js`

### 3.2. Переименовать `src/js/services/loading-indicator-service.js` → `src/js/services/LoadingIndicatorService.js`

**Действия**:

1. Создать новый файл `src/js/services/LoadingIndicatorService.js`
2. Скопировать содержимое из `loading-indicator-service.js`
3. Обновить импорт `AnimationUtils` внутри файла
4. Обновить все импорты:

   - `src/js/pages/projects.js`
   - `src/js/pages/research.js`

5. Удалить старый файл `loading-indicator-service.js`

### 3.3. Создать `src/js/services/index.js` для централизованного экспорта

**Содержимое**:

```javascript
export { BackgroundImageService, backgroundImageService } from './BackgroundImageService.js';
export { LoadingIndicatorService } from './LoadingIndicatorService.js';
```

## ЭТАП 4: УЛУЧШЕНИЕ BASEPAGE

### 4.1. Расширить `src/js/pages/BasePage.js`

**Текущее состояние**: Базовый класс с методами `initBase()`, `waitForPageReady()`, `init()`

**Добавить методы**:

1. `initNavigation(navigationSelector)` - инициализация навигации

   - Использует `NavigationHelper.setActiveNavigationLink()`
   - Использует `MenuButtonScrollHandler` для прокрутки к навигации
   - Вызывается в `initBase()`

2. `initScrollToTop()` - инициализация кнопки "Наверх"

   - Использует `ScrollToTopButton` класс
   - Вызывается в `initBase()`

3. Улучшить `waitForPageReady()` - использовать `PageReadyManager`

   - Заменить локальную реализацию на `PageReadyManager.waitForPageReady()`

**Результат**: BasePage предоставляет все базовые функции для всех страниц

## ЭТАП 5: РЕФАКТОРИНГ СТРАНИЦЫ INDEX (ГЛАВНАЯ)

### 5.1. Преобразовать `src/js/pages/index.js` в класс `IndexPage extends BasePage`

**Текущее состояние**: Функциональный подход с множеством функций

**Новая структура**:

```javascript
export class IndexPage extends BasePage {
  constructor() {
    super({
      navigationSelector: '#cta-section',
      imageSelector: '.slide[data-slide="0"] img'
    });
    this.slideAnimationManager = null;
    this.backgroundImageService = null;
  }
  
  async init() {
    await this.initBase();
    // Специфичная логика главной страницы
  }
}
```

**Действия**:

1. Создать класс `IndexPage extends BasePage`
2. Вынести логику загрузки проектов в метод `loadFeaturedProjects()`
3. Вынести логику заполнения слайдов в метод `populateProjectSlides()`
4. Использовать `BackgroundImageService` вместо локальной функции `loadBackgroundImage()`
5. Использовать `SlideAnimationManager` для всех анимаций слайдов
6. Использовать `NavigationHelper.setActiveNavigationLink()` вместо локальной функции
7. Удалить все дублированные функции:

   - `waitForFontsLoaded()` - использовать `PageReadyManager`
   - `waitForImagesLoaded()` - использовать `PageReadyManager`
   - `waitForPageReady()` - использовать `PageReadyManager`
   - `setActiveNavigationLink()` - использовать `NavigationHelper`
   - `loadBackgroundImage()` - использовать `BackgroundImageService`
   - Все функции анимации слайдов - использовать `SlideAnimationManager`

**Удалить функции** (после выноса в менеджеры):

- `loadBackgroundImage()` (строки 29-82)
- `populateProjectSlide()` (строки 90-140) - оставить как метод класса
- `waitForPageReady()` (строки 205-225)
- `waitForFontsLoaded()` (строки 231-248)
- `waitForImagesLoaded()` (строки 254-304)
- `initializeFirstSlideAnimation()` (строки 310-387)
- `animateFirstSlide()` (строки 393-400)
- `restartAnimationsOnModeChange()` (строки 415-547)
- `setupSlideAnimations()` (строки 553-748)
- `hideSlideElementsBeforeAnimation()` (строки 754-792)
- `animateSlideContent()` (строки 798-907)
- `setActiveNavigationLink()` (строки 912-927)
- `hideAllSlideElementsImmediately()` (строки 934-962)

### 5.2. Обновить `src/js/main.js` для использования `IndexPage`

**Действия**:

1. Импортировать `IndexPage` вместо функции `initIndexPage`
2. Создать экземпляр класса и вызвать `init()`
3. Удалить старый импорт `initIndexPage`

## ЭТАП 6: РЕФАКТОРИНГ СТРАНИЦЫ PROJECTS

### 6.1. Преобразовать `src/js/pages/projects.js` в класс `ProjectsPage extends BasePage`

**Новая структура**:

```javascript
export class ProjectsPage extends BasePage {
  constructor() {
    super({
      navigationSelector: '.projects-navigation',
      imageSelector: '.project-card-image'
    });
    this.filtersManager = null;
    this.groupingManager = null;
    this.loadingIndicator = null;
  }
  
  async init() {
    await this.initBase();
    // Специфичная логика страницы проектов
  }
}
```

**Действия**:

1. Создать класс `ProjectsPage extends BasePage`
2. Использовать `CardFactory.createProjectCard()` вместо локальной функции
3. Использовать `LoadingIndicatorService` вместо локальной функции `hideLoadingIndicator()`
4. Использовать `ProjectFiltersManager` для всех операций с фильтрами
5. Использовать `ProjectGroupingManager` для группировки проектов
6. Использовать `PageReadyManager.waitForPageReady()` вместо дублированных функций
7. Удалить все дублированные функции:

   - `createProjectCard()` - использовать `CardFactory`
   - `hideLoadingIndicator()` - использовать `LoadingIndicatorService`
   - `showLoadingIndicator()` - удалить (debug код)
   - `showEmptyProjectsMessage()` - удалить (debug код)
   - `initFilters()` - использовать `ProjectFiltersManager`
   - `updateFilterCounts()` - использовать `ProjectFiltersManager`
   - `initFilterButtons()` - использовать `ProjectFiltersManager`
   - `initYearDropdown()` - использовать `ProjectFiltersManager`
   - `toggleFilter()` - использовать `ProjectFiltersManager`
   - `clearAllFilters()` - использовать `ProjectFiltersManager`
   - `applyFilters()` - использовать `ProjectFiltersManager`
   - `renderGroupedProjects()` - использовать `ProjectGroupingManager`
   - `toggleSectionExpansion()` - использовать `ProjectGroupingManager`
   - `setActiveNavigationLink()` - использовать через `initBase()`
   - `initMenuButtonScroll()` - использовать через `initBase()`
   - `initScrollToTop()` - использовать через `initBase()`

**Удалить debug код**:

- `showLoadingIndicator()` (строки 981-1103)
- `showEmptyProjectsMessage()` (строки 1108-1132)
- Keyboard handlers для debug (строки 1810-1854)

### 6.2. Обновить `src/js/main.js` для использования `ProjectsPage`

**Действия**:

1. Импортировать `ProjectsPage`
2. Определить, на какой странице мы находимся
3. Создать экземпляр класса и вызвать `init()`

## ЭТАП 7: РЕФАКТОРИНГ СТРАНИЦЫ CV

### 7.1. Преобразовать `src/js/pages/cv.js` в класс `CVPage extends BasePage`

**Новая структура**:

```javascript
export class CVPage extends BasePage {
  constructor() {
    super({
      navigationSelector: '.cv-navigation',
      imageSelector: '.cv-page img'
    });
    this.animationManager = null;
    this.timelineTemplate = null;
  }
  
  async init() {
    await this.initBase();
    // Специфичная логика страницы CV
  }
}
```

**Действия**:

1. Создать класс `CVPage extends BasePage`
2. Использовать `CVAnimationManager` для всех анимаций
3. Использовать `DateFormatter.formatPeriod()` вместо локальной функции
4. Использовать `PageReadyManager.waitForPageReady()` вместо дублированных функций
5. Вынести создание секций CV в отдельные методы класса:

   - `createHeaderSection()`
   - `createWorkSection()`
   - `createEducationSection()`
   - `createSkillsSection()`
   - `createCertificatesSection()`
   - `createCoursesSection()`
   - `createLanguagesSection()`

6. Удалить все дублированные функции:

   - `waitForFontsLoaded()` - использовать `PageReadyManager`
   - `waitForImagesLoaded()` - использовать `PageReadyManager`
   - `waitForPageReady()` - использовать `PageReadyManager`
   - `formatPeriod()` - использовать `DateFormatter`
   - `setActiveNavigationLink()` - использовать через `initBase()`
   - `initMenuButtonScroll()` - использовать через `initBase()`
   - Все функции анимации - использовать `CVAnimationManager`

**Удалить функции** (после выноса):

- `waitForFontsLoaded()` (строки 18-35)
- `waitForImagesLoaded()` (строки 41-85)
- `waitForPageReady()` (строки 91-111)
- `formatPeriod()` (строки 209-217)
- `setActiveNavigationLink()` (строки 658-673)
- `initMenuButtonScroll()` (строки 678-731)
- `animateCVSection()` (строки 738-818)
- `animateCVHeader()` (строки 824-868)
- `initializeCVAnimations()` (строки 875-1061)
- `hideAllCVElementsImmediately()` (строки 116-158) - вынести в менеджер

### 7.2. Обновить `src/js/main.js` для использования `CVPage`

## ЭТАП 8: РЕФАКТОРИНГ СТРАНИЦЫ RESEARCH

### 8.1. Преобразовать `src/js/pages/research.js` в класс `ResearchPage extends BasePage`

**Новая структура**:

```javascript
export class ResearchPage extends BasePage {
  constructor() {
    super({
      navigationSelector: '.research-navigation',
      imageSelector: '.research-card img'
    });
    this.loadingIndicator = null;
    this.researchCardTemplate = null;
  }
  
  async init() {
    await this.initBase();
    // Специфичная логика страницы исследований
  }
}
```

**Действия**:

1. Создать класс `ResearchPage extends BasePage`
2. Использовать `CardFactory.createResearchCard()` вместо локальной функции
3. Использовать `LoadingIndicatorService` вместо локальной функции
4. Использовать `DateFormatter` для форматирования дат
5. Использовать `StatusMapper` для маппинга статусов и типов
6. Использовать `PageReadyManager.waitForPageReady()` вместо дублированных функций
7. Удалить все дублированные функции:

   - `createResearchCard()` - использовать `CardFactory`
   - `hideLoadingIndicator()` - использовать `LoadingIndicatorService`
   - `showLoadingIndicator()` - удалить (debug код)
   - `getYearFromDate()` - использовать `DateFormatter`
   - `formatDate()` - использовать `DateFormatter`
   - `getStatusText()` - использовать `StatusMapper`
   - `getTypeText()` - использовать `StatusMapper`
   - `setActiveNavigationLink()` - использовать через `initBase()`
   - `initMenuButtonScroll()` - использовать через `initBase()`
   - `initScrollToTop()` - использовать через `initBase()`

**Удалить функции** (после выноса):

- `getYearFromDate()` (строки 48-59)
- `formatDate()` (строки 64-84)
- `getStatusText()` (строки 89-96)
- `getTypeText()` (строки 101-108)
- `createResearchCard()` (строки 113-243) - использовать `CardFactory`
- `hideLoadingIndicator()` (строки 267-317) - использовать `LoadingIndicatorService`
- `showLoadingIndicator()` (строки 326-464) - удалить (debug)
- `setActiveNavigationLink()` (строки 469-484)
- `initMenuButtonScroll()` (строки 489-516)
- `initScrollToTop()` - использовать через `initBase()`

**Удалить debug код**:

- `showLoadingIndicator()` (строки 326-464)
- Keyboard handlers (строки 739-777)

### 8.2. Обновить `src/js/main.js` для использования `ResearchPage`

## ЭТАП 9: РЕФАКТОРИНГ СТРАНИЦЫ COMMUNITY

### 9.1. Преобразовать `src/js/pages/community.js` в класс `CommunityPage extends BasePage`

**Новая структура**:

```javascript
export class CommunityPage extends BasePage {
  constructor() {
    super({
      navigationSelector: '.community-navigation',
      imageSelector: '.community-page img, .community-section img'
    });
    this.animationManager = null;
  }
  
  async init() {
    await this.initBase();
    // Специфичная логика страницы сообщества
  }
}
```

**Действия**:

1. Создать класс `CommunityPage extends BasePage`
2. Использовать `CardFactory.createCommunityCard()` вместо локальных функций
3. Использовать `CommunityAnimationManager` для всех анимаций
4. Использовать `PageReadyManager.waitForPageReady()` вместо дублированных функций
5. Вынести создание секций в отдельные методы класса:

   - `createDiscordSection()`
   - `createSocialSection()`
   - `createDonationsSection()`
   - `createWorkSection()`
   - `createEventsSection()`

6. Удалить все дублированные функции:

   - `createCommunityCard()` - использовать `CardFactory`
   - `createDiscordCard()` - использовать `CardFactory`
   - `waitForFontsLoaded()` - использовать `PageReadyManager`
   - `waitForImagesLoaded()` - использовать `PageReadyManager`
   - `waitForPageReady()` - использовать `PageReadyManager`
   - `setActiveNavigationLink()` - использовать через `initBase()`
   - `initMenuButtonScroll()` - использовать через `initBase()`
   - Все функции анимации - использовать `CommunityAnimationManager`

**Удалить функции** (после выноса):

- `waitForFontsLoaded()` (строки 13-30)
- `waitForImagesLoaded()` (строки 36-80)
- `waitForPageReady()` (строки 86-106)
- `createCommunityCard()` (строки 178-233) - использовать `CardFactory`
- `createDiscordCard()` (строки 238-297) - использовать `CardFactory`
- `setActiveNavigationLink()` (строки 523-538)
- `initMenuButtonScroll()` (строки 543-596)
- `initializeCommunityAnimations()` (строки 603-719) - использовать менеджер
- `hideAllCommunityElementsImmediately()` (строки 111-137) - вынести в менеджер

### 9.2. Обновить `src/js/main.js` для использования `CommunityPage`

## ЭТАП 10: РЕФАКТОРИНГ СТРАНИЦЫ 404

### 10.1. Улучшить `src/js/pages/NotFoundPage.js`

**Текущее состояние**: Класс уже наследуется от `BasePage`, но можно улучшить

**Действия**:

1. Убедиться, что используется `AnimationUtils` вместо прямого импорта
2. Убедиться, что используется `DomHelpers` (уже используется)
3. Улучшить структуру методов
4. Добавить JSDoc комментарии ко всем методам

### 10.2. Переименовать `src/js/pages/404.js` → `src/js/pages/NotFoundPageEntry.js`

**Действия**:

1. Создать новый файл `src/js/pages/NotFoundPageEntry.js`
2. Скопировать содержимое из `404.js`
3. Обновить импорт в файле
4. Обновить `vite.config.js` для нового имени файла
5. Обновить `src/404.html` для нового пути скрипта
6. Удалить старый файл `404.js`

**Альтернатива**: Оставить `404.js` как точку входа, но переименовать в `NotFoundPageEntry.js` для единообразия

## ЭТАП 11: РЕФАКТОРИНГ КОМПОНЕНТОВ (УДАЛЕНИЕ ОБЕРТОК)

### 11.1. Удалить файлы-обертки компонентов

**Файлы для удаления** (после обновления всех импортов):

1. `src/js/components/custom-cursor.js` - использовать напрямую `CustomCursor.js`
2. `src/js/components/language-switcher.js` - использовать напрямую `LanguageSwitcher.js`
3. `src/js/components/scroll-to-top.js` - использовать напрямую `ScrollToTopButton.js`
4. `src/js/components/svg-loader.js` - использовать напрямую `SvgLoader.js`
5. `src/js/components/theme-switcher.js` - использовать напрямую `ThemeSwitcher.js`
6. `src/js/components/scroll.js` - проверить использование, возможно удалить или переименовать
7. `src/js/components/slides.js` - использовать напрямую `SlidesManager.js`
8. `src/js/layout.js` - использовать напрямую `LayoutManager.js`

**Действия для каждого файла**:

1. Найти все импорты файла-обертки
2. Заменить импорты на прямые импорты классов
3. Обновить вызовы функций на использование классов
4. Удалить файл-обертку

**Файлы с импортами для обновления**:

- `src/js/main.js` - обновить все импорты компонентов

### 11.2. Создать `src/js/components/index.js` для централизованного экспорта

**Содержимое**:

```javascript
export { CustomCursor } from './custom-cursor/CustomCursor.js';
export { LanguageSwitcher } from './language/LanguageSwitcher.js';
export { ScrollToTopButton } from './scroll/ScrollToTopButton.js';
export { ScrollManager } from './scroll/ScrollManager.js';
export { SvgLoader } from './svg/SvgLoader.js';
export { ThemeSwitcher } from './theme/ThemeSwitcher.js';
export { SlidesManager } from './slides/SlidesManager.js';
```

## ЭТАП 12: РЕФАКТОРИНГ СТРАНИЦ (PASCALCASE)

### 12.1. Переименовать все файлы страниц в PascalCase

**Переименования**:

1. `src/js/pages/index.js` → `src/js/pages/IndexPage.js`
2. `src/js/pages/projects.js` → `src/js/pages/ProjectsPage.js`
3. `src/js/pages/cv.js` → `src/js/pages/CVPage.js`
4. `src/js/pages/research.js` → `src/js/pages/ResearchPage.js`
5. `src/js/pages/community.js` → `src/js/pages/CommunityPage.js`
6. `src/js/pages/404.js` → `src/js/pages/NotFoundPageEntry.js` (или оставить как есть)

**Действия для каждого файла**:

1. Создать новый файл с новым именем
2. Скопировать содержимое
3. Обновить все импорты этого файла в других местах
4. Обновить `vite.config.js` для новых путей
5. Обновить HTML файлы для новых путей скриптов
6. Удалить старый файл

### 12.2. Создать `src/js/pages/index.js` для централизованного экспорта

**Содержимое**:

```javascript
export { BasePage } from './BasePage.js';
export { IndexPage } from './IndexPage.js';
export { ProjectsPage } from './ProjectsPage.js';
export { CVPage } from './CVPage.js';
export { ResearchPage } from './ResearchPage.js';
export { CommunityPage } from './CommunityPage.js';
export { NotFoundPage } from './NotFoundPage.js';
```

## ЭТАП 13: СОЗДАНИЕ INDEX ФАЙЛОВ ДЛЯ ЭКСПОРТА

### 13.1. Создать `src/js/factories/index.js`

**Содержимое**:

```javascript
export { CardFactory } from './CardFactory.js';
```

### 13.2. Создать `src/js/managers/index.js`

**Содержимое**:

```javascript
export { SlideAnimationManager } from './SlideAnimationManager.js';
export { ProjectFiltersManager } from './ProjectFiltersManager.js';
export { ProjectGroupingManager } from './ProjectGroupingManager.js';
export { CVAnimationManager } from './CVAnimationManager.js';
export { CommunityAnimationManager } from './CommunityAnimationManager.js';
```

### 13.3. Создать `src/js/layout/index.js`

**Содержимое**:

```javascript
export { LayoutManager } from './LayoutManager.js';
```

## ЭТАП 14: ОБНОВЛЕНИЕ MAIN.JS

### 14.1. Полный рефакторинг `src/js/main.js`

**Текущее состояние**: Импортирует функции и вызывает их

**Новая структура**:

```javascript
import { IndexPage } from './pages/IndexPage.js';
import { ProjectsPage } from './pages/ProjectsPage.js';
import { CVPage } from './pages/CVPage.js';
import { ResearchPage } from './pages/ResearchPage.js';
import { CommunityPage } from './pages/CommunityPage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';

// Определение текущей страницы и инициализация соответствующего класса
async function initCurrentPage() {
  const path = window.location.pathname;
  const pageName = path.split('/').pop() || 'index.html';
  
  let pageInstance = null;
  
  if (pageName === 'index.html' || pageName === '' || path === '/') {
    pageInstance = new IndexPage();
  } else if (pageName === 'projects.html') {
    pageInstance = new ProjectsPage();
  } else if (pageName === 'cv.html') {
    pageInstance = new CVPage();
  } else if (pageName === 'research.html') {
    pageInstance = new ResearchPage();
  } else if (pageName === 'community.html') {
    pageInstance = new CommunityPage();
  } else if (pageName === '404.html') {
    pageInstance = new NotFoundPage();
  }
  
  if (pageInstance) {
    await pageInstance.init();
  }
}

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCurrentPage);
} else {
  initCurrentPage();
}
```

**Действия**:

1. Удалить все старые импорты функций
2. Импортировать все классы страниц
3. Создать функцию определения текущей страницы
4. Создать экземпляр соответствующего класса
5. Вызвать метод `init()`

## ЭТАП 15: ОБНОВЛЕНИЕ VITE.CONFIG.JS

### 15.1. Обновить пути к входным точкам

**Текущие пути**:

- `src/index.html`
- `src/projects.html`
- `src/cv.html`
- `src/community.html`
- `src/research.html`
- `src/404.html`

**Обновить rollupOptions.input**:

- Обновить пути к JS файлам страниц на новые имена (PascalCase)
- Убедиться, что все пути корректны

### 15.2. Обновить пути к статическим файлам

**Проверить**:

- Пути к favicon (должен быть в public/)
- Пути к pdfjs (должен быть в public/)
- Все статические ресурсы должны быть в public/

## ЭТАП 16: ОБНОВЛЕНИЕ HTML ФАЙЛОВ

### 16.1. Обновить пути к скриптам во всех HTML файлах

**Файлы для обновления**:

1. `src/index.html` - обновить путь к `IndexPage.js`
2. `src/projects.html` - обновить путь к `ProjectsPage.js`
3. `src/cv.html` - обновить путь к `CVPage.js`
4. `src/research.html` - обновить путь к `ResearchPage.js`
5. `src/community.html` - обновить путь к `CommunityPage.js`
6. `src/404.html` - обновить путь к `NotFoundPageEntry.js` или оставить `404.js`

**Действия**:

1. Найти все `<script type="module" src="/js/pages/...">` теги
2. Обновить пути на новые имена файлов
3. Проверить пути к favicon (должен быть `/favicon.svg`)

## ЭТАП 17: УДАЛЕНИЕ DEBUG КОДА

### 17.1. Удалить debug функции из projects.js

**Функции для удаления**:

- `showLoadingIndicator()` (строки 981-1103)
- `showEmptyProjectsMessage()` (строки 1108-1132)
- Keyboard handlers (строки 1810-1854)

### 17.2. Удалить debug функции из research.js

**Функции для удаления**:

- `showLoadingIndicator()` (строки 326-464)
- Keyboard handlers (строки 739-777)

### 17.3. Проверить другие файлы на наличие debug кода

**Файлы для проверки**:

- `src/js/pages/index.js`
- `src/js/pages/cv.js`
- `src/js/pages/community.js`

## ЭТАП 18: ОПТИМИЗАЦИЯ И ОЧИСТКА

### 18.1. Проверка неиспользуемых импортов

**Действия**:

1. Проверить все файлы на неиспользуемые импорты
2. Удалить неиспользуемые импорты
3. Использовать линтер для проверки

### 18.2. Удаление неиспользуемых переменных и функций

**Действия**:

1. Проверить все файлы на неиспользуемые переменные
2. Удалить неиспользуемые переменные
3. Проверить на неиспользуемые функции (кроме публичных методов классов)

### 18.3. Проверка дублирования кода

**Действия**:

1. Проверить наличие дублированного кода между файлами
2. Вынести дублированный код в утилиты или базовые классы
3. Использовать общие функции везде, где возможно

### 18.4. Удаление неиспользуемых зависимостей

**Действия**:

1. Проверить `package.json` на неиспользуемые зависимости
2. Удалить неиспользуемые зависимости
3. Обновить зависимости при необходимости

## ЭТАП 19: ДОКУМЕНТАЦИЯ

### 19.1. Создать `docs/ARCHITECTURE.md`

**Содержимое**:

- Описание архитектуры приложения
- Структура классов и наследование
- Описание менеджеров и их назначение
- Описание сервисов и их использование
- Схема взаимодействия компонентов

### 19.2. Создать `docs/COMPONENTS.md`

**Содержимое**:

- Описание всех компонентов
- API каждого компонента
- Примеры использования
- Зависимости компонентов

### 19.3. Создать `docs/SERVICES.md`

**Содержимое**:

- Описание всех сервисов
- API каждого сервиса
- Примеры использования
- Конфигурация сервисов

### 19.4. Создать `docs/MANAGERS.md`

**Содержимое**:

- Описание всех менеджеров
- API каждого менеджера
- Примеры использования
- Взаимодействие менеджеров

### 19.5. Обновить `README.md`

**Добавить**:

- Новую структуру проекта
- Описание архитектуры
- Инструкции по разработке
- Ссылки на документацию

## ЭТАП 20: СТАНДАРТИЗАЦИЯ КОДА

### 20.1. Проверка единообразия именования

**Правила**:

- Классы: PascalCase (`IndexPage`, `CardFactory`)
- Методы: camelCase (`init()`, `loadData()`)
- Константы: UPPER_SNAKE_CASE (`ANIMATION_CONFIG`)
- Переменные: camelCase (`projectData`, `isLoading`)

**Действия**:

1. Проверить все файлы на соответствие правилам
2. Исправить несоответствия
3. Использовать линтер для проверки

### 20.2. Проверка единообразия экспортов

**Правила**:

- Классы: named exports (`export class IndexPage`)
- Утилиты: named exports (`export function formatDate()`)
- Константы: named exports (`export const CONFIG`)
- По умолчанию: только для точек входа (index.js файлы)

**Действия**:

1. Проверить все файлы на соответствие правилам
2. Исправить несоответствия
3. Убедиться, что все экспорты через index.js файлы

### 20.3. Проверка единообразия комментариев

**Правила**:

- JSDoc для всех публичных методов классов
- JSDoc для всех экспортируемых функций
- Комментарии для сложной логики
- Комментарии на русском языке (как в текущем коде)

**Действия**:

1. Добавить JSDoc ко всем публичным методам
2. Добавить комментарии к сложной логике
3. Проверить единообразие стиля комментариев

### 20.4. Проверка единообразия структуры файлов

**Правила**:

- Импорты в начале файла
- Класс/функции в середине
- Экспорты в конце (если не inline)
- Пустые строки между секциями

**Действия**:

1. Проверить структуру всех файлов
2. Привести к единому стилю
3. Использовать линтер для проверки

## ЭТАП 21: ТЕСТИРОВАНИЕ

### 21.1. Проверка работы всех страниц

**Страницы для проверки**:

1. Главная страница (`index.html`)

   - Загрузка featured проектов
   - Анимации слайдов
   - Навигация
   - Кнопка "Наверх"

2. Страница проектов (`projects.html`)

   - Загрузка проектов
   - Фильтрация
   - Группировка
   - Анимации карточек

3. Страница резюме (`cv.html`)

   - Загрузка данных CV
   - Отображение секций
   - Анимации

4. Страница исследований (`research.html`)

   - Загрузка публикаций
   - Группировка по годам
   - Отображение ВКР
   - Анимации карточек

5. Страница сообщества (`community.html`)

   - Загрузка данных
   - Отображение секций
   - Анимации

6. Страница 404 (`404.html`)

   - Отображение сообщения
   - Навигация
   - Анимации

### 21.2. Проверка импортов и путей

**Проверить**:

- Все импорты корректны
- Все пути к файлам правильные
- Нет циклических зависимостей
- Все модули загружаются корректно

### 21.3. Проверка производительности

**Проверить**:

- Время загрузки страниц
- Размер бандлов
- Количество запросов
- Использование памяти

## ЭТАП 22: ФИНАЛЬНАЯ ПРОВЕРКА

### 22.1. Чеклист рефакторинга

**Проверить**:

- [ ] Все данные в `public/data/`, `src/data/` удалена
- [ ] Все статические файлы в `public/`
- [ ] Все страницы преобразованы в классы
- [ ] Все страницы наследуются от `BasePage`
- [ ] Все утилиты переименованы в PascalCase
- [ ] Все сервисы переименованы в PascalCase
- [ ] Все страницы переименованы в PascalCase
- [ ] Все файлы-обертки удалены
- [ ] Все менеджеры созданы и используются
- [ ] Все дублированные функции удалены
- [ ] Все debug функции удалены
- [ ] Все импорты обновлены
- [ ] `vite.config.js` обновлен
- [ ] Все HTML файлы обновлены
- [ ] `main.js` обновлен
- [ ] Код стандартизирован
- [ ] Все страницы работают корректно

### 22.2. Финальная очистка

**Действия**:

1. Удалить все временные файлы
2. Удалить все закомментированные блоки кода
3. Удалить все console.log (кроме необходимых)
4. Проверить на наличие TODO комментариев
5. Обновить версию в package.json (если нужно)