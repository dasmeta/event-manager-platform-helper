const { recordStart, recordSuccess, recordFailure, recordPreconditionFailure, hasReachedMaxAttempts } = require("../event-logger");
const { getPlatformAdapters } = require("../adapter/factory");

const wrapHandler = (handler, platform = 'gcf') => {
    const { getEvent, getTopic, getFunctionName, getResponse } = getPlatformAdapters(platform);

    // workaround of fn.length issue with ... operator
    return async (first, ...rest) => {
        const allContext = [first, ...rest]
        const event = getEvent(allContext);
        const topic = getTopic(allContext);
        const functionName = getFunctionName(allContext);

        // @todo check eventId, traceId
        const { eventId, traceId, data, dataSource, subscription = "" } = event;

        const eventInfo = {
            topic,
            subscription: functionName,
            maxAttempts: process.env.MAX_ATTEMPTS,
            eventId,
            traceId,
        };

        // @todo check abbreviating
        if (subscription && subscription !== functionName) {
            console.log("Skip event because the handler is another", eventInfo);
            return;
        }

        await recordStart(eventInfo);

        let response;
        try {
            response = await handler(data, { topic, subscription, traceId, dataSource });

            await recordSuccess(eventInfo);
        } catch (error) {
            console.error("Error", error, { eventInfo, data, dataSource });

            if (error.message.includes("PreconditionFailedError")) {
                if ((await hasReachedMaxAttempts({ ...eventInfo }))) {
                    await recordFailure({ ...eventInfo, error });
                    throw error;
                }
                await recordPreconditionFailure({ ...eventInfo });
            } else {
                await recordFailure({ ...eventInfo, error });
                throw error;
            }
        }

        return getResponse(response);
    };
};

module.exports = {
    wrapHandler,
};
