import { BaseProperties } from '../../../util/properties';
export declare const INTERPOLATION_TYPE: import("../../../util/validation").ValidatePredicate;
export declare const INTERPOLATION_STEP_POSITION: import("../../../util/validation").ValidatePredicate;
export declare class InterpolationProperties extends BaseProperties {
    type: 'linear' | 'smooth' | 'step';
    tension: number;
    position: 'start' | 'middle' | 'end';
}
