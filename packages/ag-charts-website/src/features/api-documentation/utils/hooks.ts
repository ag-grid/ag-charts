import { useState } from 'react';

export function useToggle(defaultValue?: boolean): [boolean, () => void, (newValue: boolean) => void] {
    const [value, setValue] = useState(defaultValue ?? false);
    return [value, () => setValue((currentValue) => !currentValue), setValue];
}
