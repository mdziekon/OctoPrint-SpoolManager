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

    // see https://gomakethings.com/how-to-build-a-query-string-from-an-object-with-vanilla-js/
    var _buildRequestQuery = function (data) {
        // If the data is already a string, return it as-is
        if (typeof (data) === 'string') return data;

        // Create a query array to hold the key/value pairs
        var query = [];

        // Loop through the data object
        for (var key in data) {
            if (data.hasOwnProperty(key)) {

                // Encode each key and value, concatenate them into a string, and push them to the array
                query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
            }
        }
        // Join each item in the array with a `&` and return the resulting string
        return query.join('&');

    };

    var _addApiKeyIfNecessary = function(urlContext){
        if (UI_API_KEY){
            urlContext = urlContext + "?apikey=" + UI_API_KEY;
        }
        return urlContext;
    }

    this.getExportUrl = function(exportType){
        return _addApiKeyIfNecessary("./plugin/" + this.pluginId + "/exportSpools/" + exportType);
    }

    this.getSampleCSVUrl = function(){
        return _addApiKeyIfNecessary("./plugin/" + this.pluginId + "/sampleCSV");
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

    //////////////////////////////////////////////////////////////////////////////// LOAD DatabaseMetaData
    const loadDatabaseMetaData = safeAsync(async () => {
        return callApi(
            "loadDatabaseMetaData",
            {
                method: "GET",
            },
        );
    });
    this.loadDatabaseMetaData = loadDatabaseMetaData;

    //////////////////////////////////////////////////////////////////////////////// TEST DatabaseConnection
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
    this.testDatabaseConnection = testDatabaseConnection;

    //////////////////////////////////////////////////////////////////////////////// CONFIRM DatabaseConnectionPoblem
    const confirmDatabaseProblemMessage = safeAsync(async () => {
        return callApi(
            "confirmDatabaseProblemMessage",
            {
                method: "PUT",
            },
        );
    });
    this.confirmDatabaseProblemMessage = confirmDatabaseProblemMessage;


    //////////////////////////////////////////////////////////////////////////////// LOAD FILTERED/SORTED PrintJob-Items
    const callLoadSpoolsByQuery = safeAsync(async (tableQuery) => {
        const queryParams = _buildRequestQuery(tableQuery);

        return callApi(
            `loadSpoolsByQuery?${queryParams}`,
            {
                method: "GET",
            },
        );
    });
    this.callLoadSpoolsByQuery = callLoadSpoolsByQuery;


    //////////////////////////////////////////////////////////////////////////////////////////////////// SAVE Spool-Item
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
    this.callSaveSpool = callSaveSpool;

    ////////////////////////////////////////////////////////////////////////////////////////////////// DELETE Spool-Item
    const callDeleteSpool = safeAsync(async (spoolDbId) => {
        return callApi(
            `deleteSpool/${spoolDbId}`,
            {
                method: "DELETE",
            },
        );
    });
    this.callDeleteSpool = callDeleteSpool;

    ////////////////////////////////////////////////////////////////////////////////////////////////// SELECT Spool-Item
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
    this.callSelectSpool = callSelectSpool;

    /////////////////////////////////////////////////////////////////////////////////////////////////// ALLOWED TO PRINT
    const allowedToPrint = safeAsync(async () => {
        return callApi(
            `allowedToPrint`,
            {
                method: "GET",
            },
        );
    });
    this.allowedToPrint = allowedToPrint;

    /////////////////////////////////////////////////////////////////////////////////////////////////// START PRINT CONFIRMED
    const startPrintConfirmed = safeAsync(async () => {
        return callApi(
            `startPrintConfirmed`,
            {
                method: "GET",
            },
        );
    });
    this.startPrintConfirmed = startPrintConfirmed;

    //////////////////////////////////////////////////////////////////////////////////////////////////// DELETE Database
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
    this.callDeleteDatabase = callDeleteDatabase;

    ////////////////////////////////////////////////////////////////////////////////////////////////// DOWNLOAD Database
    this.getDownloadDatabaseUrl = function(exportType){
        return _addApiKeyIfNecessary("./plugin/" + this.pluginId + "/downloadDatabase");
    }
}
