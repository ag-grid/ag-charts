"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    toKebabCase: function() {
        return toKebabCase;
    },
    toTitleCase: function() {
        return toTitleCase;
    }
});
function toTitleCase(value) {
    const camelCased = value.replace(/-([a-z])/g, (g)=>g[1].toUpperCase());
    return camelCased[0].toUpperCase() + camelCased.slice(1);
}
const toKebabCase = (value)=>value.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvc3RyaW5nLXV0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBmdW5jdGlvbiB0b1RpdGxlQ2FzZSh2YWx1ZSkge1xuICAgIGNvbnN0IGNhbWVsQ2FzZWQgPSB2YWx1ZS5yZXBsYWNlKC8tKFthLXpdKS9nLCAoZykgPT4gZ1sxXS50b1VwcGVyQ2FzZSgpKTtcbiAgICByZXR1cm4gY2FtZWxDYXNlZFswXS50b1VwcGVyQ2FzZSgpICsgY2FtZWxDYXNlZC5zbGljZSgxKTtcbn1cblxuZXhwb3J0IGNvbnN0IHRvS2ViYWJDYXNlID0gKHZhbHVlOiBzdHJpbmcpID0+IHZhbHVlLnJlcGxhY2UoLyhbYS16XSkoW0EtWjAtOV0pL2csICckMS0kMicpLnRvTG93ZXJDYXNlKCk7XG4iXSwibmFtZXMiOlsidG9LZWJhYkNhc2UiLCJ0b1RpdGxlQ2FzZSIsInZhbHVlIiwiY2FtZWxDYXNlZCIsInJlcGxhY2UiLCJnIiwidG9VcHBlckNhc2UiLCJzbGljZSIsInRvTG93ZXJDYXNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQUthQSxXQUFXO2VBQVhBOztJQUxHQyxXQUFXO2VBQVhBOzs7QUFBVCxTQUFTQSxZQUFZQyxLQUFLO0lBQzdCLE1BQU1DLGFBQWFELE1BQU1FLE9BQU8sQ0FBQyxhQUFhLENBQUNDLElBQU1BLENBQUMsQ0FBQyxFQUFFLENBQUNDLFdBQVc7SUFDckUsT0FBT0gsVUFBVSxDQUFDLEVBQUUsQ0FBQ0csV0FBVyxLQUFLSCxXQUFXSSxLQUFLLENBQUM7QUFDMUQ7QUFFTyxNQUFNUCxjQUFjLENBQUNFLFFBQWtCQSxNQUFNRSxPQUFPLENBQUMsc0JBQXNCLFNBQVNJLFdBQVcifQ==