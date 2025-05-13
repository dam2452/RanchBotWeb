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
        if (!this.welcomeLink || !this.tooltip) {
            return;
        }

        this.welcomeLink.addEventListener('click', this.handleClick.bind(this));

        document.addEventListener('click', this.handleOutsideClick.bind(this));
    }

    async handleClick(e) {
        e.stopPropagation();

        if (this.isLoading) return;

        if (this.isTooltipVisible) {
            this.hideTooltip();
        } else {
            await this.showTooltip();
        }
    }

    hideTooltip() {
        this.tooltip.classList.remove('visible');
        this.isTooltipVisible = false;
    }

    async showTooltip() {
        this.isLoading = true;
        this.tooltip.innerHTML = '<div class="spinner"></div> Checking subscription...';
        this.tooltip.classList.add('visible');
        this.isTooltipVisible = true;

        try {
            const response = await callApi('sub', []);

            if (response && response.status === 'success' && response.data) {
                this.updateTooltipContent(response.data);
            } else {
                const errorMsg = response?.message || 'Failed to fetch subscription data.';
                this.tooltip.innerHTML = `<div class="error">Error: ${errorMsg}</div>`;
            }
        } catch (error) {
            console.error("Error fetching subscription data:", error);
            this.tooltip.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        } finally {
            this.isLoading = false;
        }
    }

    updateTooltipContent(data) {
        const endDate = data.subscription_end || 'No data';
        const daysLeft = data.days_remaining;
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

        this.tooltip.innerHTML = `
            <div>Subscription active until: <strong>${formattedEndDate}</strong></div>
            <div class="days-remaining ${daysClass}">${daysText}</div>
        `;
    }

    handleOutsideClick(e) {
        if (this.isTooltipVisible && !this.tooltip.contains(e.target) && e.target !== this.welcomeLink) {
            this.hideTooltip();
        }
    }
}

export function initSubscriptionTooltip() {
    return new SubscriptionTooltip();
}

document.addEventListener('DOMContentLoaded', () => {
    initSubscriptionTooltip();
});

export { SubscriptionTooltip };
export default SubscriptionTooltip;
