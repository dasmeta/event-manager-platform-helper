const { EventSubscriptionApi } = require("@dasmeta/event-manager-node-api");
const { getPlatformAdapters } = require("../adapter/factory");

const wrapHandler = (handler, platform = 'gcf') => {
    const { getEvent, getTopic, getFunctionName, getResponse } = getPlatformAdapters(platform);

    // workaround of fn.length issue with ... operator
    return async (first, ...rest) => {
        const allContext = [first, ...rest]
        const event = getEvent(allContext);
        const topic = getTopic(allContext);
        const functionName = getFunctionName(allContext);

        const { eventId, traceId, data, dataSource, subscription = "" } = event;

        const eventInfo = {
            topic,
            subscription: functionName,
            maxAttempts: process.env.MAX_ATTEMPTS,
            eventId,
            traceId,
        };

        if (subscription && subscription !== functionName) {
            console.log("Skip event because the handler is another", eventInfo);
            return;
        }

        const api = new EventSubscriptionApi({ basePath: process.env.EVENT_MANAGER_BACKEND_HOST });

        await api.eventSubscriptionsRecordStartPost(eventInfo);

        let response;
        try {
            response = await handler(data, { topic, subscription, traceId, dataSource });

            await api.eventSubscriptionsRecordSuccessPost(eventInfo);
        } catch (error) {
            console.error("Error", error, { eventInfo, data, dataSource });

            if (error.message.includes("PreconditionFailedError")) {
                if ((await api.eventSubscriptionsHasReachedMaxAttemptsGet(topic, subscription, eventId, eventInfo.maxAttempts))) {
                    await api.eventSubscriptionsRecordFailurePost({ ...eventInfo, error });
                    throw error;
                }
                await api.eventSubscriptionsRecordPreconditionFailurePost({ ...eventInfo });
            } else {
                await api.eventSubscriptionsRecordFailurePost({ ...eventInfo, error });
                throw error;
            }
        }

        return getResponse(response);
    };
};

module.exports = {
    wrapHandler,
};
