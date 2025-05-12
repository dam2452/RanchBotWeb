export function isMobile() {
    return window.matchMedia('(max-width:850px)').matches;
}

export function centerItem(container, item) {
    if (!item || !container) return;

    const rect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();

    const offset = isMobile()
        ? item.offsetTop - container.offsetTop - (rect.height - itemRect.height) / 2
        : item.offsetLeft - container.offsetLeft - (rect.width - itemRect.width) / 2;

    container.scrollTo({
        top: isMobile() ? offset : 0,
        left: isMobile() ? 0 : offset,
        behavior: 'smooth'
    });
}