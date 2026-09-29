import { LineTypeStateMachine } from '../line/lineState';
import { type FibonacciRetracementDatum, fibonacciRetracementDatum } from './fibonacciRetracementDatum';

export class FibonacciRetracementStateMachine extends LineTypeStateMachine<FibonacciRetracementDatum> {
    override createDatum() {
        return fibonacciRetracementDatum.create();
    }
}
