/**
 * @flow
 * @file Preview sidebar content component
 * @author Box
 */

import * as React from 'react';
import './SidebarContent.scss';

type Props = {
    actions?: React.Node,
    title: React.Node,
    children: any,
    className: string,
};

const SidebarContent = ({ actions, children, className = '', title }: Props) => (
    <div className="bcs-content">
        <div className="bcs-content-header">
            <h3 className="bcs-title">{title}</h3>
            {actions}
        </div>
        <div className="bcs-scroll-content-wrapper">
            <div className={`bcs-scroll-content ${className}`}>{children}</div>
        </div>
    </div>
);

export default SidebarContent;
