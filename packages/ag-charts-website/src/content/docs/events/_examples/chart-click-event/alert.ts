// Less obtrusive alert using HTML Popover API.
(() => {
    const noOp = () => {};
    let removePopover = noOp;
    window.alert = (msg) => {
        removePopover();
        const popover = document.createElement('div');
        popover.popover = 'manual';
        popover.innerText = msg;
        document.body.appendChild(popover);
        popover.showPopover();

        const timeout = setTimeout(() => {
            popover.remove();
            removePopover = noOp;
        }, 2000);

        removePopover = () => {
            clearTimeout(timeout);
            popover.remove?.();
        };
    };
})();
