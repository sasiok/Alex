const flsModules = {}

// ========================================================= Меню-бургер =================================
let bodyLockStatus = true;
let bodyLock = (delay = 500) => {
    let body = document.querySelector("body");
    if (bodyLockStatus) {
        let lock_padding = document.querySelectorAll("[data-lp]");
        for (let index = 0; index < lock_padding.length; index++) {
            const el = lock_padding[index];
            el.style.paddingRight = window.innerWidth - document.querySelector('.wrapper').offsetWidth + 'px';
        }
        body.style.paddingRight = window.innerWidth - document.querySelector('.wrapper').offsetWidth + 'px';
        document.documentElement.classList.add("lock");

        bodyLockStatus = false;
        setTimeout(function () {
            bodyLockStatus = true;
        }, delay);
    }
}

let bodyLockToggle = (delay = 500) => {
    if (document.documentElement.classList.contains('lock')) {
        bodyUnlock(delay);
    } else {
        bodyLock(delay);
    }
}

let bodyUnlock = (delay = 500) => {
    let body = document.querySelector("body");
    if (bodyLockStatus) {
        let lock_padding = document.querySelectorAll("[data-lp]");
        setTimeout(() => {
            for (let index = 0; index < lock_padding.length; index++) {
                const el = lock_padding[index];
                el.style.paddingRight = '0px';
            }
            body.style.paddingRight = '0px';
            document.documentElement.classList.remove("lock");
        }, delay);
        bodyLockStatus = false;
        setTimeout(function () {
            bodyLockStatus = true;
        }, delay);
    }
}

function menuInit() {
    if (document.querySelector(".icon-menu")) {
        document.addEventListener("click", function (e) {
            if (bodyLockStatus && e.target.closest('.icon-menu')) {
                bodyLockToggle();
                document.documentElement.classList.toggle("menu-open");
            }
        });
    };
}
function menuOpen() {
    bodyLock();
    document.documentElement.classList.add("menu-open");
}
function menuClose() {
    bodyUnlock();
    document.documentElement.classList.remove("menu-open");
}

menuInit();

//================================================================== full page ===============================================
/* Перевірка мобільного браузера */
let isMobile = { Android: function () { return navigator.userAgent.match(/Android/i); }, BlackBerry: function () { return navigator.userAgent.match(/BlackBerry/i); }, iOS: function () { return navigator.userAgent.match(/iPhone|iPad|iPod/i); }, Opera: function () { return navigator.userAgent.match(/Opera Mini/i); }, Windows: function () { return navigator.userAgent.match(/IEMobile/i); }, any: function () { return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows()); } };

/*
    data-fp - оболонка
    data-fp-section - секції

    Перехід на певний слайд
    fpage.switchingSection(id);

    Встановлення z-index
    fPage.init();
    fPage.destroy();
    fPage.setZIndex();

    id активного слайду
    fPage.activeSectionId
    Активний слайд
    fPage.activeSection

    Події
    fpinit
    fpdestroy
    fpswitching
*/

// Клас FullPage
class FullPage {
    constructor(element, options) {
        let config = {
            //===============================
            // Селектор, на якому не працює подія свайпа/колеса
            noEventSelector: '[data-no-event]',
            //===============================
            // Налаштування оболонки
            // Клас при ініціалізації плагіна
            classInit: 'fp-init',
            // Клас для врапера під час гортання
            wrapperAnimatedClass: 'fp-switching',
            //===============================
            // Налаштування секцій
            // СЕЛЕКТОР для секцій
            selectorSection: '[data-fp-section]',
            // Клас для активної секції
            activeClass: 'active-section',
            // Клас для Попередньої секції
            previousClass: 'previous-section',
            // Клас для наступної секції
            nextClass: 'next-section',
            // id початково активного класу
            idActiveSection: 0,
            //===============================
            // Інші налаштування
            // Свайп мишею
            // touchSimulator: false,
            //===============================
            // Ефекти
            // Ефекти: fade, cards, slider
            mode: element.dataset.fpEffect ? element.dataset.fpEffect : 'slider',
            //===============================
            // Булети
            // Активація буллетів
            bullets: element.hasAttribute('data-fp-bullets') ? true : false,
            // Клас оболонки буллетів
            bulletsClass: 'fp-bullets',
            // Клас буллета
            bulletClass: 'fp-bullet',
            // Клас активного буллета
            bulletActiveClass: 'fp-bullet-active',
            //===============================
            // Події
            // Подія створення
            onInit: function () { },
            // Подія перегортання секції
            onSwitching: function () { },
            // Подія руйнування плагіна
            onDestroy: function () { },
        }
        this.options = Object.assign(config, options);
        // Батьківський єлемент
        this.wrapper = element;
        this.sections = this.wrapper.querySelectorAll(this.options.selectorSection);
        // Активний слайд
        this.activeSection = false;
        this.activeSectionId = false;
        // Попередній слайд
        this.previousSection = false;
        this.previousSectionId = false;
        // Наступний слайд
        this.nextSection = false;
        this.nextSectionId = false;
        // Оболонка буллетів
        this.bulletsWrapper = false;
        // Допоміжна змінна
        this.stopEvent = false;
        if (this.sections.length) {
            // Ініціалізація елементів
            this.init();
        }
    }
    //===============================
    // Початкова ініціалізація
    init() {
        if (this.options.idActiveSection > (this.sections.length - 1)) return
        // Розставляємо id
        this.setId();
        this.activeSectionId = this.options.idActiveSection;
        // Присвоєння класів із різними ефектами
        this.setEffectsClasses();
        // Встановлення класів
        this.setClasses();
        // Встановлення стилів
        this.setStyle();
        // Встановлення булетів
        if (this.options.bullets) {
            this.setBullets();
            this.setActiveBullet(this.activeSectionId);
        }
        // Встановлення подій
        this.events();
        // Встановлюємо init клас
        setTimeout(() => {
            document.documentElement.classList.add(this.options.classInit);
            // Створення кастомної події
            this.options.onInit(this);
            document.dispatchEvent(new CustomEvent("fpinit", {
                detail: {
                    fp: this
                }
            }));
        }, 0);
    }
    //===============================
    // Видалити
    destroy() {
        // Видалення подій
        this.removeEvents();
        // Видалення класів у секцій
        this.removeClasses();
        // Видалення класу ініціалізації
        document.documentElement.classList.remove(this.options.classInit);
        // Видалення класу анімації
        this.wrapper.classList.remove(this.options.wrapperAnimatedClass);
        // Видалення класів ефектів
        this.removeEffectsClasses();
        // Видалення z-index у секцій
        this.removeZIndex();
        // Видалення стилів
        this.removeStyle();
        // Видалення ID
        this.removeId();
        // Створення кастомної події
        this.options.onDestroy(this);
        document.dispatchEvent(new CustomEvent("fpdestroy", {
            detail: {
                fp: this
            }
        }));
    }
    //===============================
    // Встановлення ID для секцій
    setId() {
        for (let index = 0; index < this.sections.length; index++) {
            const section = this.sections[index];
            section.setAttribute('data-fp-id', index);
        }
    }
    //===============================
    // Видалення ID для секцій
    removeId() {
        for (let index = 0; index < this.sections.length; index++) {
            const section = this.sections[index];
            section.removeAttribute('data-fp-id');
        }
    }
    //===============================
    // Функція встановлення класів для першої, активної та наступної секцій
    setClasses() {
        // Збереження id для ПОПЕРЕДНЬОГО слайду (якщо такий є)
        this.previousSectionId = (this.activeSectionId - 1) >= 0 ?
            this.activeSectionId - 1 : false;

        // Збереження id для НАСТУПНОГО слайду (якщо такий є)
        this.nextSectionId = (this.activeSectionId + 1) < this.sections.length ?
            this.activeSectionId + 1 : false;

        // Встановлення класу та присвоєння елемента для АКТИВНОГО слайду
        this.activeSection = this.sections[this.activeSectionId];
        this.activeSection.classList.add(this.options.activeClass);

        // Встановлення класу та присвоєння елементу для ПОПЕРЕДНЬОГО слайду
        if (this.previousSectionId !== false) {
            this.previousSection = this.sections[this.previousSectionId];
            this.previousSection.classList.add(this.options.previousClass);
        } else {
            this.previousSection = false;
        }

        // Встановлення класу та присвоєння елемента для НАСТУПНОГО слайду
        if (this.nextSectionId !== false) {
            this.nextSection = this.sections[this.nextSectionId];
            this.nextSection.classList.add(this.options.nextClass);
        } else {
            this.nextSection = false;
        }
    }
    //===============================
    // Присвоєння класів із різними ефектами
    removeEffectsClasses() {
        switch (this.options.mode) {
            case 'slider':
                this.wrapper.classList.remove('slider-mode');
                break;

            case 'cards':
                this.wrapper.classList.remove('cards-mode');
                this.setZIndex();
                break;

            case 'fade':
                this.wrapper.classList.remove('fade-mode');
                this.setZIndex();
                break;

            default:
                break;
        }
    }
    //===============================
    // Присвоєння класів із різними ефектами
    setEffectsClasses() {
        switch (this.options.mode) {
            case 'slider':
                this.wrapper.classList.add('slider-mode');
                break;

            case 'cards':
                this.wrapper.classList.add('cards-mode');
                this.setZIndex();
                break;

            case 'fade':
                this.wrapper.classList.add('fade-mode');
                this.setZIndex();
                break;

            default:
                break;
        }
    }
    //===============================
    // Блокування напрямків скролла
    //===============================
    // Функція встановлення стилів
    setStyle() {
        switch (this.options.mode) {
            case 'slider':
                this.styleSlider();
                break;

            case 'cards':
                this.styleCards();
                break;

            case 'fade':
                this.styleFade();
                break;
            default:
                break;
        }
    }
    // slider-mode
    styleSlider() {
        for (let index = 0; index < this.sections.length; index++) {
            const section = this.sections[index];
            if (index === this.activeSectionId) {
                section.style.transform = 'translate3D(0,0,0)';
            } else if (index < this.activeSectionId) {
                section.style.transform = 'translate3D(0,-100%,0)';
            } else if (index > this.activeSectionId) {
                section.style.transform = 'translate3D(0,100%,0)';
            }
        }
    }
    // cards mode
    styleCards() {
        for (let index = 0; index < this.sections.length; index++) {
            const section = this.sections[index];
            if (index >= this.activeSectionId) {
                section.style.transform = 'translate3D(0,0,0)';
            } else if (index < this.activeSectionId) {
                section.style.transform = 'translate3D(0,-100%,0)';
            }
        }
    }
    // fade style 
    styleFade() {
        for (let index = 0; index < this.sections.length; index++) {
            const section = this.sections[index];
            if (index === this.activeSectionId) {
                section.style.opacity = '1';
                section.style.visibility = 'visible';
            } else {
                section.style.opacity = '0';
                section.style.visibility = 'hidden';
            }
        }
    }
    //===============================
    // Видалення стилів
    removeStyle() {
        for (let index = 0; index < this.sections.length; index++) {
            const section = this.sections[index];
            section.style.opacity = '';
            section.style.visibility = '';
            section.style.transform = '';
        }
    }
    //===============================
    // Функція перевірки чи повністю було прокручено елемент
    checkScroll(yCoord, element) {
        this.goScroll = false;

        // Чи є елемент і чи готовий до роботи 
        if (!this.stopEvent && element) {
            this.goScroll = true;
            // Якщо висота секції не дорівнює висоті вікна
            if (this.haveScroll(element)) {
                this.goScroll = false;
                const position = Math.round(element.scrollHeight - element.scrollTop);
                // Перевірка на те, чи повністю прокручена секція
                if (
                    ((Math.abs(position - element.scrollHeight) < 2) && yCoord <= 0) ||
                    ((Math.abs(position - element.clientHeight) < 2) && yCoord >= 0)
                ) {
                    this.goScroll = true;
                }
            }
        }
    }
    //===============================
    // Перевірка висоти 
    haveScroll(element) {
        return element.scrollHeight !== window.innerHeight
    }
    //===============================
    // Видалення класів 
    removeClasses() {
        for (let index = 0; index < this.sections.length; index++) {
            const section = this.sections[index];
            section.classList.remove(this.options.activeClass);
            section.classList.remove(this.options.previousClass);
            section.classList.remove(this.options.nextClass);
        }
    }
    //===============================
    // Збірник подій...
    events() {
        this.events = {
            // Колесо миші
            wheel: this.wheel.bind(this),

            // Свайп
            touchdown: this.touchDown.bind(this),
            touchup: this.touchUp.bind(this),
            touchmove: this.touchMove.bind(this),
            touchcancel: this.touchUp.bind(this),

            // Кінець анімації
            transitionEnd: this.transitionend.bind(this),

            // Клік для буллетів
            click: this.clickBullets.bind(this),
        }
        if (isMobile.iOS()) {
            document.addEventListener('touchmove', (e) => {
                e.preventDefault();
            });
        }
        this.setEvents();
    }
    setEvents() {
        // Подія колеса миші
        this.wrapper.addEventListener('wheel', this.events.wheel);
        // Подія натискання на екран
        this.wrapper.addEventListener('touchstart', this.events.touchdown);
        // Подія кліка по булетах
        if (this.options.bullets && this.bulletsWrapper) {
            this.bulletsWrapper.addEventListener('click', this.events.click);
        }
    }
    removeEvents() {
        this.wrapper.removeEventListener('wheel', this.events.wheel);
        this.wrapper.removeEventListener('touchdown', this.events.touchdown);
        this.wrapper.removeEventListener('touchup', this.events.touchup);
        this.wrapper.removeEventListener('touchcancel', this.events.touchup);
        this.wrapper.removeEventListener('touchmove', this.events.touchmove);
        if (this.bulletsWrapper) {
            this.bulletsWrapper.removeEventListener('click', this.events.click);
        }
    }
    //===============================
    // Функція кліка по булетах
    clickBullets(e) {
        // Натиснутий буллет
        const bullet = e.target.closest(`.${this.options.bulletClass}`);
        if (bullet) {
            // Масив усіх буллетів
            const arrayChildren = Array.from(this.bulletsWrapper.children);

            // id Натиснутого буллета
            const idClickBullet = arrayChildren.indexOf(bullet)

            // Перемикання секції
            this.switchingSection(idClickBullet)
        }
    }
    //===============================
    // Установка стилів для буллетів
    setActiveBullet(idButton) {
        if (!this.bulletsWrapper) return
        // Усі буллети
        const bullets = this.bulletsWrapper.children;

        for (let index = 0; index < bullets.length; index++) {
            const bullet = bullets[index];
            if (idButton === index) bullet.classList.add(this.options.bulletActiveClass);
            else bullet.classList.remove(this.options.bulletActiveClass);
        }
    }
    //===============================
    // Функція натискання тач/пера/курсора
    touchDown(e) {
        // Змінна для свайпа
        this._yP = e.changedTouches[0].pageY;
        this._eventElement = e.target.closest(`.${this.options.activeClass}`);
        if (this._eventElement) {
            // Вішаємо подію touchmove та touchup
            this._eventElement.addEventListener('touchend', this.events.touchup);
            this._eventElement.addEventListener('touchcancel', this.events.touchup);
            this._eventElement.addEventListener('touchmove', this.events.touchmove);
            // Тач стався
            this.clickOrTouch = true;

            //==============================
            if (isMobile.iOS()) {
                if (this._eventElement.scrollHeight !== this._eventElement.clientHeight) {
                    if (this._eventElement.scrollTop === 0) {
                        this._eventElement.scrollTop = 1;
                    }
                    if (this._eventElement.scrollTop === this._eventElement.scrollHeight - this._eventElement.clientHeight) {
                        this._eventElement.scrollTop = this._eventElement.scrollHeight - this._eventElement.clientHeight - 1;
                    }
                }
                this.allowUp = this._eventElement.scrollTop > 0;
                this.allowDown = this._eventElement.scrollTop < (this._eventElement.scrollHeight - this._eventElement.clientHeight);
                this.lastY = e.changedTouches[0].pageY;
            }
            //===============================

        }


    }
    //===============================
    // Подія руху тач/пера/курсора
    touchMove(e) {
        // Отримання секції, на якій спрацьовує подію
        const targetElement = e.target.closest(`.${this.options.activeClass}`);
        //===============================
        if (isMobile.iOS()) {
            let up = e.changedTouches[0].pageY > this.lastY;
            let down = !up;
            this.lastY = e.changedTouches[0].pageY;
            if (targetElement) {
                if ((up && this.allowUp) || (down && this.allowDown)) {
                    e.stopPropagation();
                } else if (e.cancelable) {
                    e.preventDefault();
                }
            }
        }
        //===============================
        // Перевірка на завершення анімації та наявність НЕ ПОДІЙНОГО блоку
        if (!this.clickOrTouch || e.target.closest(this.options.noEventSelector)) return
        // Отримання напряму руху
        let yCoord = this._yP - e.changedTouches[0].pageY;
        // Чи дозволено перехід? 
        this.checkScroll(yCoord, targetElement);
        // Перехід
        if (this.goScroll && Math.abs(yCoord) > 20) {
            this.choiceOfDirection(yCoord);
        }
    }
    //===============================
    // Подія відпускання від екрану тач/пера/курсора
    touchUp(e) {
        // Видалення подій
        this._eventElement.removeEventListener('touchend', this.events.touchup);
        this._eventElement.removeEventListener('touchcancel', this.events.touchup);
        this._eventElement.removeEventListener('touchmove', this.events.touchmove);
        return this.clickOrTouch = false;
    }
    //===============================
    // Кінець спрацьовування переходу
    transitionend(e) {
        if (e.target.closest(this.options.selectorSection)) {
            this.stopEvent = false;
            this.wrapper.classList.remove(this.options.wrapperAnimatedClass);
        }
    }
    //===============================
    // Подія прокручування колесом миші
    wheel(e) {
        // Перевірка на наявність НЕ ПОДІЙНОГО блоку
        if (e.target.closest(this.options.noEventSelector)) return
        // Отримання напряму руху
        const yCoord = e.deltaY;
        // Отримання секції, на якій спрацьовує подію
        const targetElement = e.target.closest(`.${this.options.activeClass}`);
        // Чи дозволено перехід? 
        this.checkScroll(yCoord, targetElement);
        // Перехід
        if (this.goScroll) this.choiceOfDirection(yCoord);
    }
    //===============================
    // Функція вибору напряму
    choiceOfDirection(direction) {
        // Зупиняємо роботу подій
        this.stopEvent = true;

        // Якщо слайд крайні, то дозволяємо події
        if (((this.activeSectionId === 0) && direction < 0) || ((this.activeSectionId === (this.sections.length - 1)) && direction > 0)) {
            this.stopEvent = false;
        }

        // Встановлення потрібних id
        if (direction > 0 && this.nextSection !== false) {
            this.activeSectionId = (this.activeSectionId + 1) < this.sections.length ?
                ++this.activeSectionId : this.activeSectionId;
        } else if (direction < 0 && this.previousSection !== false) {
            this.activeSectionId = (this.activeSectionId - 1) >= 0 ?
                --this.activeSectionId : this.activeSectionId;
        }

        // Зміна слайдів
        if (this.stopEvent) this.switchingSection();
    }
    //===============================
    // Функція перемикання слайдів
    switchingSection(idSection = this.activeSectionId) {
        this.activeSectionId = idSection;
        // Встановлення події закінчення програвання анімації
        this.wrapper.classList.add(this.options.wrapperAnimatedClass);
        this.wrapper.addEventListener('transitionend', this.events.transitionEnd);
        // Видалення класів
        this.removeClasses();
        // Зміна класів 
        this.setClasses();
        // Зміна стилів
        this.setStyle();
        // Встановлення стилів для буллетів
        if (this.options.bullets) this.setActiveBullet(this.activeSectionId);
        // Створення події
        this.options.onSwitching(this);
        document.dispatchEvent(new CustomEvent("fpswitching", {
            detail: {
                fp: this
            }
        }));
    }
    //===============================
    // Встановлення булетів
    setBullets() {
        // Пошук оболонки буллетів
        this.bulletsWrapper = document.querySelector(`.${this.options.bulletsClass}`);

        // Якщо немає створюємо
        if (!this.bulletsWrapper) {
            const bullets = document.createElement('div');
            bullets.classList.add(this.options.bulletsClass);
            this.wrapper.append(bullets);
            this.bulletsWrapper = bullets;
        }

        // Створення буллетів
        if (this.bulletsWrapper) {
            for (let index = 0; index < this.sections.length; index++) {
                const span = document.createElement('span');
                span.classList.add(this.options.bulletClass);
                this.bulletsWrapper.append(span);
            }
        }
    }
    //===============================
    // Z-INDEX
    setZIndex() {
        let zIndex = this.sections.length
        for (let index = 0; index < this.sections.length; index++) {
            const section = this.sections[index];
            section.style.zIndex = zIndex;
            --zIndex;
        }
    }
    removeZIndex() {
        for (let index = 0; index < this.sections.length; index++) {
            const section = this.sections[index];
            section.style.zIndex = ''
        }
    }
}

if (document.querySelector('[data-fp]')) {
    flsModules.fullpage = new FullPage(document.querySelector('[data-fp]'), '');
}

// ================================================================== Slider ===================================================

//Ініціалізація слайдерів
function initSliders() {
    // Список слайдерів
    // Перевіряємо, чи є слайдер на сторінці
    if (document.querySelector('.portfolio__slider')) { // Вказуємо склас потрібного слайдера
        // Створюємо слайдер
        new Swiper('.portfolio__slider', { // Вказуємо склас потрібного слайдера
            observer: true,
            observeParents: true,
            slidesPerView: 3,
            spaceBetween: 56,
            // autoHeight: true,
            speed: 800,

            //touchRatio: 0,
            // simulateTouch: true,
            // loop: true,
            //preloadImages: false,
            //lazy: true,


            // // Ефекти
            // effect: 'fade',
            // autoplay: {
            // 	delay: 3000,
            // 	disableOnInteraction: false,
            // },


            // Пагінація
            /*
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            */

            // Скроллбар

            // scrollbar: {
            //     el: '.swiper-scrollbar',
            //     draggable: true,
            // },


            // Кнопки "вліво/вправо"
            navigation: {
                prevEl: '.portfolio__arrow_left',
                nextEl: '.portfolio__arrow_right',
            },

            breakpoints: {
                320: {
                    slidesPerView: 1.2,
                    spaceBetween: 10,
                    autoHeight: true,
                },
                450: {
                    slidesPerView: 2,
                    spaceBetween: 15,
                },
                992: {
                    slidesPerView: 3,
                    spaceBetween: 20,
                },
                1200: {
                    slidesPerView: 3,
                    spaceBetween: 56,
                },
            },

            // Події
            // on: {

            // }
        });
    }
}

window.addEventListener("load", function (e) {
    // Запуск ініціалізації слайдерів
    initSliders();
    // Запуск ініціалізації скролла на базі слайдера (за класом swiper_scroll)
    //initSlidersScroll();
});

// ============================================================ Tabs ==========================================================================
let _slideUp = (target, duration = 500, showmore = 0) => {
    if (!target.classList.contains('_slide')) {
        target.classList.add('_slide');
        target.style.transitionProperty = 'height, margin, padding';
        target.style.transitionDuration = duration + 'ms';
        target.style.height = `${target.offsetHeight}px`;
        target.offsetHeight;
        target.style.overflow = 'hidden';
        target.style.height = showmore ? `${showmore}px` : `0px`;
        target.style.paddingTop = 0;
        target.style.paddingBottom = 0;
        target.style.marginTop = 0;
        target.style.marginBottom = 0;
        window.setTimeout(() => {
            target.hidden = !showmore ? true : false;
            !showmore ? target.style.removeProperty('height') : null;
            target.style.removeProperty('padding-top');
            target.style.removeProperty('padding-bottom');
            target.style.removeProperty('margin-top');
            target.style.removeProperty('margin-bottom');
            !showmore ? target.style.removeProperty('overflow') : null;
            target.style.removeProperty('transition-duration');
            target.style.removeProperty('transition-property');
            target.classList.remove('_slide');
            // Створюємо подію 
            document.dispatchEvent(new CustomEvent("slideUpDone", {
                detail: {
                    target: target
                }
            }));
        }, duration);
    }
}

let _slideToggle = (target, duration = 500) => {
    if (target.hidden) {
        return _slideDown(target, duration);
    } else {
        return _slideUp(target, duration);
    }
}

let _slideDown = (target, duration = 500, showmore = 0) => {
    if (!target.classList.contains('_slide')) {
        target.classList.add('_slide');
        target.hidden = target.hidden ? false : null;
        showmore ? target.style.removeProperty('height') : null;
        let height = target.offsetHeight;
        target.style.overflow = 'hidden';
        target.style.height = showmore ? `${showmore}px` : `0px`;
        target.style.paddingTop = 0;
        target.style.paddingBottom = 0;
        target.style.marginTop = 0;
        target.style.marginBottom = 0;
        target.offsetHeight;
        target.style.transitionProperty = "height, margin, padding";
        target.style.transitionDuration = duration + 'ms';
        target.style.height = height + 'px';
        target.style.removeProperty('padding-top');
        target.style.removeProperty('padding-bottom');
        target.style.removeProperty('margin-top');
        target.style.removeProperty('margin-bottom');
        window.setTimeout(() => {
            target.style.removeProperty('height');
            target.style.removeProperty('overflow');
            target.style.removeProperty('transition-duration');
            target.style.removeProperty('transition-property');
            target.classList.remove('_slide');
            // Створюємо подію
            document.dispatchEvent(new CustomEvent("slideDownDone", {
                detail: {
                    target: target
                }
            }));
        }, duration);
    }
}

function tabs() {
    const tabs = document.querySelectorAll('[data-tabs]');
    let tabsActiveHash = [];

    if (tabs.length > 0) {
        const hash = getHash();
        if (hash && hash.startsWith('tab-')) {
            tabsActiveHash = hash.replace('tab-', '').split('-');
        }
        tabs.forEach((tabsBlock, index) => {
            tabsBlock.classList.add('_tab-init');
            tabsBlock.setAttribute('data-tabs-index', index);
            tabsBlock.addEventListener("click", setTabsAction);
            initTabs(tabsBlock);
        });

        // Отримання слойлерів з медіа-запитами
        let mdQueriesArray = dataMediaQueries(tabs, "tabs");
        if (mdQueriesArray && mdQueriesArray.length) {
            mdQueriesArray.forEach(mdQueriesItem => {
                // Подія
                mdQueriesItem.matchMedia.addEventListener("change", function () {
                    setTitlePosition(mdQueriesItem.itemsArray, mdQueriesItem.matchMedia);
                });
                setTitlePosition(mdQueriesItem.itemsArray, mdQueriesItem.matchMedia);
            });
        }
    }
    // Встановлення позицій заголовків
    function setTitlePosition(tabsMediaArray, matchMedia) {
        tabsMediaArray.forEach(tabsMediaItem => {
            tabsMediaItem = tabsMediaItem.item;
            let tabsTitles = tabsMediaItem.querySelector('[data-tabs-titles]');
            let tabsTitleItems = tabsMediaItem.querySelectorAll('[data-tabs-title]');
            let tabsContent = tabsMediaItem.querySelector('[data-tabs-body]');
            let tabsContentItems = tabsMediaItem.querySelectorAll('[data-tabs-item]');
            tabsTitleItems = Array.from(tabsTitleItems).filter(item => item.closest('[data-tabs]') === tabsMediaItem);
            tabsContentItems = Array.from(tabsContentItems).filter(item => item.closest('[data-tabs]') === tabsMediaItem);
            tabsContentItems.forEach((tabsContentItem, index) => {
                if (matchMedia.matches) {
                    tabsContent.append(tabsTitleItems[index]);
                    tabsContent.append(tabsContentItem);
                    tabsMediaItem.classList.add('_tab-spoller');
                } else {
                    tabsTitles.append(tabsTitleItems[index]);
                    tabsMediaItem.classList.remove('_tab-spoller');
                }
            });
        });
    }
    // Робота з контентом
    function initTabs(tabsBlock) {
        let tabsTitles = tabsBlock.querySelectorAll('[data-tabs-titles]>*');
        let tabsContent = tabsBlock.querySelectorAll('[data-tabs-body]>*');
        const tabsBlockIndex = tabsBlock.dataset.tabsIndex;
        const tabsActiveHashBlock = tabsActiveHash[0] == tabsBlockIndex;

        if (tabsActiveHashBlock) {
            const tabsActiveTitle = tabsBlock.querySelector('[data-tabs-titles]>._tab-active');
            tabsActiveTitle ? tabsActiveTitle.classList.remove('_tab-active') : null;
        }
        if (tabsContent.length) {
            tabsContent = Array.from(tabsContent).filter(item => item.closest('[data-tabs]') === tabsBlock);
            tabsTitles = Array.from(tabsTitles).filter(item => item.closest('[data-tabs]') === tabsBlock);
            tabsContent.forEach((tabsContentItem, index) => {
                tabsTitles[index].setAttribute('data-tabs-title', '');
                tabsContentItem.setAttribute('data-tabs-item', '');

                if (tabsActiveHashBlock && index == tabsActiveHash[1]) {
                    tabsTitles[index].classList.add('_tab-active');
                }
                tabsContentItem.hidden = !tabsTitles[index].classList.contains('_tab-active');
            });
        }
    }
    function setTabsStatus(tabsBlock) {
        let tabsTitles = tabsBlock.querySelectorAll('[data-tabs-title]');
        let tabsContent = tabsBlock.querySelectorAll('[data-tabs-item]');
        const tabsBlockIndex = tabsBlock.dataset.tabsIndex;
        function isTabsAnamate(tabsBlock) {
            if (tabsBlock.hasAttribute('data-tabs-animate')) {
                return tabsBlock.dataset.tabsAnimate > 0 ? Number(tabsBlock.dataset.tabsAnimate) : 500;
            }
        }
        const tabsBlockAnimate = isTabsAnamate(tabsBlock);
        if (tabsContent.length > 0) {
            const isHash = tabsBlock.hasAttribute('data-tabs-hash');
            tabsContent = Array.from(tabsContent).filter(item => item.closest('[data-tabs]') === tabsBlock);
            tabsTitles = Array.from(tabsTitles).filter(item => item.closest('[data-tabs]') === tabsBlock);
            tabsContent.forEach((tabsContentItem, index) => {
                if (tabsTitles[index].classList.contains('_tab-active')) {
                    if (tabsBlockAnimate) {
                        _slideDown(tabsContentItem, tabsBlockAnimate);
                    } else {
                        tabsContentItem.hidden = false;
                    }
                    if (isHash && !tabsContentItem.closest('.popup')) {
                        setHash(`tab-${tabsBlockIndex}-${index}`);
                    }
                } else {
                    if (tabsBlockAnimate) {
                        _slideUp(tabsContentItem, tabsBlockAnimate);
                    } else {
                        tabsContentItem.hidden = true;
                    }
                }
            });
        }
    }
    function setTabsAction(e) {
        const el = e.target;
        if (el.closest('[data-tabs-title]')) {
            const tabTitle = el.closest('[data-tabs-title]');
            const tabsBlock = tabTitle.closest('[data-tabs]');
            if (!tabTitle.classList.contains('_tab-active') && !tabsBlock.querySelector('._slide')) {
                let tabActiveTitle = tabsBlock.querySelectorAll('[data-tabs-title]._tab-active');
                tabActiveTitle.length ? tabActiveTitle = Array.from(tabActiveTitle).filter(item => item.closest('[data-tabs]') === tabsBlock) : null;
                tabActiveTitle.length ? tabActiveTitle[0].classList.remove('_tab-active') : null;
                tabTitle.classList.add('_tab-active');
                setTabsStatus(tabsBlock);
            }
            e.preventDefault();
        }
    }
}

function dataMediaQueries(array, dataSetValue) {
    // Отримання об'єктів з медіа-запитами
    const media = Array.from(array).filter(function (item, index, self) {
        if (item.dataset[dataSetValue]) {
            return item.dataset[dataSetValue].split(",")[0];
        }
    });
    // Ініціалізація об'єктів з медіа-запитами
    if (media.length) {
        const breakpointsArray = [];
        media.forEach(item => {
            const params = item.dataset[dataSetValue];
            const breakpoint = {};
            const paramsArray = params.split(",");
            breakpoint.value = paramsArray[0];
            breakpoint.type = paramsArray[1] ? paramsArray[1].trim() : "max";
            breakpoint.item = item;
            breakpointsArray.push(breakpoint);
        });
        // Отримуємо унікальні брейкпоінти
        let mdQueries = breakpointsArray.map(function (item) {
            return '(' + item.type + "-width: " + item.value + "px)," + item.value + ',' + item.type;
        });
        mdQueries = uniqArray(mdQueries);
        const mdQueriesArray = [];

        if (mdQueries.length) {
            // Працюємо з кожним брейкпоінтом
            mdQueries.forEach(breakpoint => {
                const paramsArray = breakpoint.split(",");
                const mediaBreakpoint = paramsArray[1];
                const mediaType = paramsArray[2];
                const matchMedia = window.matchMedia(paramsArray[0]);
                // Об'єкти з потрібними умовами
                const itemsArray = breakpointsArray.filter(function (item) {
                    if (item.value === mediaBreakpoint && item.type === mediaType) {
                        return true;
                    }
                });
                mdQueriesArray.push({
                    itemsArray,
                    matchMedia
                })
            });
            return mdQueriesArray;
        }
    }
}

function getHash() {
    if (location.hash) { return location.hash.replace('#', ''); }
}

function setHash(hash) {
    hash = hash ? `#${hash}` : window.location.href.split('#')[0];
    history.pushState('', '', hash);
}

tabs();

function spollers() {
    const spollersArray = document.querySelectorAll('[data-spollers]');
    if (spollersArray.length > 0) {
        // Отримання звичайних слойлерів
        const spollersRegular = Array.from(spollersArray).filter(function (item, index, self) {
            return !item.dataset.spollers.split(",")[0];
        });
        // Ініціалізація звичайних слойлерів
        if (spollersRegular.length) {
            initSpollers(spollersRegular);
        }
        // Отримання слойлерів з медіа-запитами
        let mdQueriesArray = dataMediaQueries(spollersArray, "spollers");
        if (mdQueriesArray && mdQueriesArray.length) {
            mdQueriesArray.forEach(mdQueriesItem => {
                // Подія
                mdQueriesItem.matchMedia.addEventListener("change", function () {
                    initSpollers(mdQueriesItem.itemsArray, mdQueriesItem.matchMedia);
                });
                initSpollers(mdQueriesItem.itemsArray, mdQueriesItem.matchMedia);
            });
        }
        // Ініціалізація
        function initSpollers(spollersArray, matchMedia = false) {
            spollersArray.forEach(spollersBlock => {
                spollersBlock = matchMedia ? spollersBlock.item : spollersBlock;
                if (matchMedia.matches || !matchMedia) {
                    spollersBlock.classList.add('_spoller-init');
                    initSpollerBody(spollersBlock);
                    spollersBlock.addEventListener("click", setSpollerAction);
                } else {
                    spollersBlock.classList.remove('_spoller-init');
                    initSpollerBody(spollersBlock, false);
                    spollersBlock.removeEventListener("click", setSpollerAction);
                }
            });
        }
        // Робота з контентом
        function initSpollerBody(spollersBlock, hideSpollerBody = true) {
            let spollerTitles = spollersBlock.querySelectorAll('[data-spoller]');
            if (spollerTitles.length) {
                spollerTitles = Array.from(spollerTitles).filter(item => item.closest('[data-spollers]') === spollersBlock);
                spollerTitles.forEach(spollerTitle => {
                    if (hideSpollerBody) {
                        spollerTitle.removeAttribute('tabindex');
                        if (!spollerTitle.classList.contains('_spoller-active')) {
                            spollerTitle.nextElementSibling.hidden = true;
                        }
                    } else {
                        spollerTitle.setAttribute('tabindex', '-1');
                        spollerTitle.nextElementSibling.hidden = false;
                    }
                });
            }
        }
        function setSpollerAction(e) {
            const el = e.target;
            if (el.closest('[data-spoller]')) {
                const spollerTitle = el.closest('[data-spoller]');
                const spollersBlock = spollerTitle.closest('[data-spollers]');
                const oneSpoller = spollersBlock.hasAttribute('data-one-spoller');
                const spollerSpeed = spollersBlock.dataset.spollersSpeed ? parseInt(spollersBlock.dataset.spollersSpeed) : 500;
                if (!spollersBlock.querySelectorAll('._slide').length) {
                    if (oneSpoller && !spollerTitle.classList.contains('_spoller-active')) {
                        hideSpollersBody(spollersBlock);
                    }
                    spollerTitle.classList.toggle('_spoller-active');
                    _slideToggle(spollerTitle.nextElementSibling, spollerSpeed);
                }
                e.preventDefault();
            }
        }
        function hideSpollersBody(spollersBlock) {
            const spollerActiveTitle = spollersBlock.querySelector('[data-spoller]._spoller-active');
            const spollerSpeed = spollersBlock.dataset.spollersSpeed ? parseInt(spollersBlock.dataset.spollersSpeed) : 500;
            if (spollerActiveTitle && !spollersBlock.querySelectorAll('._slide').length) {
                spollerActiveTitle.classList.remove('_spoller-active');
                _slideUp(spollerActiveTitle.nextElementSibling, spollerSpeed);
            }
        }
        // Закриття при кліку поза спойлером
        const spollersClose = document.querySelectorAll('[data-spoller-close]');
        if (spollersClose.length) {
            document.addEventListener("click", function (e) {
                const el = e.target;
                if (!el.closest('[data-spollers]')) {
                    spollersClose.forEach(spollerClose => {
                        const spollersBlock = spollerClose.closest('[data-spollers]');
                        if (spollersBlock.classList.contains('_spoller-init')) {
                            const spollerSpeed = spollersBlock.dataset.spollersSpeed ? parseInt(spollersBlock.dataset.spollersSpeed) : 500;
                            spollerClose.classList.remove('_spoller-active');
                            _slideUp(spollerClose.nextElementSibling, spollerSpeed);
                        }
                    });
                }
            });
        }
    }
}

// Унікалізація масиву
function uniqArray(array) {
    return array.filter(function (item, index, self) {
        return self.indexOf(item) === index;
    });
}

// =========================================================================== Forms ===================================================================
// let bodyUnlock = (delay = 500) => {
//     let body = document.querySelector("body");
//     if (bodyLockStatus) {
//         let lock_padding = document.querySelectorAll("[data-lp]");
//         setTimeout(() => {
//             for (let index = 0; index < lock_padding.length; index++) {
//                 const el = lock_padding[index];
//                 el.style.paddingRight = '0px';
//             }
//             body.style.paddingRight = '0px';
//             document.documentElement.classList.remove("lock");
//         }, delay);
//         bodyLockStatus = false;
//         setTimeout(function () {
//             bodyLockStatus = true;
//         }, delay);
//     }
// }

// function menuClose() {
//     bodyUnlock();
//     document.documentElement.classList.remove("menu-open");
// }

let gotoBlock = (targetBlock, noHeader = false, speed = 500, offsetTop = 0) => {
    const targetBlockElement = document.querySelector(targetBlock);
    if (targetBlockElement) {
        let headerItem = '';
        let headerItemHeight = 0;
        if (noHeader) {
            headerItem = 'header.header';
            const headerElement = document.querySelector(headerItem);
            if (!headerElement.classList.contains('_header-scroll')) {
                headerElement.style.cssText = `transition-duration: 0s;`;
                headerElement.classList.add('_header-scroll');
                headerItemHeight = headerElement.offsetHeight;
                headerElement.classList.remove('_header-scroll');
                setTimeout(() => {
                    headerElement.style.cssText = ``;
                }, 0);
            } else {
                headerItemHeight = headerElement.offsetHeight;
            }
        }
        let options = {
            speedAsDuration: true,
            speed: speed,
            header: headerItem,
            offset: offsetTop,
            easing: 'easeOutQuad',
        };
        // Закриваємо меню, якщо воно відкрите
        document.documentElement.classList.contains("menu-open") ? menuClose() : null;

        if (typeof SmoothScroll !== 'undefined') {
            // Прокручування з використанням доповнення
            new SmoothScroll().animateScroll(targetBlockElement, '', options);
        } else {
            // Прокручування стандартними засобами
            let targetBlockElementPosition = targetBlockElement.getBoundingClientRect().top + scrollY;
            targetBlockElementPosition = headerItemHeight ? targetBlockElementPosition - headerItemHeight : targetBlockElementPosition;
            targetBlockElementPosition = offsetTop ? targetBlockElementPosition - offsetTop : targetBlockElementPosition;
            window.scrollTo({
                top: targetBlockElementPosition,
                behavior: "smooth"
            });
        }
        FLS(`[gotoBlock]: Юхуу...їдемо до ${targetBlock}`);
    } else {
        FLS(`[gotoBlock]: Йой... Такого блоку немає на сторінці: ${targetBlock}`);
    }
};

let formValidate = {
    getErrors(form) {
        let error = 0;
        let formRequiredItems = form.querySelectorAll('*[data-required]');
        if (formRequiredItems.length) {
            formRequiredItems.forEach(formRequiredItem => {
                if ((formRequiredItem.offsetParent !== null || formRequiredItem.tagName === "SELECT") && !formRequiredItem.disabled) {
                    error += this.validateInput(formRequiredItem);
                }
            });
        }
        return error;
    },
    validateInput(formRequiredItem) {
        let error = 0;
        if (formRequiredItem.dataset.required === "email") {
            formRequiredItem.value = formRequiredItem.value.replace(" ", "");
            if (this.emailTest(formRequiredItem)) {
                this.addError(formRequiredItem);
                error++;
            } else {
                this.removeError(formRequiredItem);
            }
        } else if (formRequiredItem.type === "checkbox" && !formRequiredItem.checked) {
            this.addError(formRequiredItem);
            error++;
        } else {
            if (!formRequiredItem.value.trim()) {
                this.addError(formRequiredItem);
                error++;
            } else {
                this.removeError(formRequiredItem);
            }
        }
        return error;
    },
    addError(formRequiredItem) {
        formRequiredItem.classList.add('_form-error');
        formRequiredItem.parentElement.classList.add('_form-error');
        let inputError = formRequiredItem.parentElement.querySelector('.form__error');
        if (inputError) formRequiredItem.parentElement.removeChild(inputError);
        if (formRequiredItem.dataset.error) {
            formRequiredItem.parentElement.insertAdjacentHTML('beforeend', `<div class="form__error">${formRequiredItem.dataset.error}</div>`);
        }
    },
    removeError(formRequiredItem) {
        formRequiredItem.classList.remove('_form-error');
        formRequiredItem.parentElement.classList.remove('_form-error');
        if (formRequiredItem.parentElement.querySelector('.form__error')) {
            formRequiredItem.parentElement.removeChild(formRequiredItem.parentElement.querySelector('.form__error'));
        }
    },
    formClean(form) {
        form.reset();
        setTimeout(() => {
            let inputs = form.querySelectorAll('input,textarea');
            for (let index = 0; index < inputs.length; index++) {
                const el = inputs[index];
                el.parentElement.classList.remove('_form-focus');
                el.classList.remove('_form-focus');
                formValidate.removeError(el);
            }
            let checkboxes = form.querySelectorAll('.checkbox__input');
            if (checkboxes.length > 0) {
                for (let index = 0; index < checkboxes.length; index++) {
                    const checkbox = checkboxes[index];
                    checkbox.checked = false;
                }
            }
            if (flsModules.select) {
                let selects = form.querySelectorAll('.select');
                if (selects.length) {
                    for (let index = 0; index < selects.length; index++) {
                        const select = selects[index].querySelector('select');
                        flsModules.select.selectBuild(select);
                    }
                }
            }
        }, 0);
    },
    emailTest(formRequiredItem) {
        return !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,8})+$/.test(formRequiredItem.value);
    }
}

function formFieldsInit(options = { viewPass: false, autoHeight: false }) {
    document.body.addEventListener("focusin", function (e) {
        const targetElement = e.target;
        if ((targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA')) {
            if (!targetElement.hasAttribute('data-no-focus-classes')) {
                targetElement.classList.add('_form-focus');
                targetElement.parentElement.classList.add('_form-focus');
            }
            targetElement.hasAttribute('data-validate') ? formValidate.removeError(targetElement) : null;
        }
    });
    document.body.addEventListener("focusout", function (e) {
        const targetElement = e.target;
        if ((targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA')) {
            if (!targetElement.hasAttribute('data-no-focus-classes')) {
                targetElement.classList.remove('_form-focus');
                targetElement.parentElement.classList.remove('_form-focus');
            }
            // Миттєва валідація
            targetElement.hasAttribute('data-validate') ? formValidate.validateInput(targetElement) : null;
        }
    });
    // Якщо увімкнено, додаємо функціонал "Показати пароль"
    if (options.viewPass) {
        document.addEventListener("click", function (e) {
            let targetElement = e.target;
            if (targetElement.closest('[class*="__viewpass"]')) {
                let inputType = targetElement.classList.contains('_viewpass-active') ? "password" : "text";
                targetElement.parentElement.querySelector('input').setAttribute("type", inputType);
                targetElement.classList.toggle('_viewpass-active');
            }
        });
    }
    // Якщо увімкнено, додаємо функціонал "Автовисота"
    if (options.autoHeight) {
        const textareas = document.querySelectorAll('textarea[data-autoheight]');
        if (textareas.length) {
            textareas.forEach(textarea => {
                const startHeight = textarea.hasAttribute('data-autoheight-min') ?
                    Number(textarea.dataset.autoheightMin) : Number(textarea.offsetHeight);
                const maxHeight = textarea.hasAttribute('data-autoheight-max') ?
                    Number(textarea.dataset.autoheightMax) : Infinity;
                setHeight(textarea, Math.min(startHeight, maxHeight))
                textarea.addEventListener('input', () => {
                    if (textarea.scrollHeight > startHeight) {
                        textarea.style.height = `auto`;
                        setHeight(textarea, Math.min(Math.max(textarea.scrollHeight, startHeight), maxHeight));
                    }
                });
            });
            function setHeight(textarea, height) {
                textarea.style.height = `${height}px`;
            }
        }
    }
}
// Валідація форм

/* Відправлення форм */
function formSubmit() {
    const forms = document.forms;
    if (forms.length) {
        for (const form of forms) {
            form.addEventListener('submit', function (e) {
                const form = e.target;
                formSubmitAction(form, e);
            });
            form.addEventListener('reset', function (e) {
                const form = e.target;
                formValidate.formClean(form);
            });
        }
    }
    async function formSubmitAction(form, e) {
        const error = !form.hasAttribute('data-no-validate') ? formValidate.getErrors(form) : 0;
        if (error === 0) {
            const ajax = form.hasAttribute('data-ajax');
            if (ajax) { // Якщо режим ajax
                e.preventDefault();
                const formAction = form.getAttribute('action') ? form.getAttribute('action').trim() : '#';
                const formMethod = form.getAttribute('method') ? form.getAttribute('method').trim() : 'GET';
                const formData = new FormData(form);

                form.classList.add('_sending');
                const response = await fetch(formAction, {
                    method: formMethod,
                    body: formData
                });
                if (response.ok) {
                    let responseResult = await response.json();
                    form.classList.remove('_sending');
                    formSent(form, responseResult);
                } else {
                    alert("Помилка");
                    form.classList.remove('_sending');
                }
            } else if (form.hasAttribute('data-dev')) {	// Якщо режим розробки
                e.preventDefault();
                formSent(form);
            }
        } else {
            e.preventDefault();
            if (form.querySelector('._form-error') && form.hasAttribute('data-goto-error')) {
                const formGoToErrorClass = form.dataset.gotoError ? form.dataset.gotoError : '._form-error';
                gotoBlock(formGoToErrorClass, true, 1000);
            }
        }
    }
    // Дії після надсилання форми
    function formSent(form, responseResult = ``) {
        // Створюємо подію відправлення форми
        document.dispatchEvent(new CustomEvent("formSent", {
            detail: {
                form: form
            }
        }));
        // Показуємо попап, якщо підключено модуль попапів 
        // та для форми вказано налаштування
        setTimeout(() => {
            if (flsModules.popup) {
                const popup = form.dataset.popupMessage;
                popup ? flsModules.popup.open(popup) : null;
            }
        }, 0);
        // Очищуємо форму
        formValidate.formClean(form);
        // Повідомляємо до консолі
        formLogging(`Форму відправлено!`);
    }
    function formLogging(message) {
        FLS(`[Форми]: ${message}`);
    }
}

// FLS (Full Logging System)
function FLS(message) {
    setTimeout(() => {
        console.log(message);
    }, 0);
}


formFieldsInit({
    viewPass: false,
    autoHeight: false
});

formSubmit();

// ================================================================ Navigation ==========================================================

//let isMobile = { Android: function () { return navigator.userAgent.match(/Android/i); }, BlackBerry: function () { return navigator.userAgent.match(/BlackBerry/i); }, iOS: function () { return navigator.userAgent.match(/iPhone|iPad|iPod/i); }, Opera: function () { return navigator.userAgent.match(/Opera Mini/i); }, Windows: function () { return navigator.userAgent.match(/IEMobile/i); }, any: function () { return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows()); } };

// function uniqArray(array) {
//     return array.filter(function (item, index, self) {
//         return self.indexOf(item) === index;
//     });
// }

class ScrollWatcher {
    constructor(props) {
        let defaultConfig = {
            logging: true,
        }
        this.config = Object.assign(defaultConfig, props);
        this.observer;
        !document.documentElement.classList.contains('watcher') ? this.scrollWatcherRun() : null;
    }
    // Оновлюємо конструктор
    scrollWatcherUpdate() {
        this.scrollWatcherRun();
    }
    // Запускаємо конструктор
    scrollWatcherRun() {
        document.documentElement.classList.add('watcher');
        this.scrollWatcherConstructor(document.querySelectorAll('[data-watch]'));
    }
    // Конструктор спостерігачів
    scrollWatcherConstructor(items) {
        if (items.length) {
            this.scrollWatcherLogging(`Прокинувся, стежу за об'єктами (${items.length})...`);
            // Унікалізуємо параметри
            let uniqParams = uniqArray(Array.from(items).map(function (item) {
                return `${item.dataset.watchRoot ? item.dataset.watchRoot : null}|${item.dataset.watchMargin ? item.dataset.watchMargin : '0px'}|${item.dataset.watchThreshold ? item.dataset.watchThreshold : 0}`;
            }));
            // Отримуємо групи об'єктів з однаковими параметрами,
            // створюємо налаштування, ініціалізуємо спостерігач
            uniqParams.forEach(uniqParam => {
                let uniqParamArray = uniqParam.split('|');
                let paramsWatch = {
                    root: uniqParamArray[0],
                    margin: uniqParamArray[1],
                    threshold: uniqParamArray[2]
                }
                let groupItems = Array.from(items).filter(function (item) {
                    let watchRoot = item.dataset.watchRoot ? item.dataset.watchRoot : null;
                    let watchMargin = item.dataset.watchMargin ? item.dataset.watchMargin : '0px';
                    let watchThreshold = item.dataset.watchThreshold ? item.dataset.watchThreshold : 0;
                    if (
                        String(watchRoot) === paramsWatch.root &&
                        String(watchMargin) === paramsWatch.margin &&
                        String(watchThreshold) === paramsWatch.threshold
                    ) {
                        return item;
                    }
                });

                let configWatcher = this.getScrollWatcherConfig(paramsWatch);

                // Ініціалізація спостерігача зі своїми налаштуваннями
                this.scrollWatcherInit(groupItems, configWatcher);
            });
        } else {
            this.scrollWatcherLogging("Сплю, немає об'єктів для стеження. ZzzZZzz");
        }
    }
    // Функція створення налаштувань
    getScrollWatcherConfig(paramsWatch) {
        //Створюємо налаштування
        let configWatcher = {}
        // Батько, у якому ведеться спостереження
        if (document.querySelector(paramsWatch.root)) {
            configWatcher.root = document.querySelector(paramsWatch.root);
        } else if (paramsWatch.root !== 'null') {
            this.scrollWatcherLogging(`Эмм... батьківського об'єкта ${paramsWatch.root} немає на сторінці`);
        }
        // Відступ спрацьовування
        configWatcher.rootMargin = paramsWatch.margin;
        if (paramsWatch.margin.indexOf('px') < 0 && paramsWatch.margin.indexOf('%') < 0) {
            this.scrollWatcherLogging(`йой, налаштування data-watch-margin потрібно задавати в PX або %`);
            return
        }
        // Точки спрацьовування
        if (paramsWatch.threshold === 'prx') {
            // Режим паралаксу
            paramsWatch.threshold = [];
            for (let i = 0; i <= 1.0; i += 0.005) {
                paramsWatch.threshold.push(i);
            }
        } else {
            paramsWatch.threshold = paramsWatch.threshold.split(',');
        }
        configWatcher.threshold = paramsWatch.threshold;

        return configWatcher;
    }
    // Функція створення нового спостерігача зі своїми налаштуваннями
    scrollWatcherCreate(configWatcher) {
        this.observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                this.scrollWatcherCallback(entry, observer);
            });
        }, configWatcher);
    }
    // Функція ініціалізації спостерігача зі своїми налаштуваннями
    scrollWatcherInit(items, configWatcher) {
        // Створення нового спостерігача зі своїми налаштуваннями
        this.scrollWatcherCreate(configWatcher);
        // Передача спостерігачеві елементів
        items.forEach(item => this.observer.observe(item));
    }
    // Функція обробки базових дій точок спрацьовування
    scrollWatcherIntersecting(entry, targetElement) {
        if (entry.isIntersecting) {
            // Бачимо об'єкт
            // Додаємо клас
            !targetElement.classList.contains('_watcher-view') ? targetElement.classList.add('_watcher-view') : null;
            this.scrollWatcherLogging(`Я бачу ${targetElement.classList}, додав клас _watcher-view`);
        } else {
            // Не бачимо об'єкт
            // Забираємо клас
            targetElement.classList.contains('_watcher-view') ? targetElement.classList.remove('_watcher-view') : null;
            this.scrollWatcherLogging(`Я не бачу ${targetElement.classList}, прибрав клас _watcher-view`);
        }
    }
    // Функція відключення стеження за об'єктом
    scrollWatcherOff(targetElement, observer) {
        observer.unobserve(targetElement);
        this.scrollWatcherLogging(`Я перестав стежити за ${targetElement.classList}`);
    }
    // Функція виведення в консоль
    scrollWatcherLogging(message) {
        this.config.logging ? FLS(`[Спостерігач]: ${message}`) : null;
    }
    // Функція обробки спостереження
    scrollWatcherCallback(entry, observer) {
        const targetElement = entry.target;
        // Обробка базових дій точок спрацьовування
        this.scrollWatcherIntersecting(entry, targetElement);
        // Якщо є атрибут data-watch-once прибираємо стеження
        targetElement.hasAttribute('data-watch-once') && entry.isIntersecting ? this.scrollWatcherOff(targetElement, observer) : null;
        // Створюємо свою подію зворотного зв'язку
        document.dispatchEvent(new CustomEvent("watcherCallback", {
            detail: {
                entry: entry
            }
        }));

        /*
        // Вибираємо потрібні об'єкти
        if (targetElement.dataset.watch === 'some value') {
            // пишемо унікальну специфіку
        }
        if (entry.isIntersecting) {
            //Бачимо об'єкт
        } else {
            //Не бачимо об'єкт
        }
        */
    }
}

// function getHash() {
//     if (location.hash) { return location.hash.replace('#', ''); }
// }

// Плавна навігація по сторінці
function pageNavigation() {
    // data-goto - вказати ID блоку
    // data-goto-header - враховувати header
    // data-goto-top - недокрутити на вказаний розмір
    // data-goto-speed - швидкість (тільки якщо використовується додатковий плагін)
    // Працюємо при натисканні на пункт
    document.addEventListener("click", pageNavigationAction);
    // Якщо підключено scrollWatcher, підсвічуємо поточний пункт меню
    document.addEventListener("watcherCallback", pageNavigationAction);
    // Основна функція
    function pageNavigationAction(e) {
        if (e.type === "click") {
            const targetElement = e.target;
            if (targetElement.closest('[data-goto]')) {
                const gotoLink = targetElement.closest('[data-goto]');
                const gotoLinkSelector = gotoLink.dataset.goto ? gotoLink.dataset.goto : '';
                const noHeader = gotoLink.hasAttribute('data-goto-header') ? true : false;
                const gotoSpeed = gotoLink.dataset.gotoSpeed ? gotoLink.dataset.gotoSpeed : 500;
                const offsetTop = gotoLink.dataset.gotoTop ? parseInt(gotoLink.dataset.gotoTop) : 0;
                if (flsModules.fullpage) {
                    const fullpageSection = document.querySelector(`${gotoLinkSelector}`).closest('[data-fp-section]');
                    const fullpageSectionId = fullpageSection ? +fullpageSection.dataset.fpId : null;
                    if (fullpageSectionId !== null) {
                        flsModules.fullpage.switchingSection(fullpageSectionId);
                        document.documentElement.classList.contains("menu-open") ? menuClose() : null;
                    }
                } else {
                    gotoBlock(gotoLinkSelector, noHeader, gotoSpeed, offsetTop);
                }
                e.preventDefault();
            }
        } else if (e.type === "watcherCallback" && e.detail) {
            const entry = e.detail.entry;
            const targetElement = entry.target;
            // Обробка пунктів навігації, якщо вказано значення navigator, підсвічуємо поточний пункт меню
            if (targetElement.dataset.watch === 'navigator') {
                const navigatorActiveItem = document.querySelector(`[data-goto]._navigator-active`);
                let navigatorCurrentItem;
                if (targetElement.id && document.querySelector(`[data-goto="#${targetElement.id}"]`)) {
                    navigatorCurrentItem = document.querySelector(`[data-goto="#${targetElement.id}"]`);
                } else if (targetElement.classList.length) {
                    for (let index = 0; index < targetElement.classList.length; index++) {
                        const element = targetElement.classList[index];
                        if (document.querySelector(`[data-goto=".${element}"]`)) {
                            navigatorCurrentItem = document.querySelector(`[data-goto=".${element}"]`);
                            break;
                        }
                    }
                }
                if (entry.isIntersecting) {
                    // Бачимо об'єкт
                    // navigatorActiveItem ? navigatorActiveItem.classList.remove('_navigator-active') : null;
                    navigatorCurrentItem ? navigatorCurrentItem.classList.add('_navigator-active') : null;
                } else {
                    // Не бачимо об'єкт
                    navigatorCurrentItem ? navigatorCurrentItem.classList.remove('_navigator-active') : null;
                }
            }
        }
    }
    // Прокручування по хешу
    if (getHash()) {
        let goToHash;
        if (document.querySelector(`#${getHash()}`)) {
            goToHash = `#${getHash()}`;
        } else if (document.querySelector(`.${getHash()}`)) {
            goToHash = `.${getHash()}`;
        }
        goToHash ? gotoBlock(goToHash, true, 500, 20) : null;
    }
}

flsModules.watcher = new ScrollWatcher({});
pageNavigation();