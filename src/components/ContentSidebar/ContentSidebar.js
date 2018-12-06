/**
 * @flow
 * @file Content Sidebar Component
 * @author Box
 */

import 'regenerator-runtime/runtime';
import * as React from 'react';
import classNames from 'classnames';
import uniqueid from 'lodash/uniqueId';
import noop from 'lodash/noop';
import LoadingIndicator from 'box-react-ui/lib/components/loading-indicator/LoadingIndicator';
import Sidebar from './Sidebar';
import API from '../../api';
import APIContext from '../APIContext';
import Internationalize from '../Internationalize';
import { withErrorBoundary } from '../ErrorBoundary';
import { SIDEBAR_FIELDS_TO_FETCH } from '../../util/fields';
import { DEFAULT_HOSTNAME_API, CLIENT_NAME_CONTENT_SIDEBAR, ORIGIN_CONTENT_SIDEBAR } from '../../constants';
import type { DetailsSidebarProps } from './DetailsSidebar';
import type { ActivitySidebarProps } from './ActivitySidebar';
import type { MetadataSidebarProps } from './MetadataSidebar';
import type { $AxiosXHR } from 'axios'; // eslint-disable-line
import '../fonts.scss';
import '../base.scss';
import './ContentSidebar.scss';

type Props = {
    activitySidebarProps: ActivitySidebarProps,
    apiHost: string,
    cache?: APICache,
    className: string,
    clientName: string,
    currentUser?: User,
    detailsSidebarProps: DetailsSidebarProps,
    fileId?: string,
    getPreview: Function,
    getViewer: Function,
    hasActivityFeed: boolean,
    hasMetadata: boolean,
    hasSkills: boolean,
    isLarge: boolean,
    language?: string,
    metadataSidebarProps: MetadataSidebarProps,
    messages?: StringMap,
    onVersionHistoryClick?: Function,
    requestInterceptor?: Function,
    responseInterceptor?: Function,
    sharedLink?: string,
    sharedLinkPassword?: string,
    token: Token,
} & ErrorContextProps;

type State = {
    file?: BoxItem,
    isOpen: boolean,
    isLoading: boolean,
    metadataEditors?: Array<MetadataEditor>,
    view?: SidebarView,
};

class ContentSidebar extends React.PureComponent<Props, State> {
    id: string;

    props: Props;

    state: State;

    api: API;

    static defaultProps = {
        activitySidebarProps: {},
        apiHost: DEFAULT_HOSTNAME_API,
        className: '',
        clientName: CLIENT_NAME_CONTENT_SIDEBAR,
        detailsSidebarProps: {},
        getPreview: noop,
        getViewer: noop,
        hasActivityFeed: false,
        hasMetadata: false,
        hasSkills: false,
        isLarge: true,
        metadataSidebarProps: {},
    };

    /**
     * [constructor]
     *
     * @private
     * @return {ContentSidebar}
     */
    constructor(props: Props) {
        super(props);
        const {
            apiHost,
            isLarge,
            cache,
            clientName,
            requestInterceptor,
            responseInterceptor,
            sharedLink,
            sharedLinkPassword,
            token,
        } = props;

        this.id = uniqueid('bcs_');
        this.api = new API({
            apiHost,
            cache,
            clientName,
            requestInterceptor,
            responseInterceptor,
            sharedLink,
            sharedLinkPassword,
            token,
        });

        this.state = {
            isLoading: true, // by default show the loading indicator
            isOpen: isLarge, // by default open or close based on responsiveness
        };
    }

    /**
     * Destroys api instances with caches
     *
     * @public
     * @return {void}
     */
    clearCache(): void {
        this.api.destroy(true);
    }

    /**
     * Cleanup
     *
     * @private
     * @inheritdoc
     * @return {void}
     */
    componentWillUnmount() {
        // Don't destroy the cache while unmounting
        this.api.destroy(false);
    }

    /**
     * Fetches the file data on load
     *
     * @private
     * @inheritdoc
     * @return {void}
     */
    componentDidMount() {
        this.fetchFile();
    }

    /**
     * Fetches new file data on update
     *
     * @private
     * @inheritdoc
     * @return {void}
     */
    componentDidUpdate(prevProps: Props) {
        const { fileId, isLarge }: Props = this.props;
        const { fileId: prevFileId, isLarge: prevIsLarge }: Props = prevProps;
        const { view }: State = this.state;

        if (fileId !== prevFileId) {
            // If the file has changed, fetch the new one. This should also eventually
            // use file version id when we start viewing file versions.
            // No need to unset the file object since we will show a loading indicator.
            this.fetchFile();
        } else if (!view && isLarge !== prevIsLarge) {
            // If the view has been manually set, ignore responsiveness changes.
            this.setState({ isOpen: isLarge });
        }
    }

    /**
     * Toggle the sidebar view state
     *
     * @param {string} view - the selected view
     * @return {void}
     */
    onToggle = (view: SidebarView): void => {
        const { isOpen, view: priorView }: State = this.state;
        const isSameView = view === priorView;
        const isClosing = isOpen && isSameView;
        this.setState({
            view,
            isOpen: !isClosing,
        });
    };

    /**
     * Network error callback
     *
     * @private
     * @param {Error} error - Error object
     * @param {string} code - error code
     * @return {void}
     */
    errorCallback = (error: ElementsXhrError, code: string): void => {
        /* eslint-disable no-console */
        console.error(error);
        /* eslint-enable no-console */

        /* eslint-disable react/prop-types */
        this.props.onError(error, code, {
            error,
        });
        /* eslint-enable react/prop-types */
    };

    /**
     * Success callback for fetching metadata editors
     *
     * @private
     * @param {Object} file - Box file
     * @return {void}
     */
    fetchMetadataSuccessCallback = ({ editors }: { editors: Array<MetadataEditor> }): void => {
        this.setState({ metadataEditors: editors });
    };

    /**
     * Fetches file metadata editors if required
     *
     * @private
     * @return {void}
     */
    fetchMetadata(): void {
        const { file }: State = this.state;
        const { hasMetadata, metadataSidebarProps }: Props = this.props;
        const { getMetadata, isFeatureEnabled = true }: MetadataSidebarProps = metadataSidebarProps;

        // Only fetch metadata if we think that the file may have metadata on it
        // but currently the metadata feature is turned off. Use case of this would be a free
        // user who doesn't have the metadata feature but is collabed on a file from a user
        // who added metadata on the file. If the feature is enabled we always end up showing
        // the metadata sidebar irrespective of there being any existing metadata or not.
        if (hasMetadata && !isFeatureEnabled) {
            this.api
                .getMetadataAPI(true)
                .getEditors(
                    ((file: any): BoxItem),
                    this.fetchMetadataSuccessCallback,
                    noop,
                    getMetadata,
                    isFeatureEnabled,
                );
        }
    }

    /**
     * File fetch success callback that sets the file and sidebar visibility.
     * Also makes an optional request to fetch metadata editors.
     *
     * @private
     * @param {Object} file - Box file
     * @return {void}
     */
    fetchFileSuccessCallback = (file: BoxItem): void => {
        this.setState(
            {
                file,
                isLoading: false,
            },
            this.fetchMetadata,
        );
    };

    /**
     * Fetches a file
     *
     * @private
     * @param {Object|void} [fetchOptions] - Fetch options
     * @return {void}
     */
    fetchFile(fetchOptions: FetchOptions = {}): void {
        const { detailsSidebarProps, fileId, hasActivityFeed, hasMetadata, hasSkills }: Props = this.props;
        const { hasProperties, hasAccessStats, hasClassification, hasVersions, hasNotices } = detailsSidebarProps;
        const hasSidebar =
            hasActivityFeed ||
            hasMetadata ||
            hasSkills ||
            !!hasProperties ||
            !!hasAccessStats ||
            !!hasClassification ||
            !!hasVersions ||
            !!hasNotices;

        this.setState({ isLoading: true });
        if (fileId && hasSidebar) {
            this.api.getFileAPI().getFile(fileId, this.fetchFileSuccessCallback, this.errorCallback, {
                ...fetchOptions,
                fields: SIDEBAR_FIELDS_TO_FETCH,
            });
        }
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
            className,
            detailsSidebarProps,
            getPreview,
            getViewer,
            hasActivityFeed,
            hasMetadata,
            hasSkills,
            language,
            messages,
            metadataSidebarProps,
            onVersionHistoryClick,
        }: Props = this.props;
        const { file, isLoading, isOpen, metadataEditors, view }: State = this.state;

        // For the initial render don't do anything till we have atleast some data to show.
        // This data in future renders can just also be data from the prior file.
        if (!file) {
            return null;
        }

        const styleClassName = classNames(
            'be bcs',
            {
                'bcs-is-open': isOpen,
            },
            className,
        );

        return (
            <Internationalize language={language} messages={messages}>
                <APIContext.Provider value={(this.api: any)}>
                    <aside id={this.id} className={styleClassName}>
                        <div className="be-app-element">
                            {isLoading ? (
                                <div className="bcs-loading">
                                    <LoadingIndicator />
                                </div>
                            ) : (
                                <Sidebar
                                    activitySidebarProps={activitySidebarProps}
                                    detailsSidebarProps={detailsSidebarProps}
                                    file={file}
                                    getPreview={getPreview}
                                    getViewer={getViewer}
                                    hasActivityFeed={hasActivityFeed}
                                    hasMetadata={hasMetadata}
                                    hasSkills={hasSkills}
                                    isOpen={isOpen}
                                    key={file.id}
                                    metadataEditors={metadataEditors}
                                    metadataSidebarProps={metadataSidebarProps}
                                    onVersionHistoryClick={onVersionHistoryClick}
                                    onToggle={this.onToggle}
                                    view={view}
                                />
                            )}
                        </div>
                    </aside>
                </APIContext.Provider>
            </Internationalize>
        );
    }
}

export type ContentSidebarProps = Props;
export { ContentSidebar as ContentSidebarComponent };
export default withErrorBoundary(ORIGIN_CONTENT_SIDEBAR)(ContentSidebar);
