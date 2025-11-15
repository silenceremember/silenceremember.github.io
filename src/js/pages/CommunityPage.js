/**
 * Страница сообщества - загрузка и отображение данных из JSON
 */

import { BasePage } from './BasePage.js';
import { loadData } from '../utils/DataLoader.js';
import { CardFactory } from '../factories/CardFactory.js';
import { CommunityAnimationManager } from '../managers/CommunityAnimationManager.js';

/**
 * Класс страницы сообщества
 */
export class CommunityPage extends BasePage {
  /**
   * Создает экземпляр страницы сообщества
   */
  constructor() {
    super({
      navigationSelector: '.community-navigation',
      imageSelector: '.community-page img, .community-section img'
    });
    this.animationManager = new CommunityAnimationManager();
  }

  /**
   * Получает путь к иконке для платформы
   * @private
   */
  getIconPath(platform) {
    const iconMap = {
      'discord': 'assets/images/icon-discord.svg',
      'discord-server': 'assets/images/icon-discord-server.svg',
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
    
    return iconMap[platform.toLowerCase()] || 'assets/images/icon-placeholder.svg';
  }

  /**
   * Загружает данные сообщества из JSON
   */
  async loadCommunityData() {
    try {
      const data = await loadData('/data/community.json');
      return data;
    } catch (error) {
      console.error('Ошибка загрузки данных сообщества:', error);
      return null;
    }
  }

  /**
   * Создает секцию Discord
   */
  createDiscordSection(discord) {
    if (!discord) {
      return null;
    }
    
    const section = this.createSectionWithTitle({
      className: 'community-section',
      title: 'DISCORD СЕРВЕР',
      titleClassName: 'community-section-title'
    });
    
    const isPlaceholder = !discord.link || discord.link === 'https://discord.gg/...';
    const card = CardFactory.createCommunityCard({
      url: discord.link || '#',
      iconPath: this.getIconPath('discord-server'),
      platformName: 'сервер сообщества 2IQ',
      ariaLabel: isPlaceholder ? 'Discord Сервер (скоро)' : 'Присоединиться к Discord серверу',
      description: discord.description || 'Присоединяйтесь к нашему сообществу разработчиков игр',
      isDiscord: true
    });
    
    section.appendChild(card);
    
    // Устанавливаем фиксированный размер иконки 128x128
    const iconContainer = card?.querySelector('.community-card-icon-left');
    if (card && iconContainer) {
      iconContainer.style.width = '128px';
      iconContainer.style.minWidth = '128px';
      iconContainer.style.height = '128px';
    }
    
    return section;
  }

  /**
   * Создает секцию социальных ссылок
   */
  createSocialSection(socialLinks) {
    if (!socialLinks) {
      return null;
    }
    
    const section = this.createSectionWithTitle({
      className: 'community-section',
      title: 'СОЦИАЛЬНЫЕ СЕТИ',
      titleClassName: 'community-section-title'
    });
    
    const linksContainer = document.createElement('div');
    linksContainer.className = 'community-social-links';
    
    const socialPlatforms = [
      { key: 'steam', label: 'Steam', url: socialLinks.steam },
      { key: 'telegram', label: 'Telegram', url: socialLinks.telegram },
      { key: 'itch', label: 'itch.io', url: socialLinks.itch }
    ];
    
    socialPlatforms.forEach(platform => {
      const iconPath = this.getIconPath(platform.key);
      const isPlaceholder = !platform.url || platform.url.includes('...');
      
      const card = CardFactory.createCommunityCard({
        url: platform.url || '#',
        iconPath: iconPath,
        platformName: platform.label,
        ariaLabel: isPlaceholder ? `${platform.label} (скоро)` : platform.label
      });
      
      linksContainer.appendChild(card);
    });
    
    if (linksContainer.children.length > 0) {
      section.appendChild(linksContainer);
      return section;
    }
    
    return null;
  }

  /**
   * Создает секцию донатов
   */
  createDonationsSection(donationLinks) {
    if (!donationLinks || donationLinks.length === 0) {
      return null;
    }
    
    const section = this.createSectionWithTitle({
      className: 'community-section',
      title: 'ПОДДЕРЖКА',
      titleClassName: 'community-section-title'
    });
    
    const linksContainer = document.createElement('div');
    linksContainer.className = 'community-donations-links';
    
    donationLinks.forEach(donation => {
      const iconPath = this.getIconPath(donation.id || donation.platform);
      const isPlaceholder = !donation.url || donation.url.includes('...');
      
      const card = CardFactory.createCommunityCard({
        url: donation.url || '#',
        iconPath: iconPath,
        platformName: donation.platform,
        ariaLabel: isPlaceholder ? `${donation.platform} (скоро)` : `Поддержать на ${donation.platform}`
      });
      
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
  createWorkSection(workLinks) {
    if (!workLinks) {
      return null;
    }
    
    const section = this.createSectionWithTitle({
      className: 'community-section',
      title: 'РАБОТА',
      titleClassName: 'community-section-title'
    });
    
    const linksContainer = document.createElement('div');
    linksContainer.className = 'community-social-links';
    
    const workPlatforms = [
      { key: 'linkedin', label: 'LinkedIn', url: workLinks.linkedin },
      { key: 'headhunter', label: 'HeadHunter', url: workLinks.headhunter },
      { key: 'github', label: 'GitHub', url: workLinks.github },
      { key: 'mail', label: 'Email', url: workLinks.mail }
    ];
    
    workPlatforms.forEach(platform => {
      const iconPath = this.getIconPath(platform.key);
      const isPlaceholder = !platform.url || platform.url.includes('...');
      
      const card = CardFactory.createCommunityCard({
        url: platform.url || '#',
        iconPath: iconPath,
        platformName: platform.label,
        ariaLabel: isPlaceholder ? `${platform.label} (скоро)` : platform.label
      });
      
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
  createEventsSection(events) {
    if (!events || events.length === 0) {
      return null;
    }
    
    const section = this.createSectionWithTitle({
      className: 'community-section',
      title: 'ПРЕДСТОЯЩИЕ СОБЫТИЯ',
      titleClassName: 'community-section-title'
    });
    
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
   * Добавляет секцию в контейнер с начальным скрытым состоянием
   * @private
   */
  addSectionToContainer(section, containerId) {
    if (!section) {
      return;
    }
    
    // Скрываем секцию перед добавлением в DOM
    section.style.setProperty('opacity', '0', 'important');
    section.style.setProperty('transform', 'translateY(10px)', 'important');
    section.style.setProperty('transition', 'none', 'important');
    
    const container = document.getElementById(containerId);
    if (container) {
      container.appendChild(section);
    }
  }

  /**
   * Обработчик события pageshow для повторного запуска анимаций
   */
  handlePageshow(event) {
    if (event.persisted) {
      const firstSection = document.querySelector('.community-section');
      if (firstSection && firstSection.children.length > 0) {
        setTimeout(() => {
          this.animationManager.initializeAnimations();
        }, 100);
      }
    }
  }

  /**
   * Инициализирует страницу сообщества
   */
  async init() {
    // Инициализируем базовые компоненты (навигация, scroll-to-top, SVG loader)
    await this.initBase();
    
    // Инициализируем сервис индикатора загрузки
    this.initLoadingIndicator('community-loading', 'community-loading-container');
    this.loadingIndicator.show();
    
    // Скрываем все элементы сразу для предотвращения FOUC
    this.animationManager.hideAllCommunityElementsImmediately();
    
    // Загружаем данные
    const data = await this.loadCommunityData();
    
    // Скрываем индикатор загрузки и ждем завершения fadeout
    await this.loadingIndicator.hide();
    
    if (!data) {
      return;
    }
    
    // Отображаем Discord сервер
    if (data.discord) {
      const discordSection = this.createDiscordSection(data.discord);
      this.addSectionToContainer(discordSection, 'community-discord-section');
    }
    
    // Отображаем социальные ссылки
    if (data.socialLinks) {
      const socialSection = this.createSocialSection(data.socialLinks);
      this.addSectionToContainer(socialSection, 'community-social-section');
    }
    
    // Отображаем донаты
    if (data.donationLinks) {
      const donationsSection = this.createDonationsSection(data.donationLinks);
      this.addSectionToContainer(donationsSection, 'community-donations-section');
    }
    
    // Отображаем рабочие ссылки
    if (data.workLinks) {
      const workSection = this.createWorkSection(data.workLinks);
      this.addSectionToContainer(workSection, 'community-work-section');
    }
    
    // Отображаем события
    if (data.upcomingEvents) {
      const eventsSection = this.createEventsSection(data.upcomingEvents);
      this.addSectionToContainer(eventsSection, 'community-events-section');
    }
    
    // Скрываем все элементы после добавления всех секций
    this.animationManager.hideAllCommunityElementsImmediately();
    
    // Загружаем SVG иконки для всех добавленных карточек
    // Используем небольшую задержку для гарантии, что все элементы добавлены в DOM
    await new Promise(resolve => setTimeout(resolve, 0));
    await this.svgLoader.init();
    
    // Ждем полной загрузки страницы и запускаем анимации
    await this.waitForPageReady();
    this.animationManager.initializeAnimations();
  }
}

