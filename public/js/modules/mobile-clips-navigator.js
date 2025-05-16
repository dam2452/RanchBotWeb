
export class MobileClipsNavigator {
    #container;
    #pages;
    #currentPage = 0;
    #isScrolling = false;
    #pageIndicator;
    #dots = [];
    #videoManager;
    #navButtons;

    constructor({ container, videoManager }) {
        this.#container = container;
        this.#pages = Array.from(container.querySelectorAll('.clips-page'));
        this.#videoManager = videoManager;

        if (this.#pages.length > 0) {
            this.#formatMobilePages();
            this.#createPageIndicator();
            this.#createNavigationButtons();
            this.#attachEvents();
            this.scrollToPage(0);
        }
    }

    #formatMobilePages() {
        const clipsPerPage = 3;
        const allClips = [];

        this.#pages.forEach(page => {
            const clips = Array.from(page.querySelectorAll('.clip-card'));
            allClips.push(...clips);
            page.innerHTML = '';
        });

        this.#pages.forEach(page => page.remove());
        this.#pages = [];

        for (let i = 0; i < allClips.length; i += clipsPerPage) {
            const newPage = document.createElement('div');
            newPage.className = 'clips-page';
            newPage.style.display = 'none';

            const pageClips = allClips.slice(i, i + clipsPerPage);
            pageClips.forEach(clip => newPage.appendChild(clip));

            this.#container.appendChild(newPage);
            this.#pages.push(newPage);
        }
    }

    #createPageIndicator() {
        if (document.querySelector('.mobile-page-indicator')) {
            document.querySelector('.mobile-page-indicator').remove();
        }

        this.#pageIndicator = document.createElement('div');
        this.#pageIndicator.className = 'mobile-page-indicator';

        for (let i = 0; i < this.#pages.length; i++) {
            const dot = document.createElement('div');
            dot.className = 'page-dot';
            if (i === 0) dot.classList.add('active');

            dot.addEventListener('click', () => this.scrollToPage(i));

            this.#pageIndicator.appendChild(dot);
            this.#dots.push(dot);
        }

        document.body.appendChild(this.#pageIndicator);
    }

    #createNavigationButtons() {
        if (document.querySelector('.mobile-nav-buttons')) {
            document.querySelector('.mobile-nav-buttons').remove();
        }

        this.#navButtons = document.createElement('div');
        this.#navButtons.className = 'mobile-nav-buttons';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'nav-button prev-button';
        prevBtn.innerHTML = '&larr;';
        prevBtn.addEventListener('click', () => this.navigate(-1));

        const nextBtn = document.createElement('button');
        nextBtn.className = 'nav-button next-button';
        nextBtn.innerHTML = '&rarr;';
        nextBtn.addEventListener('click', () => this.navigate(1));

        this.#navButtons.appendChild(prevBtn);
        this.#navButtons.appendChild(nextBtn);

        document.body.appendChild(this.#navButtons);
    }

    #attachEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.navigate(-1);
                e.preventDefault();
            } else if (e.key === 'ArrowRight') {
                this.navigate(1);
                e.preventDefault();
            } else if (e.key === 'ArrowUp') {
                this.navigate(-1);
                e.preventDefault();
            } else if (e.key === 'ArrowDown') {
                this.navigate(1);
                e.preventDefault();
            }
        });

        this.#container.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (this.#isScrolling) return;

            const delta = e.deltaY;
            if (Math.abs(delta) < 20) return;

            const direction = delta > 0 ? 1 : -1;
            this.navigate(direction);
        }, { passive: false });

        let startX = 0;
        let startY = 0;

        this.#container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        this.#container.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        this.#container.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = startX - endX;
            const diffY = startY - endY;

            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (Math.abs(diffX) > 50) {
                    const direction = diffX > 0 ? 1 : -1;
                    this.navigate(direction);
                }
            } else {
                if (Math.abs(diffY) > 50) {
                    const direction = diffY > 0 ? 1 : -1;
                    this.navigate(direction);
                }
            }
        }, { passive: true });

        this.#container.addEventListener('click', (e) => {
            if (!e.target.closest('.clip-card') &&
                !e.target.closest('.delete-clip-btn') &&
                !e.target.closest('.download-btn')) {

                const rect = this.#container.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                if (x > rect.width / 2 || y > rect.height / 2) {
                    this.navigate(1);
                } else {
                    this.navigate(-1);
                }
            }
        });
    }

    navigate(direction) {
        if (this.#isScrolling) return;

        const newPage = this.#currentPage + direction;
        if (newPage < 0 || newPage >= this.#pages.length) return;

        this.scrollToPage(newPage);
    }

    scrollToPage(index) {
        if (index < 0 || index >= this.#pages.length || this.#isScrolling) return;

        this.#isScrolling = true;
        this.#currentPage = index;

        if (this.#videoManager) {
            this.#videoManager.stopAll();
        }

        this.#pages.forEach((page, i) => {
            page.style.display = 'none';
            page.style.opacity = '0';
            page.style.transition = 'opacity 0.3s ease';
        });

        const currentPage = this.#pages[index];
        currentPage.style.display = 'flex';

        setTimeout(() => {
            currentPage.style.opacity = '1';
        }, 50);

        this.#dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });

        const prevBtn = document.querySelector('.prev-button');
        const nextBtn = document.querySelector('.next-button');

        if (prevBtn) prevBtn.disabled = index === 0;
        if (nextBtn) nextBtn.disabled = index === this.#pages.length - 1;

        setTimeout(() => {
            this.#isScrolling = false;
        }, 300);
    }
}