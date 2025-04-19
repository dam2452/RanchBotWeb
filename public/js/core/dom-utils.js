export function isMobile() {
    return window.matchMedia('(max-width:850px)').matches;
}

export function centerItem(container, item) {
    const rect = container.getBoundingClientRect();
    const offset = isMobile()
        ? item.offsetTop - (rect.height - item.offsetHeight) / 2
        : item.offsetLeft - (rect.width - item.offsetWidth) / 2;
    container.scrollTo({
        top: isMobile() ? offset : 0,
        left: isMobile() ? 0 : offset,
        behavior: 'smooth'
    });
}
