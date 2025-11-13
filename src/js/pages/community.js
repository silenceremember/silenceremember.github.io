/**
 * Страница сообщества - загрузка и отображение данных из JSON
 */

/**
 * Загружает данные сообщества из JSON
 */
async function loadCommunityData() {
  try {
    const response = await fetch('/data/community.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Ошибка загрузки данных сообщества:', error);
    return null;
  }
}

/**
 * Получает путь к иконке для платформы
 */
function getIconPath(platform) {
  const iconMap = {
    'discord': 'assets/images/icon-discord.svg',
    'discord-server': 'assets/images/icon-discord-server.svg', // Иконка сервера Discord
    'patreon': 'assets/images/icon-patreon.svg',
    'boosty': 'assets/images/icon-boosty.svg',
    'ko-fi': 'assets/images/icon-ko-fi.svg',
    'github': 'assets/images/icon-github.svg',
    'itch': 'assets/images/icon-itch.svg',
    'telegram': 'assets/images/icon-telegram.svg',
    'linkedin': 'assets/images/icon-linkedin.svg',
    'headhunter': 'assets/images/icon-headhunter.svg',
    'steam': 'assets/images/icon-steam.svg',
    'mail': 'assets/images/icon-mail.svg'
  };
  
  // Если иконка существует, возвращаем путь, иначе placeholder
  return iconMap[platform.toLowerCase()] || 'assets/images/icon-placeholder.svg';
}

/**
 * Создает карточку сообщества в стиле портфолио
 */
function createCommunityCard(url, iconPath, platformName, ariaLabel, description = null, isPlaceholder = false, subtitle = null) {
  const card = document.createElement('a');
  
  card.href = url || '#';
  card.target = '_blank';
  card.rel = 'noopener noreferrer';
  
  card.className = 'community-card';
  card.setAttribute('aria-label', ariaLabel);
  
  // Контент карточки
  const content = document.createElement('div');
  content.className = 'community-card-content';
  
  // Заголовок с иконкой
  const title = document.createElement('h3');
  title.className = 'community-card-title';
  
  // Иконка внутри заголовка
  const iconContainer = document.createElement('div');
  iconContainer.className = 'community-card-icon';
  
  const iconSpan = document.createElement('span');
  iconSpan.setAttribute('data-svg-src', iconPath);
  iconContainer.appendChild(iconSpan);
  
  title.appendChild(iconContainer);
  
  // Текст заголовка
  const titleText = document.createElement('span');
  titleText.className = 'community-card-title-text';
  titleText.textContent = platformName;
  title.appendChild(titleText);
  
  content.appendChild(title);
  
  // Подзаголовок (если есть)
  if (subtitle) {
    const subtitleElement = document.createElement('p');
    subtitleElement.className = 'community-card-subtitle';
    subtitleElement.textContent = subtitle;
    content.appendChild(subtitleElement);
  }
  
  // Описание (если есть)
  if (description) {
    const descriptionElement = document.createElement('p');
    descriptionElement.className = 'community-card-description';
    descriptionElement.textContent = description;
    content.appendChild(descriptionElement);
  }
  
  card.appendChild(content);
  
  return card;
}

/**
 * Создает карточку Discord с горизонтальной раскладкой (иконка слева, текст справа)
 */
function createDiscordCard(url, iconPath, platformName, ariaLabel, description = null, isPlaceholder = false, subtitle = null) {
  const card = document.createElement('a');
  
  card.href = url || '#';
  card.target = '_blank';
  card.rel = 'noopener noreferrer';
  
  card.className = 'community-card community-card-discord';
  card.setAttribute('aria-label', ariaLabel);
  
  // Контент карточки с горизонтальной раскладкой
  const content = document.createElement('div');
  content.className = 'community-card-content';
  
  // Иконка слева
  const iconContainer = document.createElement('div');
  iconContainer.className = 'community-card-icon community-card-icon-left';
  
  const iconSpan = document.createElement('span');
  iconSpan.setAttribute('data-svg-src', iconPath);
  iconContainer.appendChild(iconSpan);
  
  content.appendChild(iconContainer);
  
  // Текстовый блок справа
  const textBlock = document.createElement('div');
  textBlock.className = 'community-card-text-block';
  
  // Заголовок
  const title = document.createElement('h3');
  title.className = 'community-card-title';
  
  const titleText = document.createElement('span');
  titleText.className = 'community-card-title-text';
  titleText.textContent = platformName;
  title.appendChild(titleText);
  
  textBlock.appendChild(title);
  
  // Подзаголовок (если есть)
  if (subtitle) {
    const subtitleElement = document.createElement('p');
    subtitleElement.className = 'community-card-subtitle';
    subtitleElement.textContent = subtitle;
    textBlock.appendChild(subtitleElement);
  }
  
  // Описание (если есть)
  if (description) {
    const descriptionElement = document.createElement('p');
    descriptionElement.className = 'community-card-description';
    descriptionElement.textContent = description;
    textBlock.appendChild(descriptionElement);
  }
  
  content.appendChild(textBlock);
  card.appendChild(content);
  
  return card;
}

/**
 * Создает секцию Discord
 */
function createDiscordSection(discord) {
  if (!discord) {
    return null;
  }
  
  const section = document.createElement('div');
  section.className = 'community-section';
  
  const title = document.createElement('h2');
  title.className = 'community-section-title';
  title.textContent = 'DISCORD СЕРВЕР';
  section.appendChild(title);
  
  // Показываем карточку даже если ссылка placeholder
  // Описание теперь внутри карточки
  const isPlaceholder = !discord.link || discord.link === 'https://discord.gg/...';
  const card = createDiscordCard(
    discord.link || '#',
    getIconPath('discord-server'), // Используем отдельную иконку для сервера
    'сервер сообщества 2IQ',
    isPlaceholder ? 'Discord Сервер (скоро)' : 'Присоединиться к Discord серверу',
    discord.description || 'Присоединяйтесь к нашему сообществу разработчиков игр', // Описание внутри карточки
    isPlaceholder,
    null // Подзаголовок убран
  );
  section.appendChild(card);
  
  return section;
}

/**
 * Создает секцию донатов
 */
function createDonationsSection(donationLinks) {
  if (!donationLinks || donationLinks.length === 0) {
    return null;
  }
  
  const section = document.createElement('div');
  section.className = 'community-section';
  
  const title = document.createElement('h2');
  title.className = 'community-section-title';
  title.textContent = 'ПОДДЕРЖКА';
  section.appendChild(title);
  
  const linksContainer = document.createElement('div');
  linksContainer.className = 'community-donations-links';
  
  donationLinks.forEach(donation => {
    const iconPath = getIconPath(donation.id || donation.platform);
    const isPlaceholder = !donation.url || donation.url.includes('...');
    
    const card = createCommunityCard(
      donation.url || '#',
      iconPath,
      donation.platform,
      isPlaceholder ? `${donation.platform} (скоро)` : `Поддержать на ${donation.platform}`,
      null,
      isPlaceholder
    );
    linksContainer.appendChild(card);
  });
  
  if (linksContainer.children.length > 0) {
    section.appendChild(linksContainer);
    return section;
  }
  
  return null;
}

/**
 * Создает секцию социальных ссылок
 */
function createSocialSection(socialLinks) {
  if (!socialLinks) {
    return null;
  }
  
  const section = document.createElement('div');
  section.className = 'community-section';
  
  const title = document.createElement('h2');
  title.className = 'community-section-title';
  title.textContent = 'СОЦИАЛЬНЫЕ СЕТИ';
  section.appendChild(title);
  
  const linksContainer = document.createElement('div');
  linksContainer.className = 'community-social-links';
  
  const socialPlatforms = [
    { key: 'steam', label: 'Steam', url: socialLinks.steam },
    { key: 'telegram', label: 'Telegram', url: socialLinks.telegram },
    { key: 'itch', label: 'itch.io', url: socialLinks.itch }
  ];
  
  socialPlatforms.forEach(platform => {
    const iconPath = getIconPath(platform.key);
    const isPlaceholder = !platform.url || platform.url.includes('...');
    
    const card = createCommunityCard(
      platform.url || '#',
      iconPath,
      platform.label,
      isPlaceholder ? `${platform.label} (скоро)` : platform.label,
      null,
      isPlaceholder
    );
    linksContainer.appendChild(card);
  });
  
  if (linksContainer.children.length > 0) {
    section.appendChild(linksContainer);
    return section;
  }
  
  return null;
}

/**
 * Создает секцию рабочих ссылок
 */
function createWorkSection(workLinks) {
  if (!workLinks) {
    return null;
  }
  
  const section = document.createElement('div');
  section.className = 'community-section';
  
  const title = document.createElement('h2');
  title.className = 'community-section-title';
  title.textContent = 'РАБОТА';
  section.appendChild(title);
  
  const linksContainer = document.createElement('div');
  linksContainer.className = 'community-social-links';
  
  const workPlatforms = [
    { key: 'linkedin', label: 'LinkedIn', url: workLinks.linkedin },
    { key: 'headhunter', label: 'HeadHunter', url: workLinks.headhunter },
    { key: 'mail', label: 'Email', url: workLinks.mail }
  ];
  
  workPlatforms.forEach(platform => {
    const iconPath = getIconPath(platform.key);
    const isPlaceholder = !platform.url || platform.url.includes('...');
    
    const card = createCommunityCard(
      platform.url || '#',
      iconPath,
      platform.label,
      isPlaceholder ? `${platform.label} (скоро)` : platform.label,
      null,
      isPlaceholder
    );
    linksContainer.appendChild(card);
  });
  
  if (linksContainer.children.length > 0) {
    section.appendChild(linksContainer);
    return section;
  }
  
  return null;
}

/**
 * Создает секцию событий
 */
function createEventsSection(events) {
  if (!events || events.length === 0) {
    return null;
  }
  
  const section = document.createElement('div');
  section.className = 'community-section';
  
  const title = document.createElement('h2');
  title.className = 'community-section-title';
  title.textContent = 'ПРЕДСТОЯЩИЕ СОБЫТИЯ';
  section.appendChild(title);
  
  const eventsList = document.createElement('div');
  eventsList.className = 'community-events-list';
  
  events.forEach(event => {
    const eventItem = document.createElement('div');
    eventItem.className = 'community-event-item';
    
    const eventTitle = document.createElement('h3');
    eventTitle.className = 'community-event-title';
    eventTitle.textContent = event.title || 'Событие';
    eventItem.appendChild(eventTitle);
    
    if (event.date) {
      const eventDate = document.createElement('p');
      eventDate.className = 'community-event-date';
      eventDate.textContent = event.date;
      eventItem.appendChild(eventDate);
    }
    
    if (event.description) {
      const eventDescription = document.createElement('p');
      eventDescription.className = 'community-event-description';
      eventDescription.textContent = event.description;
      eventItem.appendChild(eventDescription);
    }
    
    eventsList.appendChild(eventItem);
  });
  
  section.appendChild(eventsList);
  return section;
}

/**
 * Выделяет активную страницу в навигации
 */
function setActiveNavigationLink() {
  const navLinks = document.querySelectorAll('.community-navigation .cta-button');
  let currentPage = window.location.pathname.split('/').pop();
  if (currentPage === '' || currentPage === 'index.html') {
    currentPage = 'index.html';
  }

  navLinks.forEach((link) => {
    const linkPage = link.getAttribute('href').split('/').pop();
    if (linkPage === currentPage) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/**
 * Инициализирует обработчик кнопки меню для прокрутки до навигации в tablet режиме
 */
function initMenuButtonScroll() {
  const menuButton = document.querySelector('.header-menu-button');
  const navigationSection = document.querySelector('.community-navigation');
  const pageWrapper = document.querySelector('.page-wrapper');
  
  if (!menuButton || !navigationSection || !pageWrapper) {
    return;
  }
  
  menuButton.addEventListener('click', () => {
    const isTabletMode = window.innerWidth < 1024;
    
    if (isTabletMode) {
      const wrapperRect = pageWrapper.getBoundingClientRect();
      const navRect = navigationSection.getBoundingClientRect();
      const scrollTop = pageWrapper.scrollTop;
      const targetPosition = scrollTop + navRect.top - wrapperRect.top;
      
      pageWrapper.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
}

/**
 * Инициализирует кнопку "Наверх"
 */
function initScrollToTop() {
  const scrollToTopButton = document.getElementById('scroll-to-top');
  if (!scrollToTopButton) return;
  
  const footer = document.querySelector('.footer');
  const pageWrapper = document.querySelector('.page-wrapper');
  
  let lastScrollTop = 0;
  let hideTimeout = null;
  let isAnimating = false;
  
  function isTabletMode() {
    return window.innerWidth < 1024;
  }
  
  function getScrollElement() {
    return isTabletMode() && pageWrapper ? pageWrapper : window;
  }
  
  function getScrollTop() {
    const scrollElement = getScrollElement();
    if (scrollElement === window) {
      return window.pageYOffset || document.documentElement.scrollTop;
    } else {
      return scrollElement.scrollTop;
    }
  }
  
  function updateButtonPosition() {
    if (!footer) {
      scrollToTopButton.classList.remove('footer-hidden');
      return;
    }
    
    const isFooterHidden = footer.classList.contains('hidden');
    
    if (isFooterHidden) {
      scrollToTopButton.classList.add('footer-hidden');
    } else {
      scrollToTopButton.classList.remove('footer-hidden');
    }
  }
  
  function showButton() {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
      isAnimating = false;
    }
    
    if (scrollToTopButton.classList.contains('visible') && !isAnimating) {
      updateButtonPosition();
      return;
    }
    
    isAnimating = true;
    
    if (scrollToTopButton.style.display === 'none') {
      scrollToTopButton.style.display = 'flex';
      updateButtonPosition();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToTopButton.classList.add('visible');
          setTimeout(() => {
            isAnimating = false;
          }, 300);
        });
      });
    } else {
      updateButtonPosition();
      scrollToTopButton.classList.add('visible');
      setTimeout(() => {
        isAnimating = false;
      }, 300);
    }
  }
  
  function hideButton() {
    if (!scrollToTopButton.classList.contains('visible') && scrollToTopButton.style.display === 'none') {
      return;
    }
    
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
    
    isAnimating = true;
    scrollToTopButton.classList.remove('visible');
    
    hideTimeout = setTimeout(() => {
      if (!scrollToTopButton.classList.contains('visible')) {
        scrollToTopButton.style.display = 'none';
      }
      isAnimating = false;
      hideTimeout = null;
    }, 300);
  }
  
  function handleScroll() {
    const scrollTop = getScrollTop();
    const isScrollingUp = scrollTop < lastScrollTop;
    const isAtTop = scrollTop <= 0;
    
    if (isScrollingUp && !isAtTop) {
      showButton();
    } else {
      hideButton();
    }
    
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    
    requestAnimationFrame(() => {
      updateButtonPosition();
    });
  }
  
  scrollToTopButton.addEventListener('click', () => {
    const scrollElement = getScrollElement();
    if (scrollElement === window) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      scrollElement.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  });
  
  if (footer) {
    const footerObserver = new MutationObserver(() => {
      requestAnimationFrame(() => {
        updateButtonPosition();
      });
    });
    
    footerObserver.observe(footer, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
  
  function setupScrollListener() {
    const scrollElement = getScrollElement();
    if (scrollElement === window) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    }
  }
  
  function updateScrollListener() {
    window.removeEventListener('scroll', handleScroll);
    if (pageWrapper) {
      pageWrapper.removeEventListener('scroll', handleScroll);
    }
    lastScrollTop = getScrollTop();
    setupScrollListener();
  }
  
  setupScrollListener();
  
  window.addEventListener('resize', () => {
    updateScrollListener();
    handleScroll();
  });
  
  lastScrollTop = getScrollTop();
  handleScroll();
  updateButtonPosition();
}

/**
 * Инициализирует страницу сообщества
 */
async function initCommunityPage() {
  // Загружаем данные
  const data = await loadCommunityData();
  
  if (!data) {
    return;
  }
  
  // Отображаем Discord сервер
  if (data.discord) {
    const discordSection = createDiscordSection(data.discord);
    if (discordSection) {
      const container = document.getElementById('community-discord-section');
      if (container) {
        discordSection.style.opacity = '0';
        discordSection.style.transform = 'translateY(10px)';
        container.appendChild(discordSection);
        
        // Загружаем SVG иконки после добавления в DOM
        requestAnimationFrame(async () => {
          try {
            const svgLoaderModule = await import('../components/svg-loader.js');
            if (svgLoaderModule.default) {
              await svgLoaderModule.default();
            }
            
            // Устанавливаем фиксированный размер иконки 128x128
            const card = discordSection.querySelector('.community-card-discord');
            const iconContainer = card?.querySelector('.community-card-icon-left');
            if (card && iconContainer) {
              iconContainer.style.width = '128px';
              iconContainer.style.minWidth = '128px';
              iconContainer.style.height = '128px';
            }
          } catch (error) {
            console.error('Ошибка загрузки SVG:', error);
          }
        });
        
        // Плавное появление секции
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            discordSection.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
            discordSection.style.opacity = '1';
            discordSection.style.transform = 'translateY(0)';
            setTimeout(() => {
              discordSection.style.transform = '';
              discordSection.style.opacity = '';
              discordSection.style.transition = '';
            }, 300);
          });
        });
        
        // Плавное появление карточки Discord
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const card = discordSection.querySelector('.community-card');
            if (card) {
              card.style.opacity = '0';
              card.style.transform = 'translateY(10px)';
              card.style.transition = 'none';
              
              setTimeout(() => {
                card.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
                
                setTimeout(() => {
                  card.style.transform = '';
                  card.style.opacity = '';
                  card.style.transition = '';
                }, 400);
              }, 100);
            }
          });
        });
      }
    }
  }
  
  // Отображаем социальные ссылки
  if (data.socialLinks) {
    const socialSection = createSocialSection(data.socialLinks);
    if (socialSection) {
      const container = document.getElementById('community-social-section');
      if (container) {
        socialSection.style.opacity = '0';
        socialSection.style.transform = 'translateY(10px)';
        container.appendChild(socialSection);
        
        // Загружаем SVG иконки после добавления в DOM
        requestAnimationFrame(async () => {
          try {
            const svgLoaderModule = await import('../components/svg-loader.js');
            if (svgLoaderModule.default) {
              await svgLoaderModule.default();
            }
          } catch (error) {
            console.error('Ошибка загрузки SVG:', error);
          }
        });
        
        // Плавное появление секции
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            socialSection.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
            socialSection.style.opacity = '1';
            socialSection.style.transform = 'translateY(0)';
            setTimeout(() => {
              socialSection.style.transform = '';
              socialSection.style.opacity = '';
              socialSection.style.transition = '';
            }, 300);
          });
        });
        
        // Плавное появление карточек с задержкой (stagger animation)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const cards = socialSection.querySelectorAll('.community-card');
            cards.forEach((card, index) => {
              card.style.opacity = '0';
              card.style.transform = 'translateY(10px)';
              card.style.transition = 'none';
              
              setTimeout(() => {
                card.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
                
                setTimeout(() => {
                  card.style.transform = '';
                  card.style.opacity = '';
                  card.style.transition = '';
                }, 400);
              }, index * 50); // Задержка 50ms между карточками
            });
          });
        });
      }
    }
  }
  
  // Отображаем донаты
  if (data.donationLinks) {
    const donationsSection = createDonationsSection(data.donationLinks);
    if (donationsSection) {
      const container = document.getElementById('community-donations-section');
      if (container) {
        donationsSection.style.opacity = '0';
        donationsSection.style.transform = 'translateY(10px)';
        container.appendChild(donationsSection);
        
        // Загружаем SVG иконки после добавления в DOM
        requestAnimationFrame(async () => {
          try {
            const svgLoaderModule = await import('../components/svg-loader.js');
            if (svgLoaderModule.default) {
              await svgLoaderModule.default();
            }
          } catch (error) {
            console.error('Ошибка загрузки SVG:', error);
          }
        });
        
        // Плавное появление секции
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            donationsSection.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
            donationsSection.style.opacity = '1';
            donationsSection.style.transform = 'translateY(0)';
            setTimeout(() => {
              donationsSection.style.transform = '';
              donationsSection.style.opacity = '';
              donationsSection.style.transition = '';
            }, 300);
          });
        });
        
        // Плавное появление карточек с задержкой (stagger animation)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const cards = donationsSection.querySelectorAll('.community-card');
            cards.forEach((card, index) => {
              card.style.opacity = '0';
              card.style.transform = 'translateY(10px)';
              card.style.transition = 'none';
              
              setTimeout(() => {
                card.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
                
                setTimeout(() => {
                  card.style.transform = '';
                  card.style.opacity = '';
                  card.style.transition = '';
                }, 400);
              }, index * 50); // Задержка 50ms между карточками
            });
          });
        });
      }
    }
  }
  
  // Отображаем рабочие ссылки
  if (data.workLinks) {
    const workSection = createWorkSection(data.workLinks);
    if (workSection) {
      const container = document.getElementById('community-work-section');
      if (container) {
        workSection.style.opacity = '0';
        workSection.style.transform = 'translateY(10px)';
        container.appendChild(workSection);
        
        // Загружаем SVG иконки после добавления в DOM
        requestAnimationFrame(async () => {
          try {
            const svgLoaderModule = await import('../components/svg-loader.js');
            if (svgLoaderModule.default) {
              await svgLoaderModule.default();
            }
          } catch (error) {
            console.error('Ошибка загрузки SVG:', error);
          }
        });
        
        // Плавное появление секции
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            workSection.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
            workSection.style.opacity = '1';
            workSection.style.transform = 'translateY(0)';
            setTimeout(() => {
              workSection.style.transform = '';
              workSection.style.opacity = '';
              workSection.style.transition = '';
            }, 300);
          });
        });
        
        // Плавное появление карточек с задержкой (stagger animation)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const cards = workSection.querySelectorAll('.community-card');
            cards.forEach((card, index) => {
              card.style.opacity = '0';
              card.style.transform = 'translateY(10px)';
              card.style.transition = 'none';
              
              setTimeout(() => {
                card.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
                
                setTimeout(() => {
                  card.style.transform = '';
                  card.style.opacity = '';
                  card.style.transition = '';
                }, 400);
              }, index * 50); // Задержка 50ms между карточками
            });
          });
        });
      }
    }
  }
  
  // Отображаем события
  if (data.upcomingEvents) {
    const eventsSection = createEventsSection(data.upcomingEvents);
    if (eventsSection) {
      const container = document.getElementById('community-events-section');
      if (container) {
        eventsSection.style.opacity = '0';
        eventsSection.style.transform = 'translateY(10px)';
        container.appendChild(eventsSection);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            eventsSection.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
            eventsSection.style.opacity = '1';
            eventsSection.style.transform = 'translateY(0)';
            setTimeout(() => {
              eventsSection.style.transform = '';
              eventsSection.style.opacity = '';
              eventsSection.style.transition = '';
            }, 300);
          });
        });
      }
    }
  }
  
  // Инициализируем кнопку меню для прокрутки до навигации
  initMenuButtonScroll();
  
  // Инициализируем кнопку "Наверх"
  initScrollToTop();
  
  // Выделяем активную страницу в навигации
  setActiveNavigationLink();
  
  // Загружаем SVG для кнопки "Наверх" и иконок
  const svgLoaderModule = await import('../components/svg-loader.js');
  if (svgLoaderModule.default) {
    await svgLoaderModule.default();
  }
}

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCommunityPage);
} else {
  initCommunityPage();
}
