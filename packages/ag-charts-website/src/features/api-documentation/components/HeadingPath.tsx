import { createUnionNestedObjectPathItemRegex } from '../utils/modelPath';
import styles from './ApiDocumentation.module.scss';

export function HeadingPath({ path }: { path: string[] }) {
    const regex = createUnionNestedObjectPathItemRegex();
    return (
        path.length > 0 && (
            <span className={styles.parentProperties}>
                {path.map((pathItem, index) => {
                    const arrayDiscriminatorMatches = regex.exec(pathItem);
                    const [_, preValue, value, postValue] = arrayDiscriminatorMatches || [];
                    // Only show separator `.` at the front, when not the first and not an array discriminator afterwards
                    const separator = index !== 0 && !arrayDiscriminatorMatches ? '.' : '';

                    return (
                        <span className={styles.noWrap} key={`${pathItem}-${index}`}>
                            {separator}
                            {!arrayDiscriminatorMatches && <>{pathItem}</>}
                            {arrayDiscriminatorMatches && (
                                <>
                                    {preValue}
                                    <span className={styles.unionDiscriminator}>{value}</span>
                                    {postValue}
                                </>
                            )}
                        </span>
                    );
                })}
            </span>
        )
    );
}
