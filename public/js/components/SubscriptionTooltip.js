import { callApi } from '../modules/api-client.js';

export class SubscriptionTooltip {
    #welcomeLink;
    #tooltip;
    #isTooltipVisible = false;
    #isLoading = false;

    constructor() {
        this.#welcomeLink = document.getElementById('user-welcome-link');
        this.#tooltip = document.getElementById('subscription-tooltip');

        this.#initialize();
    }

    get isVisible() {
        return this.#isTooltipVisible;
    }

    get isLoading() {
        return this.#isLoading;
    }

    hideTooltip() {
        this.#tooltip.classList.remove('visible');
        this.#isTooltipVisible = false;
    }

    async showTooltip() {
        this.#isLoading = true;
        this.#showLoadingState();

        try {
            const response = await callApi('sub', []);
            this.#processResponse(response);
        } catch (error) {
            this.#handleError(error);
        } finally {
            this.#isLoading = false;
        }
    }

    #initialize() {
        if (!this.#welcomeLink || !this.#tooltip) {
            return;
        }

        this.#attachEventListeners();
    }

    #attachEventListeners() {
        this.#welcomeLink.addEventListener('click', this.#handleClick.bind(this));
        document.addEventListener('click', this.#handleOutsideClick.bind(this));
    }

    async #handleClick(e) {
        e.stopPropagation();

        if (this.#isLoading) return;

        if (this.#isTooltipVisible) {
            this.hideTooltip();
        } else {
            await this.showTooltip();
        }
    }

    #handleOutsideClick(e) {
        if (this.#isTooltipVisible && !this.#tooltip.contains(e.target) && e.target !== this.#welcomeLink) {
            this.hideTooltip();
        }
    }

    #showLoadingState() {
        this.#tooltip.innerHTML = '<div class="spinner"></div> Checking subscription...';
        this.#tooltip.classList.add('visible');
        this.#isTooltipVisible = true;
    }

    #processResponse(response) {
        if (response && response.status === 'success' && response.data) {
            this.#updateTooltipContent(response.data);
        } else {
            const errorMsg = response?.message || 'Failed to fetch subscription data.';
            this.#showError(errorMsg);
        }
    }

    #handleError(error) {
        console.error("Error fetching subscription data:", error);
        this.#showError(error.message);
    }

    #showError(message) {
        this.#tooltip.innerHTML = `<div class="error">Error: ${message}</div>`;
    }

    #updateTooltipContent(data) {
        const endDate = data.subscription_end || 'No data';
        const daysLeft = data.days_remaining;

        const { daysText, daysClass } = this.#formatDaysRemaining(daysLeft);
        const formattedEndDate = this.#formatEndDate(endDate);

        this.#tooltip.innerHTML = `
            <div>Subscription active until: <strong>${formattedEndDate}</strong></div>
            <div class="days-remaining ${daysClass}">${daysText}</div>
        `;
    }

    #formatDaysRemaining(daysLeft) {
        let daysText = 'Unknown';
        let daysClass = '';

        if (typeof daysLeft === 'number' && !isNaN(daysLeft)) {
            if (daysLeft > 1) {
                daysText = `Ends in ${daysLeft} days`;
                daysClass = daysLeft <= 7 ? 'expiring' : '';
            } else if (daysLeft === 1) {
                daysText = `Ends tomorrow`;
                daysClass = 'expiring';
            } else if (daysLeft === 0) {
                daysText = 'Ends today';
                daysClass = 'expiring';
            } else {
                daysText = `Expired ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? 'day' : 'days'} ago`;
                daysClass = 'expired';
            }
        } else {
            daysText = '(No information about remaining days)';
        }

        return { daysText, daysClass };
    }

    #formatEndDate(endDate) {
        let formattedEndDate = endDate;
        try {
            const dateObj = new Date(endDate);
            if (!isNaN(dateObj.getTime())) {
                formattedEndDate = dateObj.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }
        } catch (dateError) {
            console.warn("Unable to format date:", endDate);
        }
        return formattedEndDate;
    }
}

export function initSubscriptionTooltip() {
    return new SubscriptionTooltip();
}

document.addEventListener('DOMContentLoaded', () => {
    initSubscriptionTooltip();
});

export default SubscriptionTooltip;