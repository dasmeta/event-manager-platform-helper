const { MongoClient, ObjectId } = require("mongodb");
const EventEmitter = require("events");

class ConnectionEmitter extends EventEmitter {}
const connectionEmitter = new ConnectionEmitter();

const connectionsWaiting = new Map();
const connections = {};

const getConnection = async (alias, options) => {
    if (alias in connections) {
        return connections[alias];
    }
    if (connectionsWaiting.has(alias)) {
        return new Promise(resolve => {
            connectionEmitter.setMaxListeners(connectionEmitter.getMaxListeners() + 1);
            connectionEmitter.once(alias, () => {
                resolve(connections[alias]);
                connectionEmitter.setMaxListeners(Math.max(connectionEmitter.getMaxListeners() - 1, 0));
            });
        });
    }
    connectionsWaiting.set(alias, true);

    const { url } = options;

    const connection = await MongoClient.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    connections[alias] = connection;
    connectionsWaiting.delete(alias);
    connectionEmitter.emit(alias);
    return connection;
};

const getConnectionUrl = alias => {
    const ALIAS = alias.toLocaleUpperCase();
    return {
        url: process.env[`DATABASE_URL_${ALIAS}`] || "mongodb://localhost",
        db: alias
    }
}

const getDb = async alias => {
    const options = getConnectionUrl(alias);
    const connection = await getConnection(alias, options);
    return connection.db(options.db);
};

const recordStart = async ({ topic, subscription, eventId, traceId }) => {
    const db = await getDb("event");
    const subscriptionCollection = db.collection("event_subscription");

    const ObjectEventId = new ObjectId(eventId);

    await subscriptionCollection.findOneAndUpdate(
        {
            eventId: ObjectEventId,
            subscription: subscription,
        },
        {
            $setOnInsert: {
                createdAt: new Date(),
                eventId: ObjectEventId,
                topic,
                traceId,
                subscription: subscription,
            },
            $set: {
                updatedAt: new Date(),
                isSuccess: false,
                isError: false,
                isPreconditionFail: false,
            },
        },
        { upsert: true }
    );
};

const recordSuccess = async ({ topic, subscription, eventId, traceId }) => {
    const db = await getDb("event");
    const subscriptionCollection = db.collection("event_subscription");

    const ObjectEventId = new ObjectId(eventId);

    await subscriptionCollection.updateOne(
        {
            eventId: ObjectEventId,
            subscription: subscription,
        },
        {
            $set: {
                eventId: ObjectEventId,
                traceId,
                topic,
                subscription: subscription,
                updatedAt: new Date(),
                isSuccess: true,
                isError: false,
                isPreconditionFail: false,
            },
        },
        { upsert: true }
    );
};

const recordFailure = async ({ topic, subscription, eventId, traceId, error }) => {
    const db = await getDb("event");
    const subscriptionCollection = db.collection("event_subscription");

    const ObjectEventId = new ObjectId(eventId);

    const errObject = Object.getOwnPropertyNames(error).reduce((acc, key) => {
        acc[key] = error[key];
        return acc;
    }, {});

    await subscriptionCollection.updateOne(
        {
            eventId: ObjectEventId,
            subscription: subscription,
        },
        {
            $set: {
                eventId: ObjectEventId,
                traceId,
                topic,
                subscription: subscription,
                updatedAt: new Date(),
                isSuccess: false,
                isError: true,
                isPreconditionFail: false,
                error: errObject,
            },
        },
        { upsert: true }
    );
};

const recordPreconditionFailure = async ({ topic, subscription, eventId, traceId }) => {
    const db = await getDb("event");
    const subscriptionCollection = db.collection("event_subscription");

    const ObjectEventId = new ObjectId(eventId);

    await subscriptionCollection.updateOne(
        {
            eventId: ObjectEventId,
            subscription: subscription,
        },
        {
            $set: {
                eventId: ObjectEventId,
                traceId,
                topic,
                subscription: subscription,
                updatedAt: new Date(),
                isSuccess: false,
                isError: false,
                isPreconditionFail: true
            },
        },
        { upsert: true }
    );
};

const hasReachedMaxAttempts = async ({ topic, subscription, eventId, maxAttempts }) => {
    const db = await getDb("event");
    const subscriptionCollection = db.collection("event_subscription");

    const ObjectEventId = new ObjectId(eventId);

    const events = await subscriptionCollection.find({
        eventId: ObjectEventId,
        subscription,
        topic,
        attempts: { $gt: parseInt(maxAttempts) }
    }).toArray();

    return !!events.length;
};

module.exports = {
    recordStart,
    recordSuccess,
    recordFailure,
    recordPreconditionFailure,
    hasReachedMaxAttempts
};
