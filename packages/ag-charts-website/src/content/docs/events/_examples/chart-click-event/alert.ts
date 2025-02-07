// Less obtrusive alert using HTML Popover API.
let currentPopover;
window.alert = (msg) => {
    if (currentPopover) {
        clearTimeout(currentPopover[0]);
        currentPopover[1]?.remove?.();
    }
    const popover = document.createElement('div');
    popover.popover = 'manual';
    popover.innerText = msg;
    document.body.appendChild(popover);
    popover.showPopover();
    const timeout = setTimeout(() => {
        popover.remove();
        currentPopover = undefined;
    }, 2000);
    currentPopover = [timeout, popover];
};
