/**
 * @template PayloadType
 * @typedef {{
 *  isSuccess: true,
 *  payload: PayloadType,
 * }} Success
 */
/**
 * @template ErrorType
 * @typedef {{
 *  isSuccess: false,
 *  error: ErrorType,
 * }} Failure
 */

/**
 * @template PayloadType
 * @param {PayloadType} payload
 * @returns {Success<PayloadType>}
 */
const createSuccess = (payload) => {
    return {
        isSuccess: true,
        payload,
    };
};
/**
 * @template ErrorType
 * @param {ErrorType} error
 * @returns {Failure<ErrorType>}
 */
const createFailure = (error) => {
    return {
        isSuccess: false,
        error,
    };
};

const ASYNC_FN_FAIL_ERROR = "ASYNC_FN_FAILED";
const REQUEST_FAILED_ERROR = "REQUEST_FAILED";

/**
 * @template {unknown[]} AsyncArgs
 * @template AsyncResult
 * @param {(...args: AsyncArgs) => Promise<AsyncResult>} asyncFn
 */
const safeAsync = (asyncFn) => {
    /**
     * @param {AsyncArgs} args
     */
    const callAsync = async (...args) => {
        try {
            return await asyncFn(...args);
        } catch (error) {
            return createFailure({
                /**
                 * @type {typeof ASYNC_FN_FAIL_ERROR}
                 */
                type: ASYNC_FN_FAIL_ERROR,
                errorObj: error,
            });
        }
    };

    return callAsync;
};

function SpoolManagerAPIClient(pluginId, baseUrl) {
    this.pluginId = pluginId;
    this.baseUrl = baseUrl;

    const _buildRequestQuery = function (data) {
        if (typeof (data) === 'string') {
            return data;
        }

        return Object
            .entries(data)
            .map(([ key, value ]) => {
                const encodedKey = encodeURIComponent(key);
                const encodedValue = encodeURIComponent(value);

                return `${encodedKey}=${encodedValue}`;
            })
            .join('&');
    };

    const _addApiKeyIfNecessary = function (urlContext) {
        if (UI_API_KEY) {
            urlContext = urlContext + "?apikey=" + UI_API_KEY;
        }
        return urlContext;
    }

    const buildApiUrl = (url) => {
        return `${this.baseUrl}plugin/${this.pluginId}/${url}`;
    };
    const buildFetchOptions = (options) => {
        const methodsWithBody = [ "POST", "PUT", "PATCH" ];

        const fetchOptions = {
            ...options,
        };

        if (methodsWithBody.includes((options.method ?? "GET").toUpperCase())) {
            fetchOptions.headers = {
                'Content-Type': "application/json; charset=UTF-8",
                ...(fetchOptions.headers ?? {}),
            };
        }

        return fetchOptions;
    };

    const callApi = async (url, options) => {
        const endpointUrl = buildApiUrl(url);
        const fetchOptions = buildFetchOptions(options);

        const request = await fetch(endpointUrl, fetchOptions);
        const response = await ((async () => {
            if (request.headers.get('Content-Type') !== 'application/json') {
                return;
            }

            try {
                /**
                 * @type unknown
                 */
                const responseJSON = await request.json();

                return responseJSON;
            } catch (error) {
                return;
            }
        }))();

        if (!request.ok) {
            return createFailure({
                /**
                 * @type {typeof REQUEST_FAILED_ERROR}
                 */
                type: REQUEST_FAILED_ERROR,
                /**
                 * @type true
                 */
                isRequestFailure: true,
                response,
            });
        }

        return createSuccess({
            response,
        });
    };

    const loadDatabaseMetaData = safeAsync(async () => {
        return callApi(
            "loadDatabaseMetaData",
            {
                method: "GET",
            },
        );
    });
    const testDatabaseConnection = safeAsync(async (databaseSettings) => {
        const jsonPayload = ko.toJSON(databaseSettings);

        return callApi(
            "testDatabaseConnection",
            {
                method: "PUT",
                body: jsonPayload,
            },
        );
    });
    const confirmDatabaseProblemMessage = safeAsync(async () => {
        return callApi(
            "confirmDatabaseProblemMessage",
            {
                method: "PUT",
            },
        );
    });
    const callLoadSelectedSpools = safeAsync(async () => {
        return callApi(
            "loadSelectedSpools",
            {
                method: "GET",
            },
        );
    });
    const callLoadSpoolsByQuery = safeAsync(async (tableQuery) => {
        const queryParams = _buildRequestQuery(tableQuery);

        return callApi(
            `loadSpoolsByQuery?${queryParams}`,
            {
                method: "GET",
            },
        );
    });
    const callSaveSpool = safeAsync(async (spoolItem) => {
        const jsonPayload = ko.toJSON(spoolItem);

        return callApi(
            "saveSpool",
            {
                method: "PUT",
                body: jsonPayload,
            },
        );
    });
    const callDeleteSpool = safeAsync(async (spoolDbId) => {
        return callApi(
            `deleteSpool/${spoolDbId}`,
            {
                method: "DELETE",
            },
        );
    });
    const callSelectSpool = safeAsync(
        /**
         * @param {{
         *  toolIndex: number;
         *  spoolDbId?: number;
         *  shouldCommitCurrentSpoolProgress?: boolean;
         * }} params
         */
        async (params) => {
            const { toolIndex, spoolDbId, shouldCommitCurrentSpoolProgress } = params;

            const finalSpoolDbId = spoolDbId ?? -1;

            const payload = {
                databaseId: finalSpoolDbId,
                toolIndex,
                commitCurrentSpoolValues: shouldCommitCurrentSpoolProgress
            }

            return callApi(
                `selectSpool`,
                {
                    method: "PUT",
                    body: JSON.stringify(payload),
                },
            );
        }
    );
    const allowedToPrint = safeAsync(async () => {
        return callApi(
            `allowedToPrint`,
            {
                method: "GET",
            },
        );
    });
    const startPrintConfirmed = safeAsync(async () => {
        return callApi(
            `startPrintConfirmed`,
            {
                method: "GET",
            },
        );
    });
    const callDeleteDatabase = safeAsync(
        /**
         * @param {{
         *  databaseType: string;
         *  databaseSettings: unknown;
         * }} params
         */
        async (params) => {
            const { databaseType, databaseSettings } = params;

            return callApi(
                `deleteDatabase/${databaseType}`,
                {
                    method: "POST",
                    body: ko.toJSON(databaseSettings),
                },
            );
        }
    );

    this.loadDatabaseMetaData = loadDatabaseMetaData;
    this.testDatabaseConnection = testDatabaseConnection;
    this.confirmDatabaseProblemMessage = confirmDatabaseProblemMessage;
    this.callLoadSelectedSpools = callLoadSelectedSpools;
    this.callLoadSpoolsByQuery = callLoadSpoolsByQuery;
    this.callSaveSpool = callSaveSpool;
    this.callDeleteSpool = callDeleteSpool;
    this.callSelectSpool = callSelectSpool;
    this.allowedToPrint = allowedToPrint;
    this.startPrintConfirmed = startPrintConfirmed;
    this.callDeleteDatabase = callDeleteDatabase;

    this.getExportUrl = function(exportType){
        const endpointUrl = buildApiUrl(`exportSpools/${exportType}`);

        return _addApiKeyIfNecessary(endpointUrl);
    }
    this.getSampleCSVUrl = function(exportType){
        const endpointUrl = buildApiUrl(`sampleCSV`);

        return _addApiKeyIfNecessary(endpointUrl);
    }
    this.getDownloadDatabaseUrl = function(exportType){
        const endpointUrl = buildApiUrl(`downloadDatabase`);

        return _addApiKeyIfNecessary(endpointUrl);
    }
}
