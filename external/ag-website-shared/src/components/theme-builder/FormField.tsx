import { Close } from '@carbon/icons-react';
import styled from '@emotion/styled';
import type { ReactNode } from 'react';

import { InfoTooltip } from './Tooltip';

export type FormFieldProps = {
    label?: string | null;
    docs?: string | null;
    /**
     * A footnote under the control - a line saying where the value came from,
     * say. Nothing by default.
     */
    note?: ReactNode;
    children?: ReactNode;
    onCloseClick?: () => void;
};

export const FormField = ({ label, children, docs, note, onCloseClick }: FormFieldProps) => (
    <StyledFormField>
        {(label || docs || onCloseClick) && (
            <Label>
                {label}
                {docs && <InfoTooltip title={docs} />}
                {onCloseClick && <CloseButton onClick={onCloseClick} />}
            </Label>
        )}
        {children}
        {note}
    </StyledFormField>
);

const StyledFormField = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const Label = styled('span')`
    color: var(--color-fg-secondary);
    opacity: 0.8;
    font-size: 12px;
    font-weight: 400;
    transition: all 0.3s;
    display: flex;
    align-items: center;

    svg:hover path {
        fill: var(--color-fg-primary);
    }
`;

const CloseButton = styled(Close)`
    cursor: pointer;
    margin-left: auto;
`;
