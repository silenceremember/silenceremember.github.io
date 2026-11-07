"""Статические страницы сайта-портфолио, версия 2: главная, 4 кейса, услуги.

Запуск из корня репозитория: npm run gen (или python tools/gen_pages.py [--out <папка>]).
Пишет src/index.html, src/services.html и 7 кейсов src/case-*.html; эти файлы руками не правят.
Проверка, что src совпадает с генератором: npm run gen:check.
Правила голоса: числа и имена вместо прилагательных, про ИИ коротко в «Роли»,
без «не X, а Y», без «от X до Y», двоеточие только перед перечнем или числом.
"""
import html, re, sys, pathlib

# Пути от корня репозитория; --out <папка> пишет страницы в <папка>/src (для сравнения), картинки ищутся в репозитории
S = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(sys.argv[sys.argv.index('--out') + 1]).resolve() if '--out' in sys.argv else S
SITE = 'https://silenceremember.github.io'
# Критический CSS один на все страницы: метку заменяет vite-plugin-site-shell (src/partials/critical.css)
CRIT = '<!-- critical-css: вставляет vite-plugin-site-shell из src/partials/critical.css -->'
TG = 'https://t.me/silenceremember'
MAIL = 'mailto:slcrmmbr@outlook.com'


def t(ru, en, tag='span', cls=''):
    c = f' {cls}' if cls else ''
    return f'<{tag} class="i18n-ru{c}">{ru}</{tag}><{tag} class="i18n-en{c}" lang="en">{en}</{tag}>'


def p(ru, en):
    return t(ru, en, 'p')


def esc(s):
    return html.escape(s, quote=True)


EN_META = {
    'case-ux-audit-leti.html': ('UX audit of the LETI admissions website | Maxim Elchaninov', 'The paid admission path: 8 findings, 4 critical, rechecked 2.5 months later.'),
    'case-capybara-bunk.html': ('Capybara Bunk: multiplayer interface | Maxim Elchaninov', 'Interface for a multiplayer game: menus, host and client lobby, HUD, pause, scoreboard and confirmation dialogs.'),
    'case-gridsnap.html': ('Gridsnap for Unity Shader Graph | Maxim Elchaninov', 'Unity add-on: grid and snapping in Shader Graph, logo and promo. Unity Asset Store.'),
    'case-architecture-rendering.html': ('Architecture Rendering: a portfolio game | Maxim Elchaninov', 'A Unity game with an ironic narrator: the menu is painted on the room floor, the settings hang on the wall.'),
    'case-shards-of-sanity.html': ('Shards of Sanity: a co‑op shooter with tower defence | Maxim Elchaninov', 'A first-person co‑op shooter with tower defence and roguelite runs. Art direction and game design: emblem, interface, enemy concepts, documentation.'),
    'case-bite.html': ('B.I.T.E.: an asymmetric vampire RTS | Maxim Elchaninov', 'An asymmetric multiplayer RTS by Ingvik Studios: 10 humans against 2 vampires. Game design of vampire skills and faction upgrades.'),
    'case-wobbledink.html': ('Wobbledink: a documentation system | Maxim Elchaninov', "A documentation system in three formats: the team’s web app, a Google Docs extension and a VS Code reader."),
    'services.html': ('Services | Maxim Elchaninov', 'Game design and art direction, game and website interfaces, UX audits, documentation systems, Unity tools. Remote, with examples of work.'),
    'index.html': ('Maxim Elchaninov: game design and interfaces', 'Maxim Elchaninov: game design and interfaces. Vampire skills for the RTS B.I.T.E., art direction for Shards of Sanity, a UX audit of the LETI website. PhD student at ETU “LETI”.'),
}
ALT_EN = {
    'Лобби хоста: игроки, кланы, карта и кнопка старта': 'Host lobby: players, clans, map and the start button',
    'Лобби клиента': 'Client lobby',
    'Меню паузы хоста со статистикой': 'Host pause menu with statistics',
    'Меню паузы клиента': 'Client pause menu',
    'Восемь диалогов подтверждения Capybara Bunk': 'Eight Capybara Bunk confirmation dialogs',
    'Интерфейс боя Capybara Bunk поверх референсного кадра': 'Capybara Bunk in-game HUD over a reference frame',
    'Таблица счёта': 'Scoreboard',
    'Итоги раунда': 'Round results',
    'Итоги матча': 'Match results',
    'Демо-документ Wobbledink в Google Docs с открытой карточкой термина': 'Wobbledink demo document in Google Docs with a term card open',
    'Улучшения Храмовников из таблицы': 'Templar upgrades from the spreadsheet',
    'Сеттинг Capybara Bunk': 'Capybara Bunk setting',
    'Трёхактный сюжет Capybara Bunk': 'Capybara Bunk three-act story',
    'Вампир Крови среди гулей у реки': 'A Blood vampire among ghouls by the river',
    'Алый фонтан: гули после взрыва крови': 'Scarlet Fountain: ghouls after the blood burst',
    'Выслеживание: раненый враг виден сквозь туман': 'Blood Track: a wounded enemy seen through the fog',
    'Схема навыков вампиров по трём веткам': 'Vampire skills across three branches',
    'Строитель Храмовников возводит шахту': 'A Templar builder raising a mine',
    'Концепт Храмовников': 'Templar concept',
    'Лес на карте B.I.T.E.': 'The forest on the B.I.T.E. map',
    'Строитель уходит Скачком от вампира в лесу': 'A builder Blinks away from a vampire in the forest',
    'Веб-приложение Wobbledink: документ со статусом': 'Wobbledink web app: a document with a status',
    'Документ Google Docs с маркерами Wobbledink': 'A Google Docs document with Wobbledink markers',
    'Портал из Лимба в Виток': 'Portal from Limbo to a Coil',
    'Бой на миссии': 'A fight on a mission',
    'Меню паузы': 'Pause menu',
    'Концепт врага Bellows': 'Bellows enemy concept',
    'Концепт мини-игр Лимба': 'Limbo mini-games concept',
    'Концепт-документ в Wobbledink Light': 'A concept document in Wobbledink Light',
    'Лимб, хаб между миссиями': 'Limbo, the hub between missions',
    'Эмблема и рабочая надпись Shards of Sanity': 'Shards of Sanity emblem and working wordmark',
    'Wobbledink G-Docs в Google Docs': 'Wobbledink G-Docs in Google Docs',
    'Первый экран портала abit.etu.ru': 'First screen of the abit.etu.ru portal',
    'Главное меню Capybara Bunk': 'Capybara Bunk main menu',
    'Стайлшит интерфейса Capybara Bunk': 'Capybara Bunk UI stylesheet',
    'Ключевой визуал Gridsnap': 'Gridsnap key visual',
    'Переключатели в тулбаре Shader Graph': 'Toggles in the Shader Graph toolbar',
    'Промо-слайд Gridsnap': 'Gridsnap promo slide',
    'Главное меню на полу комнаты': 'Main menu painted on the room floor',
    'Настройки на стене комнаты': 'Settings on the room wall',
}


def page(slug, title_ru, desc_ru, og, body, page_class, body_class='', og_type='article'):
    url = f'{SITE}/' + ('' if slug == 'index.html' else slug)
    title_en, desc_en = EN_META[slug]
    return f'''<!doctype html>
<!-- Сгенерировано tools/gen_pages.py (npm run gen): правки вносить в генератор, не в этот файл -->
<html lang="ru" data-title-ru="{esc(title_ru)}" data-title-en="{esc(title_en)}" data-desc-ru="{esc(desc_ru)}" data-desc-en="{esc(desc_en)}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>{esc(title_ru)}</title>
    <meta name="description" content="{esc(desc_ru)}" />
    <meta name="author" content="Максим Ельчанинов" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta name="theme-color" content="#d90429" />
    <meta name="color-scheme" content="dark" />
    <link rel="canonical" href="{url}" />
    <meta property="og:type" content="{og_type}" />
    <meta property="og:url" content="{url}" />
    <meta property="og:title" content="{esc(title_ru)}" />
    <meta property="og:description" content="{esc(desc_ru)}" />
    <meta property="og:image" content="{SITE}/{og}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="ru_RU" />
    <meta property="og:site_name" content="Максим Ельчанинов" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{esc(title_ru)}" />
    <meta name="twitter:description" content="{esc(desc_ru)}" />
    <meta name="twitter:image" content="{SITE}/{og}" />
{JSONLD if slug == 'index.html' else ''}
    <script>
      (function () {{
        if (localStorage.getItem('language') === 'en') document.documentElement.setAttribute('lang', 'en');
      }})();
    </script>
    {CRIT}
    <link rel="icon" type="image/png" href="/favicon/favicon-96x96.png" sizes="96x96" />
    <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
    <link rel="shortcut icon" href="/favicon/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
    <link rel="manifest" href="/favicon/site.webmanifest" />
    <script src="/js/components/ThemeInit.js"></script>
    <script src="/js/analytics.js" defer></script>
    <link rel="stylesheet" href="/scss/style.scss" />
  </head>
  <body class="page-with-scroll static-page {body_class}">
    <a class="skip-link" href="#main">{t('К содержанию', 'Skip to content')}</a>
    <div class="page-wrapper">
      <div id="background-container"></div>
      <header class="header"></header>
      <div class="decorative-line-horizontal"></div>
      <main class="content-wrapper" id="main">
        <div class="container {page_class}">
{body}
        </div>
      </main>
      <div class="decorative-line-horizontal"></div>
      <footer class="footer"></footer>
    </div>
    <div class="custom-cursor"></div>
    <div id="scroll-to-top-container"></div>
    <script type="module" src="/js/main.js"></script>
  </body>
</html>
'''


JSONLD = '''    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Maxim Elchaninov",
      "alternateName": ["Максим Ельчанинов", "silenceremember"],
      "jobTitle": "Interface and Game Designer",
      "affiliation": {"@type": "CollegeOrUniversity", "name": "ETU \\"LETI\\""},
      "url": "https://silenceremember.github.io",
      "sameAs": ["https://www.linkedin.com/in/silenceremember/", "https://t.me/silenceremember"],
      "email": "slcrmmbr@outlook.com",
      "image": "https://silenceremember.github.io/assets/images/portrait.webp"
    }
    </script>'''


def variant(src, w):
    """Путь к уменьшенной копии картинки (assets/...-800w.webp), если она есть в public."""
    v = src[:-5] + f'-{w}w.webp' if src.endswith('.webp') else None
    return v if v and (S / 'public' / v).exists() else None


def srcset(src, w, sizes):
    """srcset с копией 800w для телефонов: 800 px вместо 1600 px на мобильной сети."""
    v = variant(src, 800)
    return f' srcset="/{v} 800w, /{src} {w}w" sizes="{sizes}"' if v else ''


def fig(src, alt, cap_ru=None, cap_en=None, w=1600, h=900, eager=False, link=True, src_en=None):
    load = 'eager' if eager else 'lazy'
    alt_en = ALT_EN.get(alt) or (cap_en if alt == cap_ru else None)
    if not alt_en:
        print('WARN no EN alt:', alt)
    sen = f' data-src-en="/{src_en}"' if src_en else ''
    # У картинок с отдельной EN-версией srcset не ставим: переключатель языка меняет только src
    sset = '' if src_en else srcset(src, w, '(max-width: 1023px) calc(100vw - 64px), 1104px')
    prio = ' fetchpriority="high"' if eager else ''
    img = f'<img src="/{src}"{sset}{sen} alt="{esc(alt)}" data-alt-en="{esc(alt_en or alt)}" width="{w}" height="{h}" loading="{load}"{prio} decoding="async" />'
    if link:
        hen = f' data-href-en="/{src_en}"' if src_en else ''
        img = f'<a href="/{src}"{hen} data-lightbox>{img}</a>'
    cap = f'<figcaption>{t(cap_ru, cap_en)}</figcaption>' if cap_ru else ''
    return f'<figure class="case-figure">{img}{cap}</figure>'


def meta(items):
    cells = ''.join(f'<div class="case-meta-item"><dt>{t(a, b)}</dt><dd>{t(c, d)}</dd></div>' for a, b, c, d in items)
    return f'<dl class="case-meta">{cells}</dl>'


def section(title_ru, title_en, inner, cls=''):
    return (f'<section class="case-section {cls}"><h2 class="case-section-title">{t(title_ru, title_en)}</h2>'
            f'<div class="case-section-body">{inner}</div></section>')


def ul(items):
    return '<ul class="case-list">' + ''.join(f'<li>{t(a, b)}</li>' for a, b in items) + '</ul>'


def button(href, ru, en, primary=False, external=False):
    cls = 'cta-button cta-button-primary' if primary else 'cta-button'
    ext = ' target="_blank" rel="noopener noreferrer"' if external else ''
    return f'<a href="{href}" class="{cls}"{ext}>{t(ru, en)}</a>'


def contact_block(title_ru='Написать мне', title_en='Get in touch'):
    return f'''<section class="case-cta">
            <h2 class="case-cta-title">{t(title_ru, title_en)}</h2>
            <div class="cta-buttons cta-buttons-primary">
              {button(TG, 'Telegram', 'Telegram', primary=True, external=True)}
              {button(MAIL, 'Почта', 'Email')}
            </div>
          </section>'''


def next_case(href, ru, en):
    return (f'<a class="case-next" href="{href}"><span class="case-next-label">{t("Следующий кейс", "Next case")}</span>'
            f'<span class="case-next-title">{t(ru, en)}</span></a>')


def hero(kicker_ru, kicker_en, title_ru, title_en, lead_ru, lead_en, meta_html, cover_html):
    return f'''<article class="case">
          <header class="case-hero">
            <a class="case-back" href="/projects.html">{t('Все кейсы', 'All cases')}</a>
            <h1 class="case-title">{t(title_ru, title_en)}</h1>
            <p class="case-lead">{t(lead_ru, lead_en)}</p>
            {meta_html}
          </header>
          {cover_html}'''


PAGES = {}

# ================================================================ UX audit
F = 'assets/images/projects/ux-audit-leti'
findings = [
    ('P0', 4, 'Главная кнопка ниже первого экрана (сезонная)', 'Main call to action below the fold (seasonal)',
     'Промо-блоки занимают первый экран, «Подать документы» приходится искать прокруткой.', 'Promo blocks take the first screen; “Apply” is found only after scrolling.'),
    ('P0', 6, 'В карточке есть платные места, но нет цены', 'Fee-paying places listed, no price',
     'В строке программы есть «Платные места: 80», стоимости нет.', 'The programme row shows “Paid places: 80” and no cost.'),
    ('P0', 7, 'Цена без годового итога', 'Price without a yearly total',
     '180 тыс. руб. за первый семестр легко принять за годовую сумму.', '180k RUB for the first semester is easy to mistake for the yearly fee.'),
    ('P0', 9, 'Канал подачи не ведёт к действию', 'Application channel leads nowhere',
     'Новость требует подавать через Госуслуги, ссылки на них нет.', 'The news says to apply via Gosuslugi and gives no link.'),
    ('P1', 3, 'Переход открывает отдельный портал', 'The link opens a separate portal',
     '«Поступающим» открывает abit.etu.ru в новой вкладке, шапка и навигация меняются.', '“Applicants” opens abit.etu.ru in a new tab; header and navigation change.'),
    ('P1', 5, 'Каталог трудно сравнивать', 'Catalogue is hard to compare',
     'Лента аккордеонов без поиска и сравнения.', 'An accordion list with no search or comparison.'),
    ('P1', 8, 'Базовая цена спрятана после скидок', 'Base price hidden after discounts',
     'Скидки идут раньше цены, таблица цен ниже прокрутки.', 'Discounts come before the price; the price table is below the fold.'),
    ('P2', 10, 'В пяти шагах нет платного пути', 'No paid path in the five steps',
     'В пошаговой инструкции нет договора и оплаты.', 'The step-by-step guide has no contract or payment step.'),
]
CAPS = {4: ('Первый экран: слайдер «Выбирайте ЛЭТИ!» и важные даты, кнопки подачи нет', 'First screen: the “Choose LETI!” slider and key dates, no apply button'), 6: ('Раскрытая строка 01.03.02: экзамены, бюджетные и платные места, цены нет', 'Expanded row 01.03.02: exams, state-funded and fee-paying places, no price'), 7: ('Страница 01.03.02: 180 тыс. руб. за первый семестр, суммы за год нет', 'Programme 01.03.02: 180k RUB for the first semester, no yearly total'), 9: ('Новость о правилах приёма 2026: подать дистанционно можно только через Госуслуги, ссылки нет', '2026 admission rules news item: remote applications only via Gosuslugi, no link')}
rows = ''
for prio, n, tr, te, dr, de in findings:
    body_html = (f'<div class="finding-body"><span class="finding-prio finding-prio-{prio.lower()}">{prio}</span>'
                 f'<h3 class="finding-title">{t(tr, te)}</h3>{p(dr, de)}</div>')
    if prio == 'P0':
        cr, ce = CAPS[n]
        rows += f'<li class="finding finding--shot">{body_html}{fig(f"{F}/finding-{n:02d}.webp", cr, cr, ce, 1400, 824)}</li>'
    else:
        rows += f'<li class="finding">{body_html}</li>'
body = hero('UX-аудит · веб · 2026', 'UX audit · web · 2026',
            'UX-аудит сайта приёмной ЛЭТИ', 'UX audit of the LETI admissions website',
            'Как абитуриенту выбрать программу, понять цену платного обучения и подать документы. Я прошёл этот путь на сайтах ЛЭТИ и записал, где он рвётся.',
            'How an applicant picks a programme, understands the price of paid tuition and applies. I walked that path on the LETI websites and wrote down where it breaks.',
            meta([('Роль', 'Role', 'UX-аудитор; слайды свёрстаны с ИИ', 'UX auditor; slides laid out with AI'),
                  ('Команда', 'Team', 'Соло', 'Solo'),
                  ('Год', 'Year', '2026', '2026'),
                  ('Итог', 'Outcome', '5 страниц, 2 домена: 8 находок, 4 критичные', '5 pages, 2 domains: 8 findings, 4 critical')]),
            fig(f'{F}/cover.webp', 'Первый экран портала abit.etu.ru', w=1600, h=900, eager=True))
body += section('Сценарий', 'Scenario',
                p('Абитуриент выбирает программу, смотрит, сколько стоит платное обучение, и идёт подавать документы. По дороге он проходит главный сайт, портал абитуриента, каталог программ и страницу с ценами и правилами, а подавать уходит на Госуслуги.',
                  'An applicant picks a programme, checks what paid tuition costs and goes to apply. On the way they pass the main site, the applicant portal, the programme catalogue and the prices and rules page, then leave for Gosuslugi to apply.')
                + p('Всё нужное на сайтах есть, но разнесено: цена, места и путь к подаче лежат на разных страницах и двух доменах.',
                    'Everything is there, but scattered: price, places and the way to apply sit on different pages and two domains.'))
body += section('Что сломано', "What's broken", f'<ol class="findings">{rows}</ol>')
body += section('Что править первым', 'Fix first',
                ul([('Кнопка «Подать через Госуслуги» в новости, шапке портала и на страницах программ.', 'An “Apply via Gosuslugi” button in the news item, the portal header and programme pages.'),
                    ('Рядом с ценой семестра ориентир за год и дата, на которую цена верна.', 'A yearly estimate and validity date next to the semester price.'),
                    ('Цена в раскрытой строке каталога и фильтр по цене.', 'Price in the expanded catalogue row and a price filter.'),
                    ('«Подать документы» и «Выбрать программу» на первом экране портала.', '“Apply” and “Choose a programme” on the portal\'s first screen.')])
                + p('Порядок такой: сначала путь к подаче и цена за год, потом каталог. Таблица с оценкой эффекта и затрат есть в PDF.',
                    'Order: the path to applying and the yearly price first, the catalogue after. The impact and effort table is in the PDF.'))
body += section('Через 2,5 месяца', '2.5 months later',
                p('5 ноября 2026 года я заново прошёл сценарий на живом сайте: 7 находок из 8 на месте. Восьмая сезонная: вне приёмной кампании кнопки «Подать документы» на главной портала нет совсем.',
                  'On 5 November 2026 I walked the scenario again on the live site: 7 of 8 findings are still there. The eighth is seasonal: outside the admission campaign there is no “Apply” button on the portal home page at all.')
                + p('Что на сайтах сделано хорошо: отдельный портал для поступающих, места, баллы и цена на странице программы, понятные контакты приёмной комиссии.',
                    'What works: a dedicated applicant portal, places, scores and price on the programme page, clear admissions contacts.')
                + p('Ограничения: публичная desktop-версия, без аналитики, интервью и юзабилити-тестов. Это демо для портфолио, университет его не заказывал.',
                    'Limits: public desktop version, no analytics, interviews or usability tests. This is a portfolio demo; the university did not commission it.')
                + '<div class="case-actions">' + button('/assets/documents/cases/UX-audit_LETI_demo_2026.pdf', 'PDF, 12 слайдов', 'PDF, 12 slides', external=True) + '</div>')
body += contact_block() + next_case('/case-capybara-bunk.html', 'Capybara Bunk: интерфейс мультиплеера', 'Capybara Bunk: multiplayer interface')
body += '\n        </article>'
PAGES['case-ux-audit-leti.html'] = page('case-ux-audit-leti.html', 'UX-аудит сайта приёмной ЛЭТИ | Максим Ельчанинов',
                                         'Сценарий поступления на платное обучение: 8 находок, 4 критичные, перепроверка через 2,5 месяца.',
                                         'assets/images/og/og-ux-audit-leti.jpg', body, 'case-page')

# ================================================================ Capybara Bunk
C = 'assets/images/projects/capybara-bunk'
gallery = fig(f'{C}/main-menu.webp', 'Главное меню Capybara Bunk', 'Главное меню', 'Main menu', 1600, 900)
body = hero('Интерфейс игры · Figma · 2025', 'Game UI · Figma · 2025',
            'Capybara Bunk: интерфейс мультиплеера', 'Capybara Bunk: multiplayer interface',
            'Шутер с видом сверху, который делала команда 2IQ. Я вёл команду из пяти человек, рисовал экраны (меню, лобби, HUD, итоги матча, диалоги подтверждения) и написал сеттинг и сюжет.',
            'A top-down shooter by the 2IQ team. I led five people, drew the screens (menus, lobby, HUD, match results, confirmation dialogs) and wrote the setting and story.',
            meta([('Роль', 'Role', 'Тимлид, гейм-дизайнер, UI, нарратив; Figma, Miro', 'Team lead, game designer, UI, narrative; Figma, Miro'),
                  ('Команда', 'Team', '2IQ, 5 человек', '2IQ, 5 people'),
                  ('Год', 'Year', '2025', '2025')]),
            fig(f'{C}/preview.webp', 'Стайлшит интерфейса Capybara Bunk', 'Стайлшит: цвета, шрифты, кнопки и состояния', 'Stylesheet: colours, fonts, buttons and states', 1232, 693, eager=True))
body += section('Хост и клиент', 'Host and client',
                p('У хоста больше прав: он выгоняет игроков, распускает лобби и заканчивает матч. Клиент может только выйти. Поэтому лобби и меню паузы нарисованы в двух вариантах, и каждый видит только свои кнопки.',
                  'The host has more rights: kicking players, disbanding the lobby, ending the match. A client can only leave. So the lobby and pause menu exist in two variants, and each player sees only their own buttons.')
                + p('Ниже концепты экранов для MVP-версии из Figma.', 'Below are the screen concepts for the MVP version, from Figma.')
                + fig(f'{C}/mvp/lobby-host.webp', 'Лобби хоста: игроки, кланы, карта и кнопка старта', 'Лобби хоста: готовность игроков, выбор клана, карта, счёт и время, кнопки «Выгнать» и «Начать матч»', 'Host lobby: player readiness, clan choice, map, score and time, Kick and Start match', 1456, 818)
                + fig(f'{C}/mvp/lobby-client.webp', 'Лобби клиента', 'Лобби клиента: те же таблицы без прав хоста, вместо старта матча условия старта', 'Client lobby: the same tables without host rights; start requirements instead of the start button', 1456, 818)
                + fig(f'{C}/mvp/pause-host.webp', 'Меню паузы хоста со статистикой', 'Пауза хоста: статистика матча, «Закончить матч», «Распустить матч», «Выгнать»', 'Host pause: match statistics, End match, Disband match, Kick', 1456, 818)
                + fig(f'{C}/mvp/pause-client.webp', 'Меню паузы клиента', 'Пауза клиента: та же статистика, из действий только «Продолжить» и «Выйти из матча»', 'Client pause: the same statistics; the only actions are Resume and Leave match', 1456, 818))
body += section('Подтверждения', 'Confirmations',
                p('Всё, что ломает игру другим, спрашивает подтверждение. Таких диалогов восемь: выйти из игры, распустить лобби, выйти из лобби, выгнать игрока в лобби и в матче, закончить матч, распустить матч, выйти из матча. В каждом под вопросом одна строка о последствиях, например «Игроки вернутся в лобби».',
                  'Anything that breaks the game for others asks for confirmation. There are eight such dialogs: quit game, disband lobby, leave lobby, kick a player in the lobby and in a match, end match, disband match, leave match. Each has one line under the question about the consequence, such as “All players will return to the lobby”.')
                + fig(f'{C}/mvp/dialogs.webp', 'Восемь диалогов подтверждения Capybara Bunk', 'Диалоги подтверждения: вопрос, последствие и две кнопки', 'Confirmation dialogs: question, consequence and two buttons', 1421, 829))
body += section('Экраны', 'Screens',
                ul([('Итоги раунда, итоги матча и таблица счёта собраны по одной структуре.', 'Round results, match results and the scoreboard share one structure.'),
                    ('Мудборд по Overwatch 2, For Honor, Battlefield и DJMAX.', 'Moodboard drawn from Overwatch 2, For Honor, Battlefield and DJMAX.')])
                + gallery
                + fig(f'{C}/mvp/hud.webp', 'Интерфейс боя Capybara Bunk поверх референсного кадра', 'Интерфейс боя поверх референсного кадра: здоровье и выносливость, таймер, способность клана, оружие и патроны. Фон взят из чужой игры для масштаба', 'In-game HUD over a reference frame: health and stamina, timer, clan ability, weapons and ammo. The background is from another game, used for scale', 1456, 818)
                + fig(f'{C}/mvp/scoreboard.webp', 'Таблица счёта', 'Таблица счёта во время матча: живые игроки, карта и время', 'In-match scoreboard: players alive, map and time', 1456, 818)
                + fig(f'{C}/mvp/round-end.webp', 'Итоги раунда', 'Итоги раунда: победитель и счёт, отсчёт до следующего раунда', 'Round results: the winner and the score, countdown to the next round', 1456, 818)
                + fig(f'{C}/mvp/match-end.webp', 'Итоги матча', 'Итоги матча: голосование за реванш или возврат в лобби', 'Match results: vote for a rematch or a return to the lobby', 1456, 818))
body += section('Сеттинг и сюжет', 'Setting and story',
                p('Сеттинг и сюжет писал я. Альтернативный 1986 год, Нью-Йорк, мир антропоморфных животных, жанр криминальной драмы и нео-нуара. Власть у преступных синдикатов, которые выросли на затянувшейся Холодной войне, а социальную иерархию задаёт биологический антагонизм между видами.',
                  'I wrote the setting and the story. An alternate 1986 New York populated by anthropomorphic animals, a crime drama in a neo-noir key. Real power belongs to crime syndicates that thrived on a prolonged Cold War, and the social hierarchy rests on a biological antagonism between species.')
                + fig(f'{C}/setting.webp', 'Сеттинг Capybara Bunk', 'Общая концепция: сеттинг, жанр, центральная идея', 'Overall concept: setting, genre, central idea', 1500, 844)
                + p('Логлайн мини-сюжета: бухгалтер-кролик, чью семью убил синдикат, охотится на исполнителя и понимает, что справедливость в этом мире достаётся только ценой саморазрушения. История разложена на три акта, к ней прилагаются профили персонажей, конфликты, цели и движущие силы героя.',
                    'The mini-story logline: a rabbit accountant whose family was killed by a syndicate hunts down the killer and learns that in this world justice comes only at the cost of destroying himself. The story is laid out in three acts, with character profiles, conflicts, goals and the hero’s driving forces.')
                + fig(f'{C}/plot.webp', 'Трёхактный сюжет Capybara Bunk', 'Сюжет: логлайн и три акта', 'Story: logline and three acts', 1500, 844)
                + '<div class="case-actions">' + button('https://docs.google.com/presentation/d/1frxjadbyUNvbWQTCoykBpBsJSGidbw-uWhkxBDDD-MY/preview', 'Презентация сеттинга', 'Setting deck', external=True) + button('https://docs.google.com/presentation/d/1IREcTWkGrxhaZXu8hjYBALmDBQbuF7otdbnSCS0h-cA/preview', 'Презентация сюжета', 'Story deck', external=True) + '</div>')
body += section('Документация', 'Docs',
                p('Для стадии MVP команда подготовила концепт уровня, референсы графики и музыки, ТЗ для художника, нарративный концепт сеттинга и трёхактный сюжет.',
                  'For the MVP stage the team prepared a level concept, art and music references, an artist brief, a setting concept and a three-act plot.')
                + '<div class="case-actions">' + button('https://sites.google.com/view/maxim-elchaninov-capybara-bunk/capybara-bunk', 'Документация проекта', 'Project docs', external=True) + '</div>')
body += contact_block() + next_case('/case-gridsnap.html', 'Gridsnap для Unity Shader Graph', 'Gridsnap for Unity Shader Graph')
body += '\n        </article>'
PAGES['case-capybara-bunk.html'] = page('case-capybara-bunk.html', 'Capybara Bunk: интерфейс мультиплеера | Максим Ельчанинов',
                                         'Интерфейс многопользовательской игры: меню, лобби хоста и клиента, HUD, пауза, счёт и диалоги подтверждения.',
                                         'assets/images/og/og-capybara-bunk.jpg', body, 'case-page')

# ================================================================ Gridsnap
G = 'assets/images/projects/gridsnap-addon'
body = hero('Инструмент · Unity Asset Store · 2024', 'Tool · Unity Asset Store · 2024',
            'Gridsnap для Unity Shader Graph', 'Gridsnap for Unity Shader Graph',
            'Аддон добавляет в Shader Graph сетку и привязку к ней. Прошёл модерацию Unity и продаётся в Asset Store. Логотип, иконки и промо-слайды я сделал сам.',
            'The add-on brings a grid and snapping to Shader Graph. It passed Unity moderation and sells on the Asset Store. I made the logo, icons and promo slides myself.',
            meta([('Роль', 'Role', 'Автор аддона: код с ИИ, логотип, иконки и промо-слайды сделал сам; Unity, URP и HDRP', 'Add-on author: code with AI; I made the logo, icons and promo slides; Unity, URP and HDRP'),
                  ('Команда', 'Team', 'Соло', 'Solo'),
                  ('Год', 'Year', '2024', '2024'),
                  ('Итог', 'Outcome', 'Прошёл модерацию Unity и продаётся в Asset Store', 'Passed Unity moderation and sells on the Asset Store')]),
            fig(f'{G}/slide-01.webp', 'Ключевой визуал Gridsnap', w=1600, h=1066, eager=True))
body += section('Без сетки', 'Without a grid',
                p('Узлы в Shader Graph не выровнять: сетки нет, всё стоит там, куда бросили. В больших графах это превращается в работу руками.',
                  "You can't line up nodes in Shader Graph: there's no grid, everything stays where you dropped it. In large graphs that turns into manual work."))
body += section('Как устроено', 'How it works',
                ul([('Сетка и привязка для узлов, заметок и групп.', 'Grid and snapping for nodes, sticky notes and groups.'),
                    ('Два переключателя в тулбаре, нарисованные под родные кнопки Unity.', 'Two toolbar toggles drawn to match native Unity buttons.'),
                    ('Подключается через рефлексию редактора, файлы Unity не меняет.', 'Hooks in via editor reflection and leaves Unity files untouched.')])
                + fig(f'{G}/slide-03.webp', 'Граф до и после выравнивания', 'Граф до и после выравнивания', 'Graph before and after alignment')
                + fig(f'{G}/slide-05.webp', 'Переключатели в тулбаре Shader Graph', 'Переключатели сетки и привязки рядом со штатными кнопками', 'Grid and snap toggles next to the native buttons'))
body += section('Логотип и промо', 'Logo and promo',
                p('В логотипе решётка и магнит, синий взят из выделения в интерфейсе Unity. Слайды объясняют продукт без текста описания: что не так, что добавлено, где кнопки.',
                  "The logo is a grid plus a magnet; the blue comes from Unity's selection colour. The slides explain the product without reading the description: what's wrong, what's added, where the buttons are.")
                + fig(f'{G}/slide-02.webp', 'Промо-слайд Gridsnap', 'Промо-слайд: выравнивание узлов, заметок и групп', 'Promo slide: aligning nodes, notes and groups')
                + '<div class="case-actions">' + button('https://assetstore.unity.com/packages/tools/gui/shader-graph-gridsnap-358694', 'Страница в Asset Store', 'Asset Store page', external=True) + '</div>')
body += contact_block() + next_case('/case-architecture-rendering.html', 'Architecture Rendering: игра-портфолио', 'Architecture Rendering: a portfolio game')
body += '\n        </article>'
PAGES['case-gridsnap.html'] = page('case-gridsnap.html', 'Gridsnap для Unity Shader Graph | Максим Ельчанинов',
                                    'Аддон для Unity: сетка и привязка в Shader Graph, логотип и промо. Unity Asset Store.',
                                    'assets/images/og/og-gridsnap.jpg', body, 'case-page')

# ================================================================ Architecture Rendering
A = 'assets/images/projects/architecture-rendering'
body = hero('Игра · Unity · 2026', 'Game · Unity · 2026',
            'Architecture Rendering: игра-портфолио', 'Architecture Rendering: a portfolio game',
            'Учебный проект Unity Creative Core, из которого выросла игра на 15 минут с ироничным рассказчиком. Главное меню нарисовано на полу комнаты, настройки на стене у телевизора.',
            'A Unity Creative Core exercise that grew into a 15-minute game with an ironic narrator. The main menu is painted on the floor, settings are on the wall by the TV.',
            meta([('Роль', 'Role', 'Разработчик и гейм-дизайнер; скрипты с ИИ', 'Developer and game designer; scripts with AI'),
                  ('Команда', 'Team', 'Соло', 'Solo'),
                  ('Год', 'Year', '2026', '2026'),
                  ('Итог', 'Outcome', 'Игра на 15 минут, RU и EN; itch.io, браузер и PC', '15-minute game, RU and EN; itch.io, browser and PC')]),
            fig(f'{A}/shot-01.webp', 'Главное меню на полу комнаты', w=1487, h=836, eager=True))
body += section('Меню в комнате', 'Menu in the room',
                p('Хотелось, чтобы игрок с первого кадра стоял в мире игры. Поэтому «Играть», «Настройки» и «Выход» лежат на полу в луче света, а громкость, язык и кнопки, которые включают и выключают телевизор в сцене, висят на стене.',
                  'I wanted the player inside the game world from the first frame. So Play, Settings and Exit lie on the floor in a beam of light, and volume, language and the buttons that switch the TV in the scene on and off hang on the wall.')
                + fig(f'{A}/shot-02.webp', 'Настройки на стене комнаты', 'Настройки на стене: громкость, язык, телевизор', 'Settings on the wall: volume, language, TV', 1487, 836))
body += section('Что ещё в игре', "What else is in it",
                p('Диалоги с локализацией, визуальная новелла, квесты и кинематографические камеры.', 'Localised dialogue, a visual novel, quests and cinematic cameras.')
                + fig(f'{A}/shot-03.webp', 'Сцена с рассказчиком', 'Сцена с рассказчиком', 'Scene with the narrator', 1493, 840)
                + '<div class="case-actions">' + button('https://silenceremember.itch.io/architecture', 'Играть на itch.io', 'Play on itch.io', primary=True, external=True) + '</div>')
body += contact_block() + next_case('/case-shards-of-sanity.html', 'Shards of Sanity: кооперативный шутер с обороной', 'Shards of Sanity: a co‑op shooter with tower defence')
body += '\n        </article>'
PAGES['case-architecture-rendering.html'] = page('case-architecture-rendering.html', 'Architecture Rendering: игра-портфолио | Максим Ельчанинов',
                                                  'Игра на Unity с ироничным рассказчиком: меню нарисовано на полу комнаты, настройки на стене.',
                                                  'assets/images/og/og-architecture-rendering.jpg', body, 'case-page')

# ================================================================ Shards of Sanity
SS = 'assets/images/projects/shards-of-sanity'
body = hero('Арт-дирекция и гейм-дизайн · Unity · 2024–2026', 'Art direction and game design · Unity · 2024–2026',
            'Shards of Sanity: кооперативный шутер с обороной', 'Shards of Sanity: a co‑op shooter with tower defence',
            'Шутер от первого лица с защитой башнями и роглайтом на 1–4 игроков. Команда 2IQ делает его на Unity с 2024 года. Я отвечаю за гейм-дизайн и визуальный стиль, продюсированием и кодом занимаются другие участники 2IQ.',
            'A first-person shooter with tower defence and roguelite runs for 1–4 players. The 2IQ team has been building it in Unity since 2024. I own the game design and the visual style; other 2IQ members handle production and code.',
            meta([('Роль', 'Role', 'Арт-директор и гейм-дизайнер', 'Art director and game designer'),
                  ('Команда', 'Team', '2IQ, код пишут программисты команды', "2IQ; the team’s programmers write the code"),
                  ('Год', 'Year', '2024–2026', '2024–2026'),
                  ('Статус', 'Status', 'В разработке, цель – Steam', 'In development, aiming for Steam')]),
            fig(f'{SS}/hub.webp', 'Лимб, хаб между миссиями', w=1600, h=900, eager=True))
body += section('Как играется', 'How it plays',
                p('Игроки – Ткачи. Из хаба Лимб они уходят в Витки, осколки реальности, расколотой Разломом, собирают ресурс и защищают Узел от Пожирателей: сначала строят установки, потом держат оборону сами. После защиты команда возвращается в Лимб и усиливается перед следующим Витком.',
                  'Players are Weavers. From the Limbo hub they travel to Coils, shards of a reality broken by the Rift, gather resources and defend a Knot against the Devourers: first they build turrets, then they hold the line themselves. After the defence the team returns to Limbo and gets stronger before the next Coil.')
                + p('Главное оружие Ткачей – Нексус: ядро и четыре модуля-ствола, которые игрок подбирает под свой стиль. Прогрессия между забегами идёт через Веретено.',
                    'The Weavers’ main weapon is the Nexus: a core and four barrel modules each player fits to their own play style. Progression between runs goes through the Spindle.')
                + fig(f'{SS}/portal.webp', 'Портал из Лимба в Виток', 'Лимб: портал в следующий Виток', 'Limbo: the portal to the next Coil', 1600, 900)
                + fig(f'{SS}/mission.webp', 'Бой на миссии', 'Рабочая сборка: бой на миссии', 'Work-in-progress build: a fight on a mission', 990, 557))
body += section('Эмблема', 'Emblem',
                p('Знак – пряслице, диск-утяжелитель, который держит вращение веретена, пока прядётся нить. Лопасти закручены вокруг кристалла, кольцо расколото через каждые 60°. Спираль читается как петля забега и как отпечаток пальца, напоминание о том, что Ткачи потеряли себя. Кривые нарублены прямыми гранями, все промежутки одной ширины. Знак утверждён, надпись логотипа ещё в работе.',
                  'The mark is a spindle whorl, the weighted disc that keeps a spindle turning as it spins thread. Blades curl around a crystal inside a ring cracked every 60°. The spiral reads as the loop of a run and as a fingerprint, a reminder that the Weavers have lost themselves. Curves are chopped into straight facets and every gap has the same width. The mark is approved; the wordmark is still in progress.')
                + fig(f'{SS}/logo.webp', 'Эмблема и рабочая надпись Shards of Sanity', 'Эмблема и рабочая надпись: чернила на золоте', 'Emblem and working wordmark: ink on gold', 459, 600))
body += section('Интерфейс', 'Interface',
                p('Меню паузы переделывал несколько раз. В финальной версии слева состояние забега: Виток, время, следующая волна и прочность Узла. Справа игроки отряда. Золотой разлом отделяет меню от игры.',
                  'I reworked the pause menu several times. In the final version the run state sits on the left: the Coil, the time, the next wave and the Knot’s health. Squad players are on the right. A golden rift separates the menu from the game.')
                + fig(f'{SS}/pause.webp', 'Меню паузы', 'Пауза: состояние забега слева, игроки справа', 'Pause: run state on the left, players on the right', 1600, 951))
body += section('Концепты', 'Concepts',
                p('Концепты врагов и мини-игр для Лимба делаю с ИИ по брифу: силуэт, материал, связь с лором. Враги – обычные вещи, проросшие кристаллами Разлома: мехи, кассовый аппарат, вентиляция.',
                  'I make enemy and Limbo mini-game concepts with AI from a brief: silhouette, material, tie-in with the lore. Enemies are everyday objects overgrown with Rift crystals: bellows, a cash register, a vent.')
                + fig(f'{SS}/concept-bellows.webp', 'Концепт врага Bellows', 'Концепт врага Bellows: мехи, проросшие кристаллами', 'Bellows enemy concept: bellows overgrown with crystals', 1400, 933)
                + fig(f'{SS}/concept-minigames.webp', 'Концепт мини-игр Лимба', 'Мини-игры в Лимбе: игровой автомат, дартс, рыбалка', 'Limbo mini-games: slot machine, darts, fishing', 1600, 600))
body += section('Документация', 'Documentation',
                p('С 2024 года пишу введение в концепт, vision-документ, дизайн-документ оружия и ТЗ для художника. Концепт собран по восьми пунктам: тема, сеттинг, персонаж, действия, выбор, цель, конфликт, пространство.',
                  'Since 2024 I have written the concept introduction, the vision document, the weapon design document and the art brief. The concept is built on eight headings: theme, setting, character, actions, choice, goal, conflict, space.')
                + p('Сейчас документы живут в Wobbledink, нашей системе документации. У команды общие правила: у каждого документа есть статус, а замысел отделён от реализации и проверки.',
                    'Today the documents live in Wobbledink, our documentation system. The team shares a set of rules: every document has a status, and intent is kept apart from implementation and testing.')
                + '<div class="case-actions">' + button('/case-wobbledink.html', 'Кейс Wobbledink', 'Wobbledink case') + '</div>')
body += contact_block() + next_case('/case-bite.html', 'B.I.T.E.: асимметричная RTS про вампиров', 'B.I.T.E.: an asymmetric vampire RTS')
body += '\n        </article>'
PAGES['case-shards-of-sanity.html'] = page('case-shards-of-sanity.html', 'Shards of Sanity: кооперативный шутер с обороной | Максим Ельчанинов',
                                            'Шутер от первого лица с защитой башнями и роглайтом. Арт-дирекция и гейм-дизайн: эмблема, интерфейс, концепты врагов, документация.',
                                            'assets/images/og/og-shards-of-sanity.jpg', body, 'case-page')

# ================================================================ B.I.T.E.
BT = 'assets/images/projects/bite'
body = hero('Гейм-дизайн · Unity · 2026', 'Game design · Unity · 2026',
            'B.I.T.E.: асимметричная RTS про вампиров', 'B.I.T.E.: an asymmetric vampire RTS',
            'Мультиплеерная RTS от Ingvik Studios: 10 людей против 2 вампиров. Люди строят базы и держат оборону, вампиры охотятся. Как гейм-дизайнер я проектирую навыки вампиров и улучшения фракций людей.',
            'A multiplayer RTS by Ingvik Studios: 10 humans against 2 vampires. Humans build bases and hold the line; vampires hunt. As the game designer, I work on the vampire skills and the human faction upgrades.',
            meta([('Роль', 'Role', 'Гейм-дизайнер', 'Game designer'),
                  ('Студия', 'Studio', 'Ingvik Studios', 'Ingvik Studios'),
                  ('Год', 'Year', '2026', '2026'),
                  ('Статус', 'Status', 'Пре-альфа, в разработке', 'Pre-alpha, in development')]),
            fig(f'{BT}/hero.webp', 'Вампир Крови среди гулей у реки', w=1600, h=900, eager=True))
body += section('Игра', 'The game',
                p('Идея выросла из пользовательских карт Warcraft III вроде Vampirism: люди против монстров. Люди здесь полноценная воюющая сторона. Они разбегаются по карте, ставят базу, развивают экономику и нанимают Охотников. Вампиры базу не строят и ресурсы не добывают, они охотятся.',
                  'The idea grew out of Warcraft III custom maps like Vampirism: humans against monsters. Here the humans are a real fighting force. They spread across the map, set up a base, grow an economy and hire Hunters. Vampires build no base and gather no resources; they hunt.')
                + fig(f'{BT}/builder.webp', 'Строитель Храмовников возводит шахту', 'Строитель Храмовников возводит шахту. С него начинается база людей', 'A Templar builder raising a mine. Every human base starts with him', 1600, 900))
body += section('Навыки вампиров', 'Vampire skills',
                p('У вампира три ветки: Кровь, Смерть и Тень. У каждой своя истинная форма, два пассивных и четыре активных навыка. С пятого тира Кровь и Смерть получают новые активные навыки, а Тень усиливает криты и одержимость. Тиры с первого по десятый дают по два модификатора, которые меняют правила навыков своей ветки. Всё это я веду в таблице: описание, параметры и прогрессию по уровням для каждой ветки.',
                  'A vampire has three branches: Blood, Necrotic and Dark. Each has its own true form, two passives and four active skills. From tier five Blood and Necrotic gain new active skills, while Dark strengthens crits and possession. Tiers one to ten add two modifiers each that change the rules of that branch. I keep all of it in a spreadsheet: description, parameters and level progression for every branch.')
                + fig(f'{BT}/skills.webp', 'Схема навыков вампиров по трём веткам', 'Каркас навыков по моей таблице: формы, пассивные и активные навыки, тиры', 'Skill framework from my spreadsheet: forms, passives, actives and tiers', 1200, 744, src_en=f'{BT}/skills-en.webp')
                + p('Общий навык всех веток – Выслеживание, в игре Blood Track. Юниты, у которых меньше 80% здоровья, видны вампиру сквозь туман войны, а время от времени раскрывается строитель, которого вампир ещё не находил. Так люди не могут бесконечно прятаться после неудачной стычки.',
                    'The skill all branches share is Blood Track. Units below 80% health show through the fog of war, and every so often a builder the vampire has not found yet is revealed. That way humans cannot hide forever after a lost skirmish.')
                + fig(f'{BT}/blood-track.webp', 'Выслеживание: раненый враг виден сквозь туман', 'Blood Track: раненый юнит подсвечен сквозь туман войны', 'Blood Track: a wounded unit highlighted through the fog of war', 1600, 900)
                + p('Ветку Тени я собрал в Unity: шесть способностей, от Повелителя теней до истинной формы. Код писал с ИИ.', 'I built the Dark branch in Unity: six abilities, from Shadow Lord to the true form. I wrote the code with AI.')
                + fig(f'{BT}/scarlet.webp', 'Алый фонтан: гули после взрыва крови', 'Алый фонтан: взрыв крови по области лечит вампира за каждую задетую цель', 'Scarlet Fountain: an area blood burst that heals the vampire per target hit', 1600, 900))
body += section('Улучшения фракций', 'Faction upgrades',
                p('У каждой фракции людей свой набор улучшений по уровням главного здания. В таблице у каждого улучшения есть описание, числа и комментарий, зачем оно нужно. Ниже три улучшения Храмовников из неё.',
                  'Each human faction has its own upgrades tied to the main building level. In the spreadsheet every upgrade has a description, numbers and a note on why it exists. Below are three Templar upgrades from it.')
                + fig(f'{BT}/upgrades.webp', 'Улучшения Храмовников из таблицы', 'Улучшения Храмовников: что делает, числа и зачем', 'Templar upgrades: effect, numbers and rationale', 1200, 388, src_en=f'{BT}/upgrades-en.webp')
                + fig(f'{BT}/templar-concept.webp', 'Концепт Храмовников', 'Концепт Храмовников из канала студии', 'Templar concept from the studio’s channel', 1280, 856))
body += section('Лес', 'Forest',
                p('Для карты я собрал генератор деревьев в Houdini: дуб и ель по 500–600 треугольников с атласами листвы и коры под камеру RTS. Часть листвы и спилов дорисована с ИИ (LoRA и ChatGPT) по моим раскладкам. Лес стоит стенами вдоль проходов, деревья можно рубить, у лесоруба есть индикаторы цели и запаса древесины.',
                  'For the map I built a tree generator in Houdini: oak and spruce at 500–600 triangles with leaf and bark atlases made for the RTS camera. Some foliage and stump textures were painted with AI (a LoRA and ChatGPT) over my layouts. The forest forms walls along the passages, trees can be felled, and the woodcutter has indicators for the target and the wood stock.')
                + fig(f'{BT}/forest.webp', 'Лес на карте B.I.T.E.', 'Лес на карте: дубы и ели из генератора', 'The forest on the map: oaks and spruces from the generator', 1600, 900)
                + fig(f'{BT}/blink.webp', 'Строитель уходит Скачком от вампира в лесу', 'Скачок: строитель уходит от вампира через лес', 'Blink: a builder escapes a vampire through the forest', 1600, 900)
                + '<div class="case-actions">' + button('https://t.me/bite_ingvik', 'Канал игры в Telegram', 'Game channel on Telegram', external=True) + button('https://vk.ru/bite_ingvik', 'Группа ВКонтакте', 'VK group', external=True) + '</div>')
body += contact_block() + next_case('/case-wobbledink.html', 'Wobbledink: система документации', 'Wobbledink: a documentation system')
body += '\n        </article>'
PAGES['case-bite.html'] = page('case-bite.html', 'B.I.T.E.: асимметричная RTS про вампиров | Максим Ельчанинов',
                               'Асимметричная мультиплеерная RTS студии Ingvik Studios: 10 людей против 2 вампиров. Гейм-дизайн навыков вампиров и улучшений фракций.',
                               'assets/images/og/og-bite.jpg', body, 'case-page')

# ================================================================ Wobbledink
WB = 'assets/images/projects/wobbledink'
body = hero('Инструмент документации · 2025–2026', 'Documentation tool · 2025–2026',
            'Wobbledink: система документации', 'Wobbledink: a documentation system',
            'В гейм-дизайн-документах одни и те же термины и числа повторяются на многих страницах и расходятся после первой правки баланса. Wobbledink хранит их в справочнике и подставляет в текст актуальные значения. Сейчас это веб-приложение команды и расширение для Google Docs, а для VS Code готов reader, на котором строю третью версию.',
            'Game design documents repeat the same terms and numbers across many pages, and they drift apart after the first balance pass. Wobbledink keeps them in a glossary and puts the current values into the text. Today it runs as the team’s web app and a Google Docs extension, and a VS Code reader is the base for the third version.',
            meta([('Роль', 'Role', 'Веб-версия: архитектор и руководитель разработки. Расширения: делаю сам, код с ИИ', 'Web version: architect and development lead. Extensions: built by me, code with AI'),
                  ('Команда', 'Team', '2IQ', '2IQ'),
                  ('Год', 'Year', '2025–2026', '2025–2026'),
                  ('Итог', 'Outcome', 'wobble.2iq.club, Chrome, VS Code; на нём живёт документация Shards of Sanity', 'wobble.2iq.club, Chrome, VS Code; the Shards of Sanity documentation lives there')]),
            fig(f'{WB}/web.webp', 'Веб-приложение Wobbledink: документ со статусом', w=1310, h=840, eager=True))
body += section('Веб-приложение', 'Web app',
                p('База знаний команды 2IQ: документы, термины и значения в одном месте. Клиент на Blazor WebAssembly, сервер на ASP.NET Core с PostgreSQL и SignalR, есть настольные сборки. Делаем с января 2025 года, на нём живёт документация Shards of Sanity.',
                  'The knowledge base of team 2IQ: documents, terms and values in one place. The client runs on Blazor WebAssembly, the server on ASP.NET Core with PostgreSQL and SignalR, and there are desktop builds. We started in January 2025; the Shards of Sanity documentation lives there.')
                + '<div class="case-actions">' + button('/case-shards-of-sanity.html', 'Кейс Shards of Sanity', 'Shards of Sanity case') + '</div>')
body += section('Wobbledink G-Docs', 'Wobbledink G-Docs',
                p('Расширение для Chrome. В тексте Google Docs пишу [термин] и {значение}, справочник лежит в Google Sheets на двух листах. В режиме просмотра документ показывает актуальные значения, при наведении открывается карточка термина, а в ней вложенные карточки. Сам текст документа не меняется. Чтобы выйти в магазин Chrome, расширению нужна проверка OAuth у Google.',
                  'A Chrome extension. In Google Docs I write [term] and {value}; the glossary is a Google Sheets spreadsheet with two sheets. In viewing mode the document shows current values, and hovering over a marker opens a term card with nested cards inside. The document text itself stays unchanged. To go public in the Chrome Web Store, the extension needs Google’s OAuth review.')
                + fig(f'{WB}/gdocs.webp', 'Демо-документ Wobbledink в Google Docs с открытой карточкой термина', 'Документ в режиме просмотра: числа подставлены из таблицы, карточка термина ссылается на другой термин', 'Viewing mode: numbers come from the spreadsheet, and the term card links to another term', 1043, 515)
                + '<div class="case-actions">' + button('https://wobbledink-g-docs.2iqlabs.com/', 'Сайт расширения', 'Extension website', external=True) + '</div>')
body += section('Wobbledink Light', 'Wobbledink Light',
                p('Reader Markdown для VS Code: документ открывается в газетной вёрстке со шрифтом PT Serif, в нём работают поиск и переходы по ссылкам. Только чтение, файлы он не меняет. На его основе пишу полное расширение с терминами и значениями.',
                  'A Markdown reader for VS Code: a document opens in a newspaper-style layout set in PT Serif, with search and link navigation. It is read-only and never changes files. I am building the full extension with terms and values on top of it.')
                + fig(f'{WB}/light.webp', 'Концепт-документ в Wobbledink Light', 'Light: концепт-документ из примеров расширения', 'Light: a concept document from the extension’s examples', 960, 600))
body += section('Одна модель', 'One model',
                p('В веб-приложении и в Google Docs одна модель: термин с определением, значение с ключом и ссылки между ними. Расширение для VS Code получит ту же модель. Инструмент приходит туда, где команда уже пишет, и не заставляет переезжать. Связь терминов и значений между документами – тема моей диссертации в ЛЭТИ.',
                  'The web app and Google Docs share one model: a term with a definition, a value with a key, and links between them. The VS Code extension will get the same model. The tool goes where the team already writes instead of making it move. Linking terms and values across documents is the topic of my PhD at LETI.')
                + '<div class="case-actions">' + button('/research.html', 'Наука', 'Research') + '</div>')
body += contact_block() + next_case('/case-ux-audit-leti.html', 'UX-аудит сайта приёмной ЛЭТИ', 'UX audit of the LETI admissions website')
body += '\n        </article>'
PAGES['case-wobbledink.html'] = page('case-wobbledink.html', 'Wobbledink: система документации | Максим Ельчанинов',
                                     'Система документации в трёх форматах: веб-приложение команды, расширение для Google Docs и reader для VS Code.',
                                     'assets/images/og/og-wobbledink.jpg', body, 'case-page')

# ================================================================ Services
rows = [
    ('Гейм-дизайн-документация, баланс и экономика', 'Game design docs, balance and economy', '<a href="/case-bite.html">B.I.T.E.</a> <a href="/case-shards-of-sanity.html">Shards of Sanity</a> <a href="/research.html">' + t('статьи о цепях Маркова и матрицах урона', 'papers on Markov chains and damage matrices') + '</a>'),
    ('Арт-дирекция игры: эмблема, стиль, концепты', 'Game art direction: emblem, style, concepts', '<a href="/case-shards-of-sanity.html">Shards of Sanity</a>'),
    ('Интерфейс игры: меню, лобби, HUD, диалоги', 'Game UI: menus, lobby, HUD, dialogs', '<a href="/case-capybara-bunk.html">Capybara Bunk</a> <a href="/case-architecture-rendering.html">Architecture Rendering</a>'),
    ('UX-аудит сайта или сервиса', 'UX audit of a website or service', '<a href="/case-ux-audit-leti.html">' + t('Аудит сайта приёмной ЛЭТИ', 'LETI admissions audit') + '</a>'),
    ('Макеты экранов и прототипы в Figma', 'Screen layouts and Figma prototypes', '<a href="/case-capybara-bunk.html">Capybara Bunk</a>'),
    ('Системы документации для команды', 'Documentation systems for teams', '<a href="/case-wobbledink.html">Wobbledink</a>'),
    ('Инструменты и аддоны для Unity', 'Unity tools and add-ons', '<a href="/case-gridsnap.html">Gridsnap</a>'),
    ('Telegram-боты', 'Telegram bots', t('Свои боты для уведомлений и Telegram Mini App; код закрыт, покажу на созвоне', 'My own notification bots and a Telegram Mini App. Closed source, I can demo them on a call')),
    ('Сайты и приложения, собранные с ИИ', 'AI-built websites and apps', t('Этот сайт и <a href="https://nirune.site/" target="_blank" rel="noopener noreferrer">NIRUNE</a>', 'This website and <a href="https://nirune.site/" target="_blank" rel="noopener noreferrer">NIRUNE</a>')),
]
trs = ''.join(f'<tr><td>{t(a, b)}</td><td>{c}</td></tr>' for a, b, c in rows)
body = f'''<article class="case services">
          <header class="case-hero">
            <h1 class="case-title">{t('Что беру в работу', 'What I take on')}</h1>
            <p class="case-lead">{t('Работаю удалённо: частичная занятость, проект или разовая задача. Срок и цену называю до начала работы, результат отдаю с инструкцией.', 'I work remotely: part-time, a project or a one-off task. I quote time and price before starting and hand over the result with instructions.')}</p>
          </header>
          <div class="services-table-wrap">
            <table class="services-table">
              <thead><tr><th scope="col">{t('Что', 'What')}</th><th scope="col">{t('Пример на сайте', 'Example on this site')}</th></tr></thead>
              <tbody>{trs}</tbody>
            </table>
          </div>
          {contact_block('Обсудить задачу', 'Discuss a project')}
        </article>'''
PAGES['services.html'] = page('services.html', 'Услуги | Максим Ельчанинов',
                              'Гейм-дизайн и арт-дирекция игр, интерфейсы игр и сайтов, UX-аудит, системы документации, инструменты для Unity. Удалённо, с примерами работ.',
                              'assets/images/og/og-default.jpg', body, 'case-page', og_type='website')

# ================================================================ Home

LEAD_RU = 'Проектирую механики, системы и интерфейсы игр, пишу документацию и нарратив. Делаю UX-аудиты и интерфейсы сайтов. Сейчас в Ingvik Studios отвечаю за навыки вампиров в B.I.T.E. Аспирант ЛЭТИ.'
LEAD_EN = 'I design game mechanics, systems and interfaces, and write documentation and narrative. I also do UX audits and website interfaces. At Ingvik Studios I own the vampire skills in B.I.T.E. PhD student at LETI.'


featured = [
    ('/case-bite.html', 'assets/images/projects/bite/preview.webp', 960, 600,
     'Ingvik Studios, 2026', 'Ingvik Studios, 2026', 'B.I.T.E.: асимметричная RTS про вампиров', 'B.I.T.E.: an asymmetric vampire RTS',
     '10 людей против 2 вампиров. Проектирую три ветки навыков вампиров с прогрессией и улучшения фракций людей.',
     '10 humans against 2 vampires. I design three vampire skill branches with progression and the human faction upgrades.'),
    ('/case-ux-audit-leti.html', 'assets/images/projects/ux-audit-leti/cover.webp', 1600, 900,
     'Веб, 2026', 'Web, 2026', 'UX-аудит сайта приёмной ЛЭТИ', 'UX audit of the LETI admissions website',
     'Путь абитуриента до подачи на платное: 8 находок, 4 критичные. Через 2,5 месяца перепроверил, 7 на месте.',
     'The applicant path to paid admission: 8 findings, 4 critical. Rechecked 2.5 months later: 7 are still there.'),
    ('/case-capybara-bunk.html', 'assets/images/projects/capybara-bunk/preview.webp', 1232, 693,
     'Команда 2IQ, 2025', 'Team 2IQ, 2025', 'Capybara Bunk: интерфейс мультиплеера', 'Capybara Bunk: multiplayer interface',
     'Лобби и пауза для хоста и клиента, HUD, итоги матча. Написал сеттинг и сюжет, вёл команду из пяти человек.',
     'Host and client versions of the lobby and pause, HUD, match results. Wrote the setting and story, led a team of five.'),
]

more_cases = [
    ('/case-shards-of-sanity.html', 'assets/images/projects/shards-of-sanity/preview.webp', 'Shards of Sanity', 'Shards of Sanity', 'Арт-дирекция и гейм-дизайн, 2024–2026', 'Art direction and game design, 2024–2026'),
    ('/case-wobbledink.html', 'assets/images/projects/wobbledink/preview.webp', 'Wobbledink', 'Wobbledink', 'Система документации, 2025–2026', 'Documentation system, 2025–2026'),
    ('/case-gridsnap.html', 'assets/images/projects/gridsnap-addon/preview.webp', 'Gridsnap', 'Gridsnap', 'Аддон для Unity Shader Graph, 2024', 'Unity Shader Graph add-on, 2024'),
    ('/case-architecture-rendering.html', 'assets/images/projects/architecture-rendering/preview.webp', 'Architecture Rendering', 'Architecture Rendering', 'Игра-портфолио на Unity, 2026', 'Portfolio game in Unity, 2026'),
]
index_rows = ''.join(
    f'''<li class="hi-row"><a href="{href}" data-preview="/{variant(img, 800) or img}"><img class="hi-thumb" src="/{variant(img, 240) or img}" alt="" width="96" height="60" loading="lazy" decoding="async" /><span class="hi-title">{t(tr, te)}</span><span class="hi-meta">{t(mr, me)}</span></a></li>'''
    for href, img, tr, te, mr, me in more_cases)
cards = ''
for href, img, w, h, kr, ke, tr, te, dr, de in featured:
    cards += f'''<article class="home-case">
              <div class="home-case-image"><img src="/{img}"{srcset(img, w, '(max-width: 1023px) calc(100vw - 40px), 480px')} alt="" width="{w}" height="{h}" loading="lazy" decoding="async" /></div>
              <div class="home-case-body">
                <p class="home-case-meta">{t(kr, ke)}</p>
                <h3 class="home-case-title"><a href="{href}">{t(tr, te)}</a></h3>
                {p(dr, de)}
              </div>
            </article>'''
body = f'''<section class="home-hero hh">
            <div class="hh-portrait" aria-hidden="true">
              <img src="/assets/images/portrait.webp" alt="" width="560" height="840" fetchpriority="high" decoding="async" />
            </div>
            <div class="hh-top">
              <p class="home-location">{t('Санкт-Петербург, открыт к удалённой работе', 'Saint Petersburg, open to remote work')}</p>
            </div>
            <h1 class="hh-name"><span class="hh-line">{t('Максим', 'Maxim')}</span><span class="hh-line">{t('Ельчанинов', 'Elchaninov')}</span></h1>
            <div class="hh-body">
              <p class="home-role">{t('Гейм-дизайн и интерфейсы', 'Game design and interfaces')}</p>
              <p class="hh-lead">{t(LEAD_RU, LEAD_EN)}</p>
              <div class="cta-buttons cta-buttons-primary">
                {button('#cases', 'Кейсы', 'Cases', primary=True)}
                <a href="/assets/documents/cv/Elchaninov_CV_RU.pdf" data-href-en="/assets/documents/cv/Elchaninov_CV_EN.pdf" class="cta-button" target="_blank" rel="noopener">{t('Резюме, PDF', 'CV, PDF')}</a>
                {button(TG, 'Telegram', 'Telegram', external=True)}
              </div>
            </div>
          </section>
          <section class="home-section" id="cases">
            <h2 class="case-section-title">{t('Избранные кейсы', 'Featured cases')}</h2>
            <div class="home-cases">{cards}</div>
            <ul class="home-index" aria-label="Ещё кейсы" data-aria-label-en="More cases">{index_rows}</ul>
            <a class="home-all" href="/projects.html">{t('Все кейсы', 'All cases')}</a>
          </section>
          <section class="home-section home-contacts">
            <h2 class="case-section-title">{t('Контакты', 'Contact')}</h2>
            <ul class="home-contact-list">
              <li><a class="home-contact" href="{MAIL}"><span class="home-contact-label">{t('Почта', 'Email')}</span><span class="home-contact-value">slcrmmbr@outlook.com</span></a></li>
              <li><a class="home-contact" href="{TG}" target="_blank" rel="noopener noreferrer"><span class="home-contact-label">Telegram</span><span class="home-contact-value">t.me/silenceremember</span></a></li>
              <li><a class="home-contact" href="https://hh.ru/resume/0efeffadff0c9a053f0039ed1f4d4763506334" target="_blank" rel="noopener noreferrer"><span class="home-contact-label">hh.ru</span><span class="home-contact-value">{t('Резюме', 'Resume')}</span></a></li>
              <li><a class="home-contact" href="https://www.linkedin.com/in/silenceremember/" target="_blank" rel="noopener noreferrer"><span class="home-contact-label">LinkedIn</span><span class="home-contact-value">in/silenceremember</span></a></li>
            </ul>
          </section>'''
PAGES['index.html'] = page('index.html', 'Максим Ельчанинов: гейм-дизайн и интерфейсы',
                           'Максим Ельчанинов: гейм-дизайн и интерфейсы. Навыки вампиров для RTS B.I.T.E., арт-дирекция Shards of Sanity, UX-аудит сайта ЛЭТИ. Аспирант СПбГЭТУ «ЛЭТИ».',
                           'assets/images/og/og-default.jpg', body, 'case-page home-page', body_class='home', og_type='website')

(OUT / 'src').mkdir(parents=True, exist_ok=True)
for name, text in PAGES.items():
    (OUT / 'src' / name).write_text(text, encoding='utf8')
    print('wrote', name, len(text))
