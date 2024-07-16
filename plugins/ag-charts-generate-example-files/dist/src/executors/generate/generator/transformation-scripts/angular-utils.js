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
    convertTemplate: function() {
        return convertTemplate;
    },
    getImport: function() {
        return getImport;
    },
    toAssignment: function() {
        return toAssignment;
    },
    toConst: function() {
        return toConst;
    },
    toInput: function() {
        return toInput;
    },
    toMember: function() {
        return toMember;
    },
    toMemberWithValue: function() {
        return toMemberWithValue;
    },
    toOutput: function() {
        return toOutput;
    }
});
const _parserutils = require("./parser-utils");
const _stringutils = require("./string-utils");
const toInput = (property)=>`[${property.name}]="${property.name}"`;
const toConst = (property)=>`[${property.name}]="${property.value}"`;
const toOutput = (event)=>`(${event.name})="${event.handlerName}($event)"`;
const toMember = (property)=>`public ${property.name};`;
const toMemberWithValue = (property)=>{
    if (property.typings) {
        const typing = property.typings.typeName;
        // Don't include obvious types
        if (![
            'number',
            'string',
            'boolean'
        ].includes(typing)) {
            let typeName = property.typings.typeName;
            if (property.name === 'columnDefs') {
                // Special logic for columnDefs as its a popular property
                typeName = property.value.includes('children') ? '(ColDef | ColGroupDef)[]' : 'ColDef[]';
            }
            return `public ${property.name}: ${typeName} = ${property.value}`;
        }
    }
    return `public ${property.name} = ${property.value}`;
};
const toAssignment = (property)=>`this.${property.name} = ${property.value}`;
function convertTemplate(template) {
    _parserutils.recognizedDomEvents.forEach((event)=>{
        template = template.replace(new RegExp(`on${event}=`, 'g'), `(${event})=`);
    });
    return template.replace(/\(event\)/g, '($event)');
}
function getImport(filename) {
    const componentName = filename.split('.')[0];
    return `import { ${(0, _stringutils.toTitleCase)(componentName)} } from './${componentName}.component';`;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvYW5ndWxhci11dGlscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZWNvZ25pemVkRG9tRXZlbnRzIH0gZnJvbSAnLi9wYXJzZXItdXRpbHMnO1xuaW1wb3J0IHsgdG9UaXRsZUNhc2UgfSBmcm9tICcuL3N0cmluZy11dGlscyc7XG5cbmV4cG9ydCBjb25zdCB0b0lucHV0ID0gKHByb3BlcnR5OiBhbnkpID0+IGBbJHtwcm9wZXJ0eS5uYW1lfV09XCIke3Byb3BlcnR5Lm5hbWV9XCJgO1xuZXhwb3J0IGNvbnN0IHRvQ29uc3QgPSAocHJvcGVydHk6IGFueSkgPT4gYFske3Byb3BlcnR5Lm5hbWV9XT1cIiR7cHJvcGVydHkudmFsdWV9XCJgO1xuZXhwb3J0IGNvbnN0IHRvT3V0cHV0ID0gKGV2ZW50OiBhbnkpID0+IGAoJHtldmVudC5uYW1lfSk9XCIke2V2ZW50LmhhbmRsZXJOYW1lfSgkZXZlbnQpXCJgO1xuZXhwb3J0IGNvbnN0IHRvTWVtYmVyID0gKHByb3BlcnR5OiBhbnkpID0+IGBwdWJsaWMgJHtwcm9wZXJ0eS5uYW1lfTtgO1xuZXhwb3J0IGNvbnN0IHRvTWVtYmVyV2l0aFZhbHVlID0gKHByb3BlcnR5OiBhbnkpID0+IHtcbiAgICBpZiAocHJvcGVydHkudHlwaW5ncykge1xuICAgICAgICBjb25zdCB0eXBpbmcgPSBwcm9wZXJ0eS50eXBpbmdzLnR5cGVOYW1lO1xuICAgICAgICAvLyBEb24ndCBpbmNsdWRlIG9idmlvdXMgdHlwZXNcbiAgICAgICAgaWYgKCFbJ251bWJlcicsICdzdHJpbmcnLCAnYm9vbGVhbiddLmluY2x1ZGVzKHR5cGluZykpIHtcbiAgICAgICAgICAgIGxldCB0eXBlTmFtZSA9IHByb3BlcnR5LnR5cGluZ3MudHlwZU5hbWU7XG4gICAgICAgICAgICBpZiAocHJvcGVydHkubmFtZSA9PT0gJ2NvbHVtbkRlZnMnKSB7XG4gICAgICAgICAgICAgICAgLy8gU3BlY2lhbCBsb2dpYyBmb3IgY29sdW1uRGVmcyBhcyBpdHMgYSBwb3B1bGFyIHByb3BlcnR5XG4gICAgICAgICAgICAgICAgdHlwZU5hbWUgPSBwcm9wZXJ0eS52YWx1ZS5pbmNsdWRlcygnY2hpbGRyZW4nKSA/ICcoQ29sRGVmIHwgQ29sR3JvdXBEZWYpW10nIDogJ0NvbERlZltdJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBgcHVibGljICR7cHJvcGVydHkubmFtZX06ICR7dHlwZU5hbWV9ID0gJHtwcm9wZXJ0eS52YWx1ZX1gO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBgcHVibGljICR7cHJvcGVydHkubmFtZX0gPSAke3Byb3BlcnR5LnZhbHVlfWA7XG59O1xuZXhwb3J0IGNvbnN0IHRvQXNzaWdubWVudCA9IChwcm9wZXJ0eTogYW55KSA9PiBgdGhpcy4ke3Byb3BlcnR5Lm5hbWV9ID0gJHtwcm9wZXJ0eS52YWx1ZX1gO1xuXG5leHBvcnQgZnVuY3Rpb24gY29udmVydFRlbXBsYXRlKHRlbXBsYXRlOiBzdHJpbmcpIHtcbiAgICByZWNvZ25pemVkRG9tRXZlbnRzLmZvckVhY2goKGV2ZW50KSA9PiB7XG4gICAgICAgIHRlbXBsYXRlID0gdGVtcGxhdGUucmVwbGFjZShuZXcgUmVnRXhwKGBvbiR7ZXZlbnR9PWAsICdnJyksIGAoJHtldmVudH0pPWApO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRlbXBsYXRlLnJlcGxhY2UoL1xcKGV2ZW50XFwpL2csICcoJGV2ZW50KScpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW1wb3J0KGZpbGVuYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjb21wb25lbnROYW1lID0gZmlsZW5hbWUuc3BsaXQoJy4nKVswXTtcbiAgICByZXR1cm4gYGltcG9ydCB7ICR7dG9UaXRsZUNhc2UoY29tcG9uZW50TmFtZSl9IH0gZnJvbSAnLi8ke2NvbXBvbmVudE5hbWV9LmNvbXBvbmVudCc7YDtcbn1cbiJdLCJuYW1lcyI6WyJjb252ZXJ0VGVtcGxhdGUiLCJnZXRJbXBvcnQiLCJ0b0Fzc2lnbm1lbnQiLCJ0b0NvbnN0IiwidG9JbnB1dCIsInRvTWVtYmVyIiwidG9NZW1iZXJXaXRoVmFsdWUiLCJ0b091dHB1dCIsInByb3BlcnR5IiwibmFtZSIsInZhbHVlIiwiZXZlbnQiLCJoYW5kbGVyTmFtZSIsInR5cGluZ3MiLCJ0eXBpbmciLCJ0eXBlTmFtZSIsImluY2x1ZGVzIiwidGVtcGxhdGUiLCJyZWNvZ25pemVkRG9tRXZlbnRzIiwiZm9yRWFjaCIsInJlcGxhY2UiLCJSZWdFeHAiLCJmaWxlbmFtZSIsImNvbXBvbmVudE5hbWUiLCJzcGxpdCIsInRvVGl0bGVDYXNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQXdCZ0JBLGVBQWU7ZUFBZkE7O0lBUUFDLFNBQVM7ZUFBVEE7O0lBVkhDLFlBQVk7ZUFBWkE7O0lBbEJBQyxPQUFPO2VBQVBBOztJQURBQyxPQUFPO2VBQVBBOztJQUdBQyxRQUFRO2VBQVJBOztJQUNBQyxpQkFBaUI7ZUFBakJBOztJQUZBQyxRQUFRO2VBQVJBOzs7NkJBTHVCOzZCQUNSO0FBRXJCLE1BQU1ILFVBQVUsQ0FBQ0ksV0FBa0IsQ0FBQyxDQUFDLEVBQUVBLFNBQVNDLElBQUksQ0FBQyxHQUFHLEVBQUVELFNBQVNDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDMUUsTUFBTU4sVUFBVSxDQUFDSyxXQUFrQixDQUFDLENBQUMsRUFBRUEsU0FBU0MsSUFBSSxDQUFDLEdBQUcsRUFBRUQsU0FBU0UsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUMzRSxNQUFNSCxXQUFXLENBQUNJLFFBQWUsQ0FBQyxDQUFDLEVBQUVBLE1BQU1GLElBQUksQ0FBQyxHQUFHLEVBQUVFLE1BQU1DLFdBQVcsQ0FBQyxTQUFTLENBQUM7QUFDakYsTUFBTVAsV0FBVyxDQUFDRyxXQUFrQixDQUFDLE9BQU8sRUFBRUEsU0FBU0MsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM5RCxNQUFNSCxvQkFBb0IsQ0FBQ0U7SUFDOUIsSUFBSUEsU0FBU0ssT0FBTyxFQUFFO1FBQ2xCLE1BQU1DLFNBQVNOLFNBQVNLLE9BQU8sQ0FBQ0UsUUFBUTtRQUN4Qyw4QkFBOEI7UUFDOUIsSUFBSSxDQUFDO1lBQUM7WUFBVTtZQUFVO1NBQVUsQ0FBQ0MsUUFBUSxDQUFDRixTQUFTO1lBQ25ELElBQUlDLFdBQVdQLFNBQVNLLE9BQU8sQ0FBQ0UsUUFBUTtZQUN4QyxJQUFJUCxTQUFTQyxJQUFJLEtBQUssY0FBYztnQkFDaEMseURBQXlEO2dCQUN6RE0sV0FBV1AsU0FBU0UsS0FBSyxDQUFDTSxRQUFRLENBQUMsY0FBYyw2QkFBNkI7WUFDbEY7WUFDQSxPQUFPLENBQUMsT0FBTyxFQUFFUixTQUFTQyxJQUFJLENBQUMsRUFBRSxFQUFFTSxTQUFTLEdBQUcsRUFBRVAsU0FBU0UsS0FBSyxDQUFDLENBQUM7UUFDckU7SUFDSjtJQUNBLE9BQU8sQ0FBQyxPQUFPLEVBQUVGLFNBQVNDLElBQUksQ0FBQyxHQUFHLEVBQUVELFNBQVNFLEtBQUssQ0FBQyxDQUFDO0FBQ3hEO0FBQ08sTUFBTVIsZUFBZSxDQUFDTSxXQUFrQixDQUFDLEtBQUssRUFBRUEsU0FBU0MsSUFBSSxDQUFDLEdBQUcsRUFBRUQsU0FBU0UsS0FBSyxDQUFDLENBQUM7QUFFbkYsU0FBU1YsZ0JBQWdCaUIsUUFBZ0I7SUFDNUNDLGdDQUFtQixDQUFDQyxPQUFPLENBQUMsQ0FBQ1I7UUFDekJNLFdBQVdBLFNBQVNHLE9BQU8sQ0FBQyxJQUFJQyxPQUFPLENBQUMsRUFBRSxFQUFFVixNQUFNLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEVBQUVBLE1BQU0sRUFBRSxDQUFDO0lBQzdFO0lBRUEsT0FBT00sU0FBU0csT0FBTyxDQUFDLGNBQWM7QUFDMUM7QUFFTyxTQUFTbkIsVUFBVXFCLFFBQWdCO0lBQ3RDLE1BQU1DLGdCQUFnQkQsU0FBU0UsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFO0lBQzVDLE9BQU8sQ0FBQyxTQUFTLEVBQUVDLElBQUFBLHdCQUFXLEVBQUNGLGVBQWUsV0FBVyxFQUFFQSxjQUFjLFlBQVksQ0FBQztBQUMxRiJ9