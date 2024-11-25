import { LineTypeStateMachine } from '../line/lineState';
import { FibonacciRetracementProperties } from './fibonacciRetracementProperties';

export class FibonacciRetracementStateMachine extends LineTypeStateMachine<FibonacciRetracementProperties> {
    override createDatum() {
        return new FibonacciRetracementProperties();
    }
}
