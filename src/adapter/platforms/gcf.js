const getEvent = (allContext) => {
    const event = allContext[0];

    const parsedEvent = JSON.parse(Buffer.from(event.data, "base64").toString());
    if (!parsedEvent) {
        console.error("Unable to parse pub/sub message", event);
    }
    return parsedEvent;
}

const getTopic = (allContext) => {
    const context = allContext[1];
    return context.resource.name.split("/").pop();
}

const getFunctionName = (allContext) => {
    return process.env.FUNCTION_NAME || process.env.K_SERVICE;
}

const getResponse = (response) => {

}

module.exports = {
    getEvent,
    getTopic,
    getFunctionName,
    getResponse
}
