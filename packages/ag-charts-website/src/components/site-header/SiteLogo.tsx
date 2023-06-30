import { FunctionComponent, useState } from "react";
import styles from "./SiteHeader.module.scss";
import { ReactComponent as LogoType } from "../../images/inline-svgs/ag-grid-logotype.svg";
import LogoMark from "../logo/LogoMark";
import classnames from "classnames";

export const SiteLogo: FunctionComponent = () => {
    const [isLogoHover, setIsLogoHover] = useState(false);

    return (
        <a
            href="/"
            aria-label="Home"
            className={styles.headerLogo}
            onMouseEnter={() => {
                setIsLogoHover(true);
            }}
            onMouseLeave={() => {
                setIsLogoHover(false);
            }}
        >
            <LogoType />
            <div
                className={classnames(
                    "font-size-massive",
                    styles.chartsLogoType
                )}
            >
                Charts
            </div>
            <LogoMark bounce={isLogoHover} />
        </a>
    );
};
