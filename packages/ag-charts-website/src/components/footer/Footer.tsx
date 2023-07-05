import classNames from "classnames";
import { Icon } from "../icon/Icon";
import footerItems from "./footer-items.json";
import styles from "./Footer.module.scss";

interface FooterProps {
    path: string;
}

const MenuColumns = () =>
    footerItems.map(({ title, links }) => (
        <div key={title} className={styles.menuColumn}>
            <h4 className="thin-text">{title}</h4>
            <ul className="list-style-none">
                {links.map(({ name, url, newTab, iconName }: any) => (
                    <li key={`${title}_${name}`}>
                        <a
                            href={url}
                            {...(newTab
                                ? { target: "_blank", rel: "noreferrer" }
                                : {})}
                        >
                            {iconName && <Icon name={iconName} />}
                            {name}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    ));

export const Footer = ({ path }: FooterProps) => (
    <footer className={styles.footer}>
        <div className="page-margin">
            <div className={styles.row}>
                <MenuColumns />
            </div>
            <div className={styles.row}>
                <p className="font-size-small thin-text">
                    AG Grid Ltd registered in the United Kingdom.
                    Company&nbsp;No.&nbsp;07318192.
                </p>
                <p className="font-size-small thin-text">
                    &copy; AG Grid Ltd. 2015-{new Date().getFullYear()}
                </p>
            </div>

            {/* Only show customer logo trademark info on homepage */}
            {(path === "/" || path === undefined) && (
                <div className={classNames(styles.row, styles.trademarks)}>
                    <p className="font-size-small thin-text">
                        The Microsoft logo is a trademark of the Microsoft group
                        of companies.
                    </p>
                </div>
            )}
        </div>
    </footer>
);
