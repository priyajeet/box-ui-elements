/**
 * @flow
 * @file Preview sidebar component
 * @author Box
 */

import * as React from 'react';
import SidebarNav from './SidebarNav';
import DetailsSidebar from './DetailsSidebar';
import SkillsSidebar from './SkillsSidebar';
import ActivitySidebar from './ActivitySidebar';
import MetadataSidebar from './MetadataSidebar';
import {
    SIDEBAR_VIEW_SKILLS,
    SIDEBAR_VIEW_ACTIVITY,
    SIDEBAR_VIEW_DETAILS,
    SIDEBAR_VIEW_METADATA,
} from '../../constants';
import type { DetailsSidebarProps } from './DetailsSidebar';
import type { ActivitySidebarProps } from './ActivitySidebar';
import type { MetadataSidebarProps } from './MetadataSidebar';
import { hasSkills as hasSkillsData } from './Skills/skillUtils';
import './Sidebar.scss';

type Props = {
    activitySidebarProps: ActivitySidebarProps,
    currentUser?: User,
    detailsSidebarProps: DetailsSidebarProps,
    file: BoxItem,
    getPreview: Function,
    getViewer: Function,
    hasActivityFeed: boolean,
    hasMetadata: boolean,
    hasSkills: boolean,
    isOpen: boolean,
    metadataEditors?: Array<MetadataEditor>,
    metadataSidebarProps: MetadataSidebarProps,
    onToggle: Function,
    onVersionHistoryClick?: Function,
    view: SidebarView,
};

class Sidebar extends React.PureComponent<Props> {
    props: Props;

    /**
     * Determines if we can render the details sidebar.
     *
     * @param {ContentSidebarProps} props - User passed in props
     * @return {Boolean} true if we should render
     */
    hasDetails(): boolean {
        const { detailsSidebarProps }: Props = this.props;
        const { hasProperties, hasAccessStats, hasClassification, hasVersions, hasNotices } = detailsSidebarProps;
        return !!hasProperties || !!hasAccessStats || !!hasClassification || !!hasVersions || !!hasNotices;
    }

    /**
     * Determines if we can render the metadata sidebar.
     *
     * @return {Boolean} true if we should render
     */
    hasMetadata(): boolean {
        const { hasMetadata, metadataEditors, metadataSidebarProps }: Props = this.props;
        const { isFeatureEnabled = true }: MetadataSidebarProps = metadataSidebarProps;
        return hasMetadata && (isFeatureEnabled || (Array.isArray(metadataEditors) && metadataEditors.length > 0));
    }

    /**
     * Determines if we can render the activity sidebar.
     * Only relies on props.
     *
     * @param {ContentSidebarProps} props - User passed in props
     * @return {Boolean} true if we should render
     */
    hasActivityFeed(): boolean {
        const { hasActivityFeed }: Props = this.props;
        return hasActivityFeed;
    }

    /**
     * Determines if we can render the skills sidebar.
     * Only relies on props.
     *
     * @return {Boolean} true if we should render
     */
    hasSkills(): boolean {
        const { file, hasSkills }: Props = this.props;
        return hasSkills && hasSkillsData(file);
    }

    /**
     * File fetch success callback that sets the file and view
     *
     * @private
     * @param {Object} props - component props
     * @param {Object} file - Box file
     * @return {string} Sidebar view to use
     */
    getSidebarView(): ?SidebarView {
        const { isOpen, view }: Props = this.props;

        if (!isOpen) {
            return undefined;
        }

        let newView = view;
        const canDefaultToSkills = this.hasSkills();
        const canDefaultToDetails = this.hasDetails();
        const canDefaultToActivity = this.hasActivityFeed();
        const canDefaultToMetadata = this.hasMetadata();

        // Only reset the view if prior view is no longer applicable
        if (
            !view ||
            (view === SIDEBAR_VIEW_SKILLS && !canDefaultToSkills) ||
            (view === SIDEBAR_VIEW_ACTIVITY && !canDefaultToActivity) ||
            (view === SIDEBAR_VIEW_DETAILS && !canDefaultToDetails) ||
            (view === SIDEBAR_VIEW_METADATA && !canDefaultToMetadata)
        ) {
            if (canDefaultToSkills) {
                newView = SIDEBAR_VIEW_SKILLS;
            } else if (canDefaultToActivity) {
                newView = SIDEBAR_VIEW_ACTIVITY;
            } else if (canDefaultToDetails) {
                newView = SIDEBAR_VIEW_DETAILS;
            } else if (canDefaultToMetadata) {
                newView = SIDEBAR_VIEW_METADATA;
            }
        }

        return newView;
    }

    /**
     * Renders the sidebar
     *
     * @private
     * @inheritdoc
     * @return {Element}
     */
    render() {
        const {
            activitySidebarProps,
            currentUser,
            detailsSidebarProps,
            file,
            getPreview,
            getViewer,
            metadataSidebarProps,
            onToggle,
            onVersionHistoryClick,
        }: Props = this.props;

        const view = this.getSidebarView();

        return (
            <React.Fragment>
                <SidebarNav
                    hasSkills={this.hasSkills()}
                    hasMetadata={this.hasMetadata()}
                    hasActivityFeed={this.hasActivityFeed()}
                    hasDetails={this.hasDetails()}
                    onToggle={onToggle}
                    selectedView={view}
                />
                {view === SIDEBAR_VIEW_DETAILS && (
                    <DetailsSidebar
                        file={file}
                        onVersionHistoryClick={onVersionHistoryClick}
                        {...detailsSidebarProps}
                    />
                )}
                {view === SIDEBAR_VIEW_SKILLS && (
                    <SkillsSidebar file={file} getPreview={getPreview} getViewer={getViewer} />
                )}
                {view === SIDEBAR_VIEW_ACTIVITY && (
                    <ActivitySidebar
                        currentUser={currentUser}
                        file={file}
                        onVersionHistoryClick={onVersionHistoryClick}
                        {...activitySidebarProps}
                    />
                )}
                {view === SIDEBAR_VIEW_METADATA && <MetadataSidebar file={file} {...metadataSidebarProps} />}
            </React.Fragment>
        );
    }
}

export default Sidebar;
