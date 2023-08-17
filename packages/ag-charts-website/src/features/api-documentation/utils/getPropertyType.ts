import type { Config, PropertyType } from '../types';
import { isGridOptionEvent } from './isGridOptionEvent';

/**
 * Property type is the small blue text that tells you the type of the given property
 */
export function getPropertyType(type: string | PropertyType, config: Config) {
    let propertyType = '';
    if (type) {
        if (typeof type == 'string') {
            propertyType = type;
        } else if (typeof type == 'object') {
            if (type.arguments || type.parameters) {
                if (isGridOptionEvent(config.gridOpProp) || config.isEvent) {
                    // If an event show the event type instead of Function
                    propertyType = Object.values(type.arguments)[0];
                } else {
                    propertyType = `Function`;
                }
            } else if (type.returnType) {
                if (typeof type.returnType == 'object') {
                    propertyType = 'object';
                } else if (typeof type.returnType == 'string') {
                    const inter = config.lookups?.interfaces[type.returnType];
                    if (inter && inter.meta && inter.meta.isCallSignature) {
                        propertyType = `Function`;
                    } else {
                        propertyType = type.returnType;
                    }
                }
            } else {
                propertyType = 'void';
            }
        }
    }
    // We hide generics from this part of the display for simplicity
    // Could be done with a Regex...
    propertyType = propertyType.replace(
        /<(TData|TValue|TContext|any)?(, )?(TData|TValue|TContext|any)?(, )?(TData|TValue|TContext|any)?>/g,
        ''
    );

    return propertyType;
}
