"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "filterPropertyKeys", {
    enumerable: true,
    get: function() {
        return filterPropertyKeys;
    }
});
const getPropertyToCheck = (property)=>{
    var _property_key, _property_key1, _property_key2;
    return ((_property_key = property.key) == null ? void 0 : _property_key.type) === 'Identifier' ? (_property_key1 = property.key) == null ? void 0 : _property_key1.name : (_property_key2 = property.key) == null ? void 0 : _property_key2.value;
};
function filterPropertyKeys({ removePropertyKeys, properties }) {
    return properties.filter((property)=>{
        const valueToCheck = getPropertyToCheck(property);
        return !removePropertyKeys.includes(valueToCheck);
    });
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL2pzQ29kZVNoaWZ0VXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgZ2V0UHJvcGVydHlUb0NoZWNrID0gKHByb3BlcnR5OiBhbnkpID0+IHtcbiAgICByZXR1cm4gcHJvcGVydHkua2V5Py50eXBlID09PSAnSWRlbnRpZmllcicgPyBwcm9wZXJ0eS5rZXk/Lm5hbWUgOiBwcm9wZXJ0eS5rZXk/LnZhbHVlO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlclByb3BlcnR5S2V5cyh7XG4gICAgcmVtb3ZlUHJvcGVydHlLZXlzLFxuICAgIHByb3BlcnRpZXMsXG59OiB7XG4gICAgcmVtb3ZlUHJvcGVydHlLZXlzOiBzdHJpbmdbXTtcbiAgICBwcm9wZXJ0aWVzOiBhbnk7XG59KSB7XG4gICAgcmV0dXJuIHByb3BlcnRpZXMuZmlsdGVyKChwcm9wZXJ0eTogYW55KSA9PiB7XG4gICAgICAgIGNvbnN0IHZhbHVlVG9DaGVjayA9IGdldFByb3BlcnR5VG9DaGVjayhwcm9wZXJ0eSk7XG4gICAgICAgIHJldHVybiAhcmVtb3ZlUHJvcGVydHlLZXlzLmluY2x1ZGVzKHZhbHVlVG9DaGVjayk7XG4gICAgfSk7XG59XG4iXSwibmFtZXMiOlsiZmlsdGVyUHJvcGVydHlLZXlzIiwiZ2V0UHJvcGVydHlUb0NoZWNrIiwicHJvcGVydHkiLCJrZXkiLCJ0eXBlIiwibmFtZSIsInZhbHVlIiwicmVtb3ZlUHJvcGVydHlLZXlzIiwicHJvcGVydGllcyIsImZpbHRlciIsInZhbHVlVG9DaGVjayIsImluY2x1ZGVzIl0sIm1hcHBpbmdzIjoiOzs7OytCQUlnQkE7OztlQUFBQTs7O0FBSmhCLE1BQU1DLHFCQUFxQixDQUFDQztRQUNqQkEsZUFBc0NBLGdCQUFxQkE7SUFBbEUsT0FBT0EsRUFBQUEsZ0JBQUFBLFNBQVNDLEdBQUcscUJBQVpELGNBQWNFLElBQUksTUFBSyxnQkFBZUYsaUJBQUFBLFNBQVNDLEdBQUcscUJBQVpELGVBQWNHLElBQUksSUFBR0gsaUJBQUFBLFNBQVNDLEdBQUcscUJBQVpELGVBQWNJLEtBQUs7QUFDekY7QUFFTyxTQUFTTixtQkFBbUIsRUFDL0JPLGtCQUFrQixFQUNsQkMsVUFBVSxFQUliO0lBQ0csT0FBT0EsV0FBV0MsTUFBTSxDQUFDLENBQUNQO1FBQ3RCLE1BQU1RLGVBQWVULG1CQUFtQkM7UUFDeEMsT0FBTyxDQUFDSyxtQkFBbUJJLFFBQVEsQ0FBQ0Q7SUFDeEM7QUFDSiJ9