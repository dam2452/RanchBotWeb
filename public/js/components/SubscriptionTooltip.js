// public/js/components/SubscriptionTooltip.js

/**
 * Component for handling user subscription tooltip
 * Manages fetching subscription data and displaying/hiding the tooltip
 */

import { callApi } from '../modules/api-client.js';

class SubscriptionTooltip {
    constructor() {
        this.welcomeLink = document.getElementById('user-welcome-link');
        this.tooltip = document.getElementById('subscription-tooltip');
        this.isTooltipVisible = false;
        this.isLoading = false;

        this.init();
    }

    init() {
        // Check if elements exist (user is logged in)
        if (!this.welcomeLink || !this.tooltip) {
            return;
        }

        // Handle welcome link click
        this.welcomeLink.addEventListener('click', this.handleClick.bind(this));

        // Hide tooltip when clicking outside
        document.addEventListener('click', this.handleOutsideClick.bind(this));
    }

    async handleClick(e) {
        e.stopPropagation();

        if (this.isLoading) return;

        if (this.isTooltipVisible) {
            // Hide tooltip if visible
            this.hideTooltip();
        } else {
            // Show tooltip and load data
            await this.showTooltip();
        }
    }

    hideTooltip() {
        this.tooltip.classList.remove('visible');
        this.isTooltipVisible = false;
    }

    async showTooltip() {
        this.isLoading = true;
        this.tooltip.innerHTML = '<div class="spinner"></div> Sprawdzanie subskrypcji...';
        this.tooltip.classList.add('visible');
        this.isTooltipVisible = true;

        try {
            // Get subscription data using callApi instead of fetchApi
            const response = await callApi('sub', []);

            if (response && response.status === 'success' && response.data) {
                this.updateTooltipContent(response.data);
            } else {
                const errorMsg = response?.message || 'Nie udało się pobrać danych subskrypcji.';
                this.tooltip.innerHTML = `<div class="error">Błąd: ${errorMsg}</div>`;
            }
        } catch (error) {
            console.error("Błąd podczas pobierania danych subskrypcji:", error);
            this.tooltip.innerHTML = `<div class="error">Błąd: ${error.message}</div>`;
        } finally {
            this.isLoading = false;
        }
    }

    updateTooltipContent(data) {
        const endDate = data.subscription_end || 'Brak danych';
        const daysLeft = data.days_remaining;
        let daysText = 'Nieznana';
        let daysClass = '';

        // Format days text
        if (typeof daysLeft === 'number' && !isNaN(daysLeft)) {
            if (daysLeft > 1) {
                daysText = `Kończy się za ${daysLeft} dni`;
                daysClass = daysLeft <= 7 ? 'expiring' : '';
            } else if (daysLeft === 1) {
                daysText = `Kończy się jutro`;
                daysClass = 'expiring';
            } else if (daysLeft === 0) {
                daysText = 'Kończy się dzisiaj';
                daysClass = 'expiring';
            } else {
                daysText = `Wygasła ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? 'dzień' : 'dni'} temu`;
                daysClass = 'expired';
            }
        } else {
            daysText = '(Brak informacji o pozostałych dniach)';
        }

        // Format date
        let formattedEndDate = endDate;
        try {
            const dateObj = new Date(endDate);
            if (!isNaN(dateObj.getTime())) {
                formattedEndDate = dateObj.toLocaleDateString('pl-PL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }
        } catch (dateError) {
            console.warn("Nie można sformatować daty:", endDate);
        }

        // Update tooltip content
        this.tooltip.innerHTML = `
            <div>Subskrypcja aktywna do: <strong>${formattedEndDate}</strong></div>
            <div class="days-remaining ${daysClass}">${daysText}</div>
        `;
    }

    handleOutsideClick(e) {
        if (this.isTooltipVisible && !this.tooltip.contains(e.target) && e.target !== this.welcomeLink) {
            this.hideTooltip();
        }
    }
}

/**
 * Initialize subscription tooltip
 * @returns {SubscriptionTooltip} New tooltip instance
 */
export function initSubscriptionTooltip() {
    return new SubscriptionTooltip();
}

// Initialize tooltip when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initSubscriptionTooltip();
});

// Export default and named class
export { SubscriptionTooltip };
export default SubscriptionTooltip;