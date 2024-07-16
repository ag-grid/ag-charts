"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "patchOptions", {
    enumerable: true,
    get: function() {
        return patchOptions;
    }
});
function patchOptions(options, theme) {
    delete options.subtitle;
    delete options.footnote;
    delete options.legend;
    delete options.gradientLegend;
    options.legend = {
        enabled: false
    };
    const optionsTheme = typeof options.theme === 'object' ? options.theme : null;
    options.theme = {
        ...optionsTheme,
        baseTheme: theme ?? 'ag-default',
        overrides: {
            ...optionsTheme?.overrides,
            common: {
                ...optionsTheme?.overrides?.common,
                axes: {
                    ...optionsTheme?.overrides?.common?.axes,
                    category: {
                        ...optionsTheme?.overrides?.common?.axes?.category,
                        label: {
                            ...optionsTheme?.overrides?.common?.axes?.category?.label,
                            autoRotate: false,
                            minSpacing: 20
                        }
                    }
                }
            }
        }
    };
    options.axes?.forEach((axis)=>{
        axis.title = {
            enabled: false
        };
    });
    options.padding = {
        top: 10,
        right: 20,
        bottom: 10,
        left: 20
    };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3BhdGNoT3B0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEFnQ2FydGVzaWFuQ2hhcnRPcHRpb25zLCBBZ0NoYXJ0T3B0aW9ucywgQWdDaGFydFRoZW1lLCBBZ0NoYXJ0VGhlbWVOYW1lIH0gZnJvbSAnYWctY2hhcnRzLWNvbW11bml0eSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXRjaE9wdGlvbnMob3B0aW9uczogQWdDaGFydE9wdGlvbnMsIHRoZW1lOiBBZ0NoYXJ0VGhlbWVOYW1lKSB7XG4gICAgZGVsZXRlIG9wdGlvbnMuc3VidGl0bGU7XG4gICAgZGVsZXRlIG9wdGlvbnMuZm9vdG5vdGU7XG4gICAgZGVsZXRlIG9wdGlvbnMubGVnZW5kO1xuICAgIGRlbGV0ZSBvcHRpb25zLmdyYWRpZW50TGVnZW5kO1xuXG4gICAgb3B0aW9ucy5sZWdlbmQgPSB7IGVuYWJsZWQ6IGZhbHNlIH07XG5cbiAgICBjb25zdCBvcHRpb25zVGhlbWUgPSB0eXBlb2Ygb3B0aW9ucy50aGVtZSA9PT0gJ29iamVjdCcgPyBvcHRpb25zLnRoZW1lIDogbnVsbDtcbiAgICBvcHRpb25zLnRoZW1lID0ge1xuICAgICAgICAuLi5vcHRpb25zVGhlbWUsXG4gICAgICAgIGJhc2VUaGVtZTogdGhlbWUgPz8gJ2FnLWRlZmF1bHQnLFxuICAgICAgICBvdmVycmlkZXM6IHtcbiAgICAgICAgICAgIC4uLm9wdGlvbnNUaGVtZT8ub3ZlcnJpZGVzLFxuICAgICAgICAgICAgY29tbW9uOiB7XG4gICAgICAgICAgICAgICAgLi4ub3B0aW9uc1RoZW1lPy5vdmVycmlkZXM/LmNvbW1vbixcbiAgICAgICAgICAgICAgICBheGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIC4uLm9wdGlvbnNUaGVtZT8ub3ZlcnJpZGVzPy5jb21tb24/LmF4ZXMsXG4gICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5vcHRpb25zVGhlbWU/Lm92ZXJyaWRlcz8uY29tbW9uPy5heGVzPy5jYXRlZ29yeSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4ub3B0aW9uc1RoZW1lPy5vdmVycmlkZXM/LmNvbW1vbj8uYXhlcz8uY2F0ZWdvcnk/LmxhYmVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9Sb3RhdGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pblNwYWNpbmc6IDIwLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9IGFzIEFnQ2hhcnRUaGVtZTtcblxuICAgIChvcHRpb25zIGFzIGFueSBhcyBBZ0NhcnRlc2lhbkNoYXJ0T3B0aW9ucykuYXhlcz8uZm9yRWFjaCgoYXhpcykgPT4ge1xuICAgICAgICBheGlzLnRpdGxlID0geyBlbmFibGVkOiBmYWxzZSB9O1xuICAgIH0pO1xuXG4gICAgb3B0aW9ucy5wYWRkaW5nID0ge1xuICAgICAgICB0b3A6IDEwLFxuICAgICAgICByaWdodDogMjAsXG4gICAgICAgIGJvdHRvbTogMTAsXG4gICAgICAgIGxlZnQ6IDIwLFxuICAgIH07XG59XG4iXSwibmFtZXMiOlsicGF0Y2hPcHRpb25zIiwib3B0aW9ucyIsInRoZW1lIiwic3VidGl0bGUiLCJmb290bm90ZSIsImxlZ2VuZCIsImdyYWRpZW50TGVnZW5kIiwiZW5hYmxlZCIsIm9wdGlvbnNUaGVtZSIsImJhc2VUaGVtZSIsIm92ZXJyaWRlcyIsImNvbW1vbiIsImF4ZXMiLCJjYXRlZ29yeSIsImxhYmVsIiwiYXV0b1JvdGF0ZSIsIm1pblNwYWNpbmciLCJmb3JFYWNoIiwiYXhpcyIsInRpdGxlIiwicGFkZGluZyIsInRvcCIsInJpZ2h0IiwiYm90dG9tIiwibGVmdCJdLCJtYXBwaW5ncyI6Ijs7OzsrQkFFZ0JBOzs7ZUFBQUE7OztBQUFULFNBQVNBLGFBQWFDLE9BQXVCLEVBQUVDLEtBQXVCO0lBQ3pFLE9BQU9ELFFBQVFFLFFBQVE7SUFDdkIsT0FBT0YsUUFBUUcsUUFBUTtJQUN2QixPQUFPSCxRQUFRSSxNQUFNO0lBQ3JCLE9BQU9KLFFBQVFLLGNBQWM7SUFFN0JMLFFBQVFJLE1BQU0sR0FBRztRQUFFRSxTQUFTO0lBQU07SUFFbEMsTUFBTUMsZUFBZSxPQUFPUCxRQUFRQyxLQUFLLEtBQUssV0FBV0QsUUFBUUMsS0FBSyxHQUFHO0lBQ3pFRCxRQUFRQyxLQUFLLEdBQUc7UUFDWixHQUFHTSxZQUFZO1FBQ2ZDLFdBQVdQLFNBQVM7UUFDcEJRLFdBQVc7WUFDUCxHQUFHRixjQUFjRSxTQUFTO1lBQzFCQyxRQUFRO2dCQUNKLEdBQUdILGNBQWNFLFdBQVdDLE1BQU07Z0JBQ2xDQyxNQUFNO29CQUNGLEdBQUdKLGNBQWNFLFdBQVdDLFFBQVFDLElBQUk7b0JBQ3hDQyxVQUFVO3dCQUNOLEdBQUdMLGNBQWNFLFdBQVdDLFFBQVFDLE1BQU1DLFFBQVE7d0JBQ2xEQyxPQUFPOzRCQUNILEdBQUdOLGNBQWNFLFdBQVdDLFFBQVFDLE1BQU1DLFVBQVVDLEtBQUs7NEJBQ3pEQyxZQUFZOzRCQUNaQyxZQUFZO3dCQUNoQjtvQkFDSjtnQkFDSjtZQUNKO1FBQ0o7SUFDSjtJQUVDZixRQUEyQ1csSUFBSSxFQUFFSyxRQUFRLENBQUNDO1FBQ3ZEQSxLQUFLQyxLQUFLLEdBQUc7WUFBRVosU0FBUztRQUFNO0lBQ2xDO0lBRUFOLFFBQVFtQixPQUFPLEdBQUc7UUFDZEMsS0FBSztRQUNMQyxPQUFPO1FBQ1BDLFFBQVE7UUFDUkMsTUFBTTtJQUNWO0FBQ0oifQ==