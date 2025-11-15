/**
 * Страница 404
 */
import { BasePage } from './BasePage.js';
import { DOMHelper } from '../utils/dom-helpers.js';
import { animateElementsAppearance } from '../utils/AnimationUtils.js';

export class NotFoundPage extends BasePage {
  constructor() {
    super({
      navigationSelector: '',
      imageSelector: '.page-404 img'
    });
    this.ctaContent = null;
  }

  /**
   * Скрывает все элементы страницы 404
   */
  hideAllElementsImmediately() {
    this.ctaContent = document.querySelector('.cta-slide-content');
    if (!this.ctaContent) return;
    
    const title404 = this.ctaContent.querySelector('.main-content-name');
    const subtitle = this.ctaContent.querySelector('.main-content-title');
    const description = this.ctaContent.querySelector('.main-content-description');
    const buttons = this.ctaContent.querySelectorAll('.cta-button');
    
    const elementsToHide = [title404, subtitle, description, ...buttons].filter(Boolean);
    DOMHelper.hideElementsForAnimation(elementsToHide);
  }

  /**
   * Инициализирует анимации элементов страницы 404
   */
  initializeAnimations() {
    this.ctaContent = document.querySelector('.cta-slide-content');
    if (!this.ctaContent) return;
    
    this.hideAllElementsImmediately();
    
    if (this.ctaContent.firstElementChild) {
      DOMHelper.forceReflow(this.ctaContent.firstElementChild);
    }
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const title404 = this.ctaContent.querySelector('.main-content-name');
        const subtitle = this.ctaContent.querySelector('.main-content-title');
        const description = this.ctaContent.querySelector('.main-content-description');
        const buttons = this.ctaContent.querySelectorAll('.cta-button');
        
        const elementsToCheck = [title404, subtitle, description, ...buttons].filter(Boolean);
        
        elementsToCheck.forEach(el => {
          if (el && DOMHelper.isElementVisible(el)) {
            DOMHelper.hideElementsForAnimation([el]);
          }
        });
        
        if (this.ctaContent.firstElementChild) {
          DOMHelper.forceReflow(this.ctaContent.firstElementChild);
        }
        
        setTimeout(() => {
          const allElementsToAnimate = [];
          
          if (title404) allElementsToAnimate.push(title404);
          if (subtitle) allElementsToAnimate.push(subtitle);
          if (description) allElementsToAnimate.push(description);
          buttons.forEach(btn => {
            if (btn) allElementsToAnimate.push(btn);
          });
          
          if (allElementsToAnimate.length > 0) {
            DOMHelper.forceReflow(allElementsToAnimate[0]);
            
            allElementsToAnimate.forEach(element => {
              if (element && DOMHelper.isElementVisible(element)) {
                DOMHelper.hideElementsForAnimation([element]);
              }
            });
            
            if (allElementsToAnimate.length > 0) {
              DOMHelper.forceReflow(allElementsToAnimate[0]);
            }
            
            animateElementsAppearance(allElementsToAnimate, { skipInitialState: false });
          }
        }, 100);
      });
    });
  }

  /**
   * Инициализирует страницу
   */
  async init() {
    this.hideAllElementsImmediately();
    
    await this.waitForPageReady();
    this.initializeAnimations();
  }
}

